from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from app.core.uow import UnitOfWork, get_uow
from app.core.deps import get_current_user
from app.modules.pagos.schema import PagoCreate, PagoResponse, PagoConfirmar
from app.modules.pagos.service import procesar_pago, confirmar_pago_manual, procesar_webhook_pago

router = APIRouter(prefix="/api/v1/pagos", tags=["Pagos"])

@router.get("/redirect/{pedido_id}/{status}")
def redirect_to_frontend(pedido_id: int, status: str, request: Request):
    # Recibimos el redirect de Mercado Pago y mandamos al usuario a su frontend local
    base_url = f"http://localhost:5173/pago/{status}"
    query_params = request.query_params
    
    # Reconstruimos los parametros que mandó MP
    q = "&".join([f"{k}={v}" for k, v in query_params.items()])
    return RedirectResponse(url=f"{base_url}?{q}")

@router.post("/webhook")
async def webhook_mercadopago(request: Request, uow: UnitOfWork = Depends(get_uow)):
    try:
        body = await request.json()
        topic = body.get("type") or body.get("topic")
        payment_id = body.get("data", {}).get("id")
    except:
        topic = request.query_params.get("topic") or request.query_params.get("type")
        payment_id = request.query_params.get("data.id") or request.query_params.get("id")
        
    if topic == "payment" and payment_id:
        procesar_webhook_pago(payment_id, uow)
        
    return {"status": "ok"}

@router.post("/crear", response_model=PagoResponse)
def crear_pago(
    data: PagoCreate,
    ctx: tuple = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow)
):
    current_user, _ = ctx
    return procesar_pago(data, current_user.id, uow)

@router.post("/confirmar")
def confirmar_pago(
    data: PagoConfirmar,
    ctx: tuple = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow)
):
    current_user, _ = ctx
    return confirmar_pago_manual(data, current_user.id, uow)
