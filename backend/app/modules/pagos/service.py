"""
Servicio de Pagos — integración MercadoPago Checkout PRO.

- Genera un idempotency_key (UUID) por backend para evitar cobros duplicados.
- Registra/actualiza la transacción en la tabla Pago (estado, monto, método).
- El webhook IPN confirma el pago, avanza el pedido y dispara la notificación WS
  DESDE EL ROUTER (post-commit, fuera del bloque UoW).
"""
import uuid
from decimal import Decimal

import mercadopago
from fastapi import HTTPException

from app.core.config import settings
from app.core.uow import UnitOfWork
from app.modules.pagos.model import Pago, PagoRead
from app.modules.pagos.schema import PagoCreate, PagoResponse, PagoConfirmar
from app.modules.pedidos.service import update_pedido_estado

# Configurar SDK
sdk = mercadopago.SDK(settings.MP_ACCESS_TOKEN) if settings.MP_ACCESS_TOKEN else None


def _ensure_pago(pedido, uow: UnitOfWork) -> Pago:
    """Obtiene el Pago del pedido o lo crea con idempotency_key y external_reference."""
    pago = uow.pagos.get_by_pedido(pedido.id)
    if pago is None:
        pago = Pago(
            pedido_id=pedido.id,
            mp_status="pending",
            transaction_amount=pedido.total,
            external_reference=str(pedido.id),
            idempotency_key=str(uuid.uuid4()),
        )
        uow.pagos.add(pago)
    return pago


def procesar_pago(data: PagoCreate, usuario_id: int, uow: UnitOfWork) -> PagoResponse:
    if sdk is None:
        raise HTTPException(status_code=503, detail="MercadoPago no está configurado (MP_ACCESS_TOKEN ausente)")

    with uow:
        pedido = uow.pedidos.get_by_id_active(data.pedido_id)
        if not pedido:
            raise HTTPException(status_code=404, detail="Pedido no encontrado")
        if pedido.usuario_id != usuario_id:
            raise HTTPException(status_code=403, detail="No tienes permiso para pagar este pedido")
        if pedido.estado_codigo != "PENDIENTE":
            raise HTTPException(status_code=400, detail=f"El pedido está en estado {pedido.estado_codigo} y no se puede pagar")

        # Pago idempotente: reutiliza la misma key si el pedido ya tenía un intento.
        pago = _ensure_pago(pedido, uow)
        idempotency_key = pago.idempotency_key
        external_reference = pago.external_reference

        ngrok_url = settings.NGROK_URL or "http://localhost:8000"
        preference_data = {
            "items": [
                {
                    "title": f"Pedido #{pedido.id} en FastFood",
                    "quantity": 1,
                    "unit_price": float(pedido.total),
                    "currency_id": "ARS",
                }
            ],
            "payer": {"email": f"usuario_{usuario_id}@fastfood.com"},
            "back_urls": {
                "success": f"{ngrok_url}/api/v1/pagos/redirect/{pedido.id}/success",
                "failure": f"{ngrok_url}/api/v1/pagos/redirect/{pedido.id}/failure",
                "pending": f"{ngrok_url}/api/v1/pagos/redirect/{pedido.id}/pending",
            },
            "auto_return": "all" if settings.NGROK_URL else "",
            "notification_url": f"{settings.NGROK_URL}/api/v1/pagos/webhook" if settings.NGROK_URL else None,
            "external_reference": external_reference,
        }

        try:
            # idempotency_key generado por backend evita cobros duplicados por reintento.
            request_options = mercadopago.config.RequestOptions()
            request_options.custom_headers = {"x-idempotency-key": idempotency_key}
            preference_response = sdk.preference().create(preference_data, request_options)
            if preference_response["status"] not in [200, 201]:
                error_detail = preference_response.get("response", "Error desconocido en MercadoPago")
                raise HTTPException(status_code=400, detail=f"MP Error: {error_detail}")

            preference = preference_response["response"]
            return PagoResponse(init_point=preference["init_point"])
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(status_code=400, detail=str(e))


def procesar_webhook_pago(payment_id: str, uow: UnitOfWork) -> dict | None:
    """Procesa la notificación IPN. Devuelve el evento WS a emitir (o None)."""
    if sdk is None:
        return None

    payment_info = sdk.payment().get(payment_id)
    if payment_info["status"] not in [200, 201]:
        return None

    payment = payment_info["response"]
    mp_status = payment.get("status")
    external_reference = payment.get("external_reference")
    if not external_reference:
        return None

    # 1) Actualizar el registro de Pago con los datos devueltos por MP.
    with uow:
        pago = uow.pagos.get_by_external_reference(str(external_reference))
        if pago:
            pago.mp_payment_id = payment.get("id")
            pago.mp_status = mp_status or pago.mp_status
            pago.mp_status_detail = payment.get("status_detail")
            ta = payment.get("transaction_amount")
            if ta is not None:
                pago.transaction_amount = Decimal(str(ta))
            pago.payment_method_id = payment.get("payment_method_id")
            uow.pagos.touch(pago)

    # 2) Si fue aprobado, avanzar el pedido a CONFIRMADO (FSM) y emitir evento WS.
    if mp_status == "approved":
        pedido_id = int(external_reference)
        with uow:
            pedido = uow.pedidos.get_by_id_active(pedido_id)
            if pedido and pedido.estado_codigo == "PENDIENTE":
                update_pedido_estado(pedido_id, "CONFIRMADO", pedido.usuario_id, uow)
                return {
                    "type": "PEDIDO_UPDATED",
                    "event": "pago_confirmado",
                    "pedido_id": pedido_id,
                    "estado_nuevo": "CONFIRMADO",
                }
    return None


def get_pago_de_pedido(pedido_id: int, usuario_id: int, roles: list[str], uow: UnitOfWork) -> PagoRead:
    with uow:
        pedido = uow.pedidos.get_by_id_active(pedido_id)
        if not pedido:
            raise HTTPException(status_code=404, detail="Pedido no encontrado")
        is_staff = any(r in ["ADMIN", "PEDIDOS"] for r in roles)
        if not is_staff and pedido.usuario_id != usuario_id:
            raise HTTPException(status_code=403, detail="Acceso denegado")
        pago = uow.pagos.get_by_pedido(pedido_id)
        if not pago:
            raise HTTPException(status_code=404, detail="No hay pago registrado para este pedido")
        return PagoRead(
            id=pago.id,
            pedido_id=pago.pedido_id,
            mp_payment_id=pago.mp_payment_id,
            mp_status=pago.mp_status,
            mp_status_detail=pago.mp_status_detail,
            transaction_amount=pago.transaction_amount,
            payment_method_id=pago.payment_method_id,
            external_reference=pago.external_reference,
            created_at=pago.created_at,
        )


def confirmar_pago_manual(data: PagoConfirmar, usuario_id: int, uow: UnitOfWork):
    with uow:
        pedido = uow.pedidos.get_by_id_active(data.pedido_id)
        if not pedido:
            raise HTTPException(status_code=404, detail="Pedido no encontrado")
        if pedido.usuario_id != usuario_id:
            raise HTTPException(status_code=403, detail="No tienes permiso")
        if pedido.estado_codigo == "PENDIENTE":
            update_pedido_estado(pedido.id, "CONFIRMADO", usuario_id, uow)
        return {"status": "ok"}
