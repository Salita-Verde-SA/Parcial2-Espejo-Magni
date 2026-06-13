"""
Servicio de estadísticas — ensambla los KPIs y series para el dashboard ADMIN.
Solo lectura. Montos siempre Decimal (EST-04).
"""
from datetime import date, datetime, time, timezone
from decimal import Decimal

from app.core.uow import UnitOfWork
from app.modules.estadisticas.schema import (
    ResumenResponse,
    VentasPeriodoItem,
    ProductoTopItem,
    PedidosEstadoItem,
    IngresosFormaPagoItem,
)


def _hoy_rango() -> tuple[datetime, datetime]:
    hoy = datetime.now(timezone.utc).date()
    return datetime.combine(hoy, time.min), datetime.combine(hoy, time.max)


def _mes_rango() -> tuple[datetime, datetime]:
    ahora = datetime.now(timezone.utc)
    inicio = datetime.combine(ahora.date().replace(day=1), time.min)
    return inicio, ahora


def get_resumen(uow: UnitOfWork) -> ResumenResponse:
    with uow:
        repo = uow.estadisticas
        h0, h1 = _hoy_rango()
        m0, m1 = _mes_rango()
        ventas_hoy, _ = repo.ventas_total(h0, h1)
        ventas_mes, cant_mes = repo.ventas_total(m0, m1)
        ticket = (ventas_mes / cant_mes).quantize(Decimal("0.01")) if cant_mes else Decimal("0.00")
        return ResumenResponse(
            ventas_hoy=ventas_hoy,
            ticket_promedio=ticket,
            pedidos_activos=repo.pedidos_activos(),
            ventas_mes=ventas_mes,
        )


def get_ventas(desde: date, hasta: date, agrupacion: str, uow: UnitOfWork) -> list[VentasPeriodoItem]:
    if agrupacion not in ("day", "week", "month"):
        agrupacion = "day"
    with uow:
        filas = uow.estadisticas.ventas_periodo(desde, hasta, agrupacion)
        return [
            VentasPeriodoItem(periodo=p, total_ventas=tv, cantidad_pedidos=c)
            for p, tv, c in filas
        ]


def get_productos_top(limit: int, uow: UnitOfWork) -> list[ProductoTopItem]:
    with uow:
        filas = uow.estadisticas.productos_top(limit)
        return [
            ProductoTopItem(producto_id=pid, nombre=n, cantidad_vendida=cant, ingresos=ing)
            for pid, n, cant, ing in filas
        ]


def get_pedidos_por_estado(uow: UnitOfWork) -> list[PedidosEstadoItem]:
    with uow:
        filas = uow.estadisticas.pedidos_por_estado()
        return [PedidosEstadoItem(estado_codigo=e, cantidad=c) for e, c in filas]


def get_ingresos(desde: date, hasta: date, uow: UnitOfWork) -> list[IngresosFormaPagoItem]:
    with uow:
        filas = uow.estadisticas.ingresos_por_forma_pago(desde, hasta)
        return [
            IngresosFormaPagoItem(forma_pago_codigo=fp, total=t, cantidad=c)
            for fp, t, c in filas
        ]
