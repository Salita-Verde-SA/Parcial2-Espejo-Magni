from datetime import date, timedelta
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query

from app.core.deps import require_roles
from app.core.uow import UnitOfWork, get_uow
from app.modules.estadisticas.schema import (
    ResumenResponse,
    VentasPeriodoItem,
    ProductoTopItem,
    PedidosEstadoItem,
    IngresosFormaPagoItem,
)
from app.modules.estadisticas.service import (
    get_resumen,
    get_ventas,
    get_productos_top,
    get_pedidos_por_estado,
    get_ingresos,
)

router = APIRouter(
    prefix="/api/v1/estadisticas",
    tags=["estadisticas"],
    dependencies=[Depends(require_roles(["ADMIN"]))],
)


@router.get("/resumen", response_model=ResumenResponse)
def resumen(uow: Annotated[UnitOfWork, Depends(get_uow)]):
    return get_resumen(uow)


@router.get("/ventas", response_model=list[VentasPeriodoItem])
def ventas(
    uow: Annotated[UnitOfWork, Depends(get_uow)],
    desde: Optional[date] = Query(None),
    hasta: Optional[date] = Query(None),
    agrupacion: str = Query("day"),
):
    hasta = hasta or date.today()
    desde = desde or (hasta - timedelta(days=30))
    return get_ventas(desde, hasta, agrupacion, uow)


@router.get("/productos-top", response_model=list[ProductoTopItem])
def productos_top(
    uow: Annotated[UnitOfWork, Depends(get_uow)],
    limit: int = Query(5, ge=1, le=50),
):
    return get_productos_top(limit, uow)


@router.get("/pedidos-por-estado", response_model=list[PedidosEstadoItem])
def pedidos_por_estado(uow: Annotated[UnitOfWork, Depends(get_uow)]):
    return get_pedidos_por_estado(uow)


@router.get("/ingresos", response_model=list[IngresosFormaPagoItem])
def ingresos(
    uow: Annotated[UnitOfWork, Depends(get_uow)],
    desde: Optional[date] = Query(None),
    hasta: Optional[date] = Query(None),
):
    hasta = hasta or date.today()
    desde = desde or (hasta - timedelta(days=30))
    return get_ingresos(desde, hasta, uow)
