import mercadopago
from fastapi import HTTPException
from app.core.config import settings
from app.core.uow import UnitOfWork
from app.modules.pagos.schema import PagoCreate, PagoResponse, PagoConfirmar
from app.modules.pedidos.service import update_pedido_estado

# Configurar SDK
sdk = mercadopago.SDK(settings.MP_ACCESS_TOKEN)

def procesar_pago(data: PagoCreate, usuario_id: int, uow: UnitOfWork) -> PagoResponse:
    with uow:
        pedido = uow.pedidos.get_by_id_active(data.pedido_id)
        if not pedido:
            raise HTTPException(status_code=404, detail="Pedido no encontrado")
        
        if pedido.usuario_id != usuario_id:
            raise HTTPException(status_code=403, detail="No tienes permiso para pagar este pedido")
            
        if pedido.estado_codigo != "PENDIENTE":
            raise HTTPException(status_code=400, detail=f"El pedido está en estado {pedido.estado_codigo} y no se puede pagar")
            
        ngrok_url = settings.NGROK_URL or "http://localhost:8000"
        
        preference_data = {
            "items": [
                {
                    "title": f"Pedido #{pedido.id} en FastFood",
                    "quantity": 1,
                    "unit_price": float(pedido.total),
                    "currency_id": "ARS"
                }
            ],
            "payer": {
                "email": f"usuario_{usuario_id}@fastfood.com"
            },
            "back_urls": {
                "success": f"{ngrok_url}/api/v1/pagos/redirect/{pedido.id}/success",
                "failure": f"{ngrok_url}/api/v1/pagos/redirect/{pedido.id}/failure",
                "pending": f"{ngrok_url}/api/v1/pagos/redirect/{pedido.id}/pending"
            },
            "auto_return": "all" if settings.NGROK_URL else "",
            "notification_url": f"{settings.NGROK_URL}/api/v1/pagos/webhook" if settings.NGROK_URL else None,
            "external_reference": str(pedido.id)
        }
        
        try:
            preference_response = sdk.preference().create(preference_data)
            if preference_response["status"] not in [200, 201]:
                error_detail = preference_response.get("response", "Error desconocido en MercadoPago")
                raise HTTPException(status_code=400, detail=f"MP Error: {error_detail}")
                
            preference = preference_response["response"]
            return PagoResponse(init_point=preference["init_point"])
                
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(status_code=400, detail=str(e))

def procesar_webhook_pago(payment_id: str, uow: UnitOfWork):
    payment_info = sdk.payment().get(payment_id)
    if payment_info["status"] in [200, 201]:
        payment = payment_info["response"]
        mp_status = payment.get("status")
        external_reference = payment.get("external_reference")
        
        if mp_status == "approved" and external_reference:
            pedido_id = int(external_reference)
            with uow:
                pedido = uow.pedidos.get_by_id_active(pedido_id)
                if pedido and pedido.estado_codigo == "PENDIENTE":
                    update_pedido_estado(pedido_id, "CONFIRMADO", pedido.usuario_id, uow)

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
