# Repositorio específico para la entidad Pedido.
#
# Hereda del repositorio base genérico BaseRepository para proveer
# las operaciones básicas de acceso a datos de la entidad Pedido.
#
# Capa: Repository
# Conoce a: Model (Pedido), Session
# NO conoce a: Service, Router

from sqlmodel import Session
from app.core.base_repository import BaseRepository
from app.modules.pedidos.models import Pedido


class PedidoRepository(BaseRepository[Pedido]):
    # Repositorio de Pedidos. Por ahora usa solo los métodos del base.
    # Si se necesitan queries específicas (ej: filtrar por estado),
    # se agregan aquí como métodos adicionales.

    def __init__(self, session: Session):
        # Inicializa el repositorio base con el modelo Pedido
        super().__init__(Pedido, session)
