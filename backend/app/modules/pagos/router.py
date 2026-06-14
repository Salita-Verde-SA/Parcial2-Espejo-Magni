from typing import Annotated

from fastapi import APIRouter, Depends, Request
from fastapi.responses import RedirectResponse

from app.core.uow import UnitOfWork, get_uow
from app.core.deps import get_current_user, get_current_active_user
from app.core.websockets import manager
from app.modules.pagos.model import PagoRead
from app.modules.pagos.schema import PagoCreate, PagoResponse, PagoConfirmar
from app.modules.pagos.service import (
    procesar_pago,
    confirmar_pago_manual,
    procesar_webhook_pago,
    get_pago_de_pedido,
)

router = APIRouter(prefix="/api/v1/pagos", tags=["Pagos"])


@router.get("/redirect/{pedido_id}/{status}")
def redirect_to_frontend(pedido_id: int, status: str, request: Request):
    # Recibimos el redirect de Mercado Pago y mandamos al usuario a su frontend local
    from app.core.config import settings
    base_url = f"{settings.FRONTEND_URL}/pago/{status}"
    query_params = request.query_params
    q = "&".join([f"{k}={v}" for k, v in query_params.items()])
    return RedirectResponse(url=f"{base_url}?{q}")


@router.post("/webhook")
async def webhook_mercadopago(request: Request, uow: UnitOfWork = Depends(get_uow)):
    """Endpoint IPN de MercadoPago. Actualiza el pago/pedido y notifica vía WS."""
    try:
        body = await request.json()
        topic = body.get("type") or body.get("topic")
        payment_id = body.get("data", {}).get("id")
    except Exception:
        topic = request.query_params.get("topic") or request.query_params.get("type")
        payment_id = request.query_params.get("data.id") or request.query_params.get("id")

    if topic == "payment" and payment_id:
        evento = procesar_webhook_pago(payment_id, uow)
        # Broadcast WS post-commit (fuera del bloque UoW)
        if evento:
            await manager.broadcast(evento)

    return {"status": "ok"}


@router.post("/crear", response_model=PagoResponse)
def crear_pago(
    data: PagoCreate,
    ctx: tuple = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
):
    current_user, _ = ctx
    return procesar_pago(data, current_user.id, uow)


@router.get("/{pedido_id}", response_model=PagoRead)
def consultar_pago(
    pedido_id: int,
    ctx: Annotated[tuple, Depends(get_current_active_user)],
    uow: UnitOfWork = Depends(get_uow),
):
    user, roles = ctx
    return get_pago_de_pedido(pedido_id, user.id, roles, uow)


@router.post("/confirmar")
async def confirmar_pago(
    data: PagoConfirmar,
    ctx: tuple = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
):
    current_user, _ = ctx
    evento = confirmar_pago_manual(data, current_user.id, uow)
    if evento:
        await manager.broadcast(evento)
    return {"status": "ok"}
