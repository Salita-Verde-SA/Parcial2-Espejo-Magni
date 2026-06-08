# Unit of Work del módulo Pedidos.
# Expone el repositorio de pedidos para operaciones atómicas.

from sqlmodel import Session
from app.core.unit_of_work import UnitOfWork
from app.modules.pedidos.repository import PedidoRepository


class PedidoUnitOfWork(UnitOfWork):
    def __init__(self, session: Session) -> None:
        # Inicializa el UoW base y expone el repositorio de pedidos
        super().__init__(session)
        self.pedidos = PedidoRepository(session)
