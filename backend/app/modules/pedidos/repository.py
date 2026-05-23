from datetime import datetime, timezone
from sqlmodel import Session, select
from typing import Optional, List, Tuple
from app.core.base_repository import BaseRepository
from app.modules.pedidos.model import (
    Pedido,
    DetallePedido,
    DireccionEntrega,
    EstadoPedido,
    FormaPago,
    HistorialEstadoPedido,
)


class DireccionRepository(BaseRepository[DireccionEntrega]):
    def __init__(self, session: Session):
        super().__init__(DireccionEntrega, session)

    def get_by_id_active(self, direccion_id: int, usuario_id: int) -> Optional[DireccionEntrega]:
        stmt = (
            select(DireccionEntrega)
            .where(DireccionEntrega.id == direccion_id)
            .where(DireccionEntrega.usuario_id == usuario_id)
            .where(DireccionEntrega.deleted_at.is_(None))
        )
        return self.session.exec(stmt).first()

    def get_all_active_by_user(self, usuario_id: int) -> List[DireccionEntrega]:
        stmt = (
            select(DireccionEntrega)
            .where(DireccionEntrega.usuario_id == usuario_id)
            .where(DireccionEntrega.deleted_at.is_(None))
            .order_by(DireccionEntrega.principal.desc(), DireccionEntrega.created_at.desc())
        )
        return list(self.session.exec(stmt).all())

    def get_principal_by_user(self, usuario_id: int) -> Optional[DireccionEntrega]:
        stmt = (
            select(DireccionEntrega)
            .where(DireccionEntrega.usuario_id == usuario_id)
            .where(DireccionEntrega.principal == True)
            .where(DireccionEntrega.deleted_at.is_(None))
        )
        return self.session.exec(stmt).first()

    def clear_principal_except(self, usuario_id: int, principal_id: int) -> None:
        stmt = (
            select(DireccionEntrega)
            .where(DireccionEntrega.usuario_id == usuario_id)
            .where(DireccionEntrega.id != principal_id)
            .where(DireccionEntrega.deleted_at.is_(None))
        )
        direcciones = self.session.exec(stmt).all()
        for d in direcciones:
            d.principal = False
            self.session.add(d)
        self.session.flush()

    def soft_delete(self, direccion: DireccionEntrega) -> None:
        direccion.deleted_at = datetime.now(timezone.utc)
        self.session.add(direccion)
        self.session.flush()


class PedidoRepository(BaseRepository[Pedido]):
    def __init__(self, session: Session):
        super().__init__(Pedido, session)

    def get_by_id_active(self, pedido_id: int) -> Optional[Pedido]:
        stmt = (
            select(Pedido)
            .where(Pedido.id == pedido_id)
            .where(Pedido.deleted_at.is_(None))
        )
        return self.session.exec(stmt).first()

    def get_detalles(self, pedido_id: int) -> List[DetallePedido]:
        stmt = select(DetallePedido).where(DetallePedido.pedido_id == pedido_id)
        return list(self.session.exec(stmt).all())

    def get_historial(self, pedido_id: int) -> List[HistorialEstadoPedido]:
        stmt = (
            select(HistorialEstadoPedido)
            .where(HistorialEstadoPedido.pedido_id == pedido_id)
            .order_by(HistorialEstadoPedido.fecha.asc())
        )
        return list(self.session.exec(stmt).all())

    def list_filtered(
        self,
        usuario_id: Optional[int] = None,
        estado_codigo: str = "",
        page: int = 1,
        page_size: int = 10,
    ) -> Tuple[List[Pedido], int]:
        stmt = select(Pedido).where(Pedido.deleted_at.is_(None))
        if usuario_id is not None:
            stmt = stmt.where(Pedido.usuario_id == usuario_id)
        if estado_codigo:
            stmt = stmt.where(Pedido.estado_codigo == estado_codigo)
        
        stmt = stmt.order_by(Pedido.fecha.desc())

        all_items = list(self.session.exec(stmt).all())
        total = len(all_items)
        offset = (page - 1) * page_size
        return all_items[offset : offset + page_size], total

    def soft_delete(self, pedido: Pedido) -> None:
        pedido.deleted_at = datetime.now(timezone.utc)
        self.session.add(pedido)
        self.session.flush()


class EstadoPedidoRepository(BaseRepository[EstadoPedido]):
    def __init__(self, session: Session):
        super().__init__(EstadoPedido, session)


class FormaPagoRepository(BaseRepository[FormaPago]):
    def __init__(self, session: Session):
        super().__init__(FormaPago, session)
