from sqlmodel import Session

from app.core.database import engine
from app.modules.unidades.repository import UnidadMedidaRepository
from app.modules.usuarios.repository import UsuarioRepository
from app.modules.auth.repository import RefreshTokenRepository
from app.modules.categorias.repository import CategoriaRepository
from app.modules.ingredientes.repository import IngredienteRepository
from app.modules.productos.repository import ProductoRepository
from app.modules.pedidos.repository import (
    PedidoRepository,
    DireccionRepository,
    EstadoPedidoRepository,
    FormaPagoRepository,
)


class UnitOfWork:
    def __init__(self):
        self.session: Session | None = None

    def __enter__(self):
        self.session = Session(engine, expire_on_commit=False)
        self.usuarios = UsuarioRepository(self.session)
        self.refresh_tokens = RefreshTokenRepository(self.session)
        self.categorias = CategoriaRepository(self.session)
        self.ingredientes = IngredienteRepository(self.session)
        self.productos = ProductoRepository(self.session)
        self.unidades = UnidadMedidaRepository(self.session)
        self.pedidos = PedidoRepository(self.session)
        self.direcciones = DireccionRepository(self.session)
        self.estados_pedido = EstadoPedidoRepository(self.session)
        self.formas_pago = FormaPagoRepository(self.session)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            self.session.rollback()
        else:
            self.session.commit()
        self.session.close()

    def commit(self):
        self.session.commit()

    def rollback(self):
        self.session.rollback()


def get_uow() -> UnitOfWork:
    return UnitOfWork()
