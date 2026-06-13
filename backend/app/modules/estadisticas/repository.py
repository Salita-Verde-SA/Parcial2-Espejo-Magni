"""
Repository de estadísticas — queries de solo lectura sobre el modelo existente.

Reglas (Sección 11):
  EST-01: nunca incluir pedidos CANCELADO en ingresos / cantidades vendidas.
  EST-02: usar subtotal_snap de DetallePedido para ingresos por producto.
  EST-03: "ingreso confirmado" = pedido no cancelado en estado CONFIRMADO/EN_PREP/ENTREGADO
          (equivalente a pago aprobado: el webhook MP approved → CONFIRMADO).
  EST-04: todos los montos son Decimal (Numeric), nunca float.
  EST-05: las queries de período usan BETWEEN sobre date.

Portabilidad: en PostgreSQL agrupa con DATE_TRUNC; en SQLite (tests) usa strftime.
"""
from datetime import date, datetime, time, timezone
from decimal import Decimal
from typing import List, Tuple

from sqlalchemy import func
from sqlmodel import Session, select

from app.modules.pedidos.model import Pedido, DetallePedido
from app.modules.productos.model import Producto

ESTADOS_INGRESO = ("CONFIRMADO", "EN_PREP", "ENTREGADO")


class EstadisticasRepository:
    def __init__(self, session: Session):
        self.session = session

    @property
    def _dialect(self) -> str:
        bind = self.session.get_bind()
        return bind.dialect.name if bind else "sqlite"

    def _periodo_expr(self, agrupacion: str):
        """Expresión SQL para agrupar Pedido.fecha por día/semana/mes."""
        if self._dialect == "postgresql":
            return func.to_char(func.date_trunc(agrupacion, Pedido.fecha), "YYYY-MM-DD")
        # SQLite (tests)
        fmt = {"day": "%Y-%m-%d", "week": "%Y-%W", "month": "%Y-%m"}.get(agrupacion, "%Y-%m-%d")
        return func.strftime(fmt, Pedido.fecha)

    # ── KPIs ───────────────────────────────────────────────────────────────────
    def ventas_total(self, desde: datetime, hasta: datetime) -> Tuple[Decimal, int]:
        stmt = (
            select(func.coalesce(func.sum(Pedido.total), 0), func.count(Pedido.id))
            .where(Pedido.deleted_at.is_(None))
            .where(Pedido.estado_codigo != "CANCELADO")
            .where(Pedido.fecha >= desde)
            .where(Pedido.fecha <= hasta)
        )
        total, cantidad = self.session.exec(stmt).one()
        return Decimal(str(total or 0)), int(cantidad or 0)

    def pedidos_activos(self) -> int:
        stmt = (
            select(func.count(Pedido.id))
            .where(Pedido.deleted_at.is_(None))
            .where(Pedido.estado_codigo.in_(("PENDIENTE", "CONFIRMADO", "EN_PREP")))
        )
        return int(self.session.exec(stmt).one() or 0)

    # ── Ventas por período ──────────────────────────────────────────────────────
    def ventas_periodo(
        self, desde: date, hasta: date, agrupacion: str
    ) -> List[Tuple[str, Decimal, int]]:
        periodo = self._periodo_expr(agrupacion)
        d0 = datetime.combine(desde, time.min)
        d1 = datetime.combine(hasta, time.max)
        stmt = (
            select(
                periodo.label("periodo"),
                func.coalesce(func.sum(Pedido.total), 0),
                func.count(Pedido.id),
            )
            .where(Pedido.deleted_at.is_(None))
            .where(Pedido.estado_codigo != "CANCELADO")
            .where(Pedido.fecha >= d0)
            .where(Pedido.fecha <= d1)
            .group_by(periodo)
            .order_by(periodo)
        )
        return [
            (str(p), Decimal(str(tv or 0)), int(c or 0))
            for p, tv, c in self.session.exec(stmt).all()
        ]

    # ── Productos top ────────────────────────────────────────────────────────────
    def productos_top(self, limit: int) -> List[Tuple[int, str, int, Decimal]]:
        stmt = (
            select(
                DetallePedido.producto_id,
                func.coalesce(func.sum(DetallePedido.cantidad), 0),
                func.coalesce(func.sum(DetallePedido.subtotal_snap), 0),
            )
            .join(Pedido, Pedido.id == DetallePedido.pedido_id)
            .where(Pedido.deleted_at.is_(None))
            .where(Pedido.estado_codigo != "CANCELADO")
            .group_by(DetallePedido.producto_id)
            .order_by(func.coalesce(func.sum(DetallePedido.subtotal_snap), 0).desc())
            .limit(limit)
        )
        filas = self.session.exec(stmt).all()
        resultado = []
        for producto_id, cantidad, ingresos in filas:
            prod = self.session.get(Producto, producto_id)
            nombre = prod.nombre if prod else f"Producto {producto_id}"
            resultado.append((producto_id, nombre, int(cantidad or 0), Decimal(str(ingresos or 0))))
        return resultado

    # ── Pedidos por estado ────────────────────────────────────────────────────────
    def pedidos_por_estado(self) -> List[Tuple[str, int]]:
        stmt = (
            select(Pedido.estado_codigo, func.count(Pedido.id))
            .where(Pedido.deleted_at.is_(None))
            .group_by(Pedido.estado_codigo)
        )
        return [(str(e), int(c or 0)) for e, c in self.session.exec(stmt).all()]

    # ── Ingresos por forma de pago ───────────────────────────────────────────────
    def ingresos_por_forma_pago(
        self, desde: date, hasta: date
    ) -> List[Tuple[str, Decimal, int]]:
        d0 = datetime.combine(desde, time.min)
        d1 = datetime.combine(hasta, time.max)
        stmt = (
            select(
                Pedido.forma_pago_codigo,
                func.coalesce(func.sum(Pedido.total), 0),
                func.count(Pedido.id),
            )
            .where(Pedido.deleted_at.is_(None))
            .where(Pedido.estado_codigo.in_(ESTADOS_INGRESO))  # EST-03
            .where(Pedido.fecha >= d0)
            .where(Pedido.fecha <= d1)
            .group_by(Pedido.forma_pago_codigo)
            .order_by(func.coalesce(func.sum(Pedido.total), 0).desc())
        )
        return [
            (str(fp), Decimal(str(t or 0)), int(c or 0))
            for fp, t, c in self.session.exec(stmt).all()
        ]
