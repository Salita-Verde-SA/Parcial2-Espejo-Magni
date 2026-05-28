from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import Column, Numeric
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from app.modules.productos.model import Producto
    from app.modules.usuarios.model import Usuario


def _utcnow() -> datetime:
    """Retorna la fecha y hora actual en UTC."""
    return datetime.now(timezone.utc)


class EstadoPedido(SQLModel, table=True):
    """Modelo de tabla que representa un estado posible en el ciclo de vida de un pedido."""
    __tablename__ = "estado_pedido"

    codigo: str = Field(primary_key=True, max_length=50)
    descripcion: Optional[str] = Field(default=None, max_length=200)
    created_at: datetime = Field(default_factory=_utcnow)

    # ORM Relationships
    pedidos: list["Pedido"] = Relationship(back_populates="estado")


class FormaPago(SQLModel, table=True):
    """Modelo de tabla que representa una forma de pago disponible para los pedidos."""

    __tablename__ = "forma_pago"

    codigo: str = Field(primary_key=True, max_length=50)
    descripcion: Optional[str] = Field(default=None, max_length=200)
    created_at: datetime = Field(default_factory=_utcnow)

    # ORM Relationships
    pedidos: list["Pedido"] = Relationship(back_populates="forma_pago")


class DireccionEntrega(SQLModel, table=True):
    """Modelo de tabla que representa una dirección de entrega guardada por un usuario."""

    __tablename__ = "direccion_entrega"

    id: Optional[int] = Field(default=None, primary_key=True)
    usuario_id: int = Field(foreign_key="usuario.id")
    calle: str = Field(max_length=200)
    numero: str = Field(max_length=50)
    piso: Optional[str] = Field(default=None, max_length=50)
    departamento: Optional[str] = Field(default=None, max_length=50)
    ciudad: str = Field(max_length=100)
    alias: str = Field(max_length=100, default="Casa")
    principal: bool = Field(default=False)
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)
    deleted_at: Optional[datetime] = Field(default=None)

    # ORM Relationships
    usuario: "Usuario" = Relationship(back_populates="direcciones")
    pedidos: list["Pedido"] = Relationship(back_populates="direccion")


class Pedido(SQLModel, table=True):
    """Modelo de tabla que representa un pedido realizado por un usuario."""

    __tablename__ = "pedido"

    id: Optional[int] = Field(default=None, primary_key=True)
    usuario_id: int = Field(foreign_key="usuario.id")
    fecha: datetime = Field(default_factory=_utcnow)
    estado_codigo: str = Field(foreign_key="estado_pedido.codigo")
    forma_pago_codigo: str = Field(foreign_key="forma_pago.codigo")
    direccion_id: Optional[int] = Field(default=None, foreign_key="direccion_entrega.id")
    total: Decimal = Field(sa_column=Column(Numeric(10, 2), nullable=False))
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)
    deleted_at: Optional[datetime] = Field(default=None)

    # ORM Relationships
    usuario: "Usuario" = Relationship(back_populates="pedidos")
    direccion: Optional[DireccionEntrega] = Relationship(back_populates="pedidos")
    estado: EstadoPedido = Relationship(back_populates="pedidos")
    forma_pago: FormaPago = Relationship(back_populates="pedidos")
    detalles: list["DetallePedido"] = Relationship(back_populates="pedido")
    historial: list["HistorialEstadoPedido"] = Relationship(back_populates="pedido")


class DetallePedido(SQLModel, table=True):
    """Modelo de tabla que representa una línea de detalle (producto) dentro de un pedido."""

    __tablename__ = "detalle_pedido"

    id: Optional[int] = Field(default=None, primary_key=True)
    pedido_id: int = Field(foreign_key="pedido.id")
    producto_id: int = Field(foreign_key="producto.id")
    cantidad: int = Field(default=1)
    precio_unitario: Decimal = Field(sa_column=Column(Numeric(10, 2), nullable=False))
    producto_nombre: str = Field(max_length=150)

    # ORM Relationships
    pedido: Pedido = Relationship(back_populates="detalles")
    producto: "Producto" = Relationship(back_populates="detalles")


class HistorialEstadoPedido(SQLModel, table=True):
    """Modelo de tabla que registra cada transición de estado ocurrida en un pedido."""

    __tablename__ = "historial_estado_pedido"

    id: Optional[int] = Field(default=None, primary_key=True)
    pedido_id: int = Field(foreign_key="pedido.id")
    estado_anterior_codigo: Optional[str] = Field(default=None, foreign_key="estado_pedido.codigo")
    estado_nuevo_codigo: str = Field(foreign_key="estado_pedido.codigo")
    fecha: datetime = Field(default_factory=_utcnow)
    usuario_id: int = Field(foreign_key="usuario.id")

    # ORM Relationships
    pedido: Pedido = Relationship(back_populates="historial")


class DireccionCreate(SQLModel):
    """Esquema de entrada para crear una nueva dirección de entrega."""

    calle: str = Field(min_length=1, max_length=200)
    numero: str = Field(min_length=1, max_length=50)
    piso: Optional[str] = Field(default=None, max_length=50)
    departamento: Optional[str] = Field(default=None, max_length=50)
    ciudad: str = Field(min_length=1, max_length=100)
    alias: str = Field(max_length=100, default="Casa")
    principal: bool = False


class DireccionUpdate(SQLModel):
    """Esquema de entrada para actualizar parcialmente una dirección de entrega."""

    calle: Optional[str] = Field(default=None, max_length=200)
    numero: Optional[str] = Field(default=None, max_length=50)
    piso: Optional[str] = Field(default=None, max_length=50)
    departamento: Optional[str] = Field(default=None, max_length=50)
    ciudad: Optional[str] = Field(default=None, max_length=100)
    alias: Optional[str] = Field(default=None, max_length=100)
    principal: Optional[bool] = None


class DireccionPublic(SQLModel):
    """Esquema de salida con los datos públicos de una dirección de entrega."""

    id: int
    usuario_id: int
    calle: str
    numero: str
    piso: Optional[str]
    departamento: Optional[str]
    ciudad: str
    alias: str
    principal: bool
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None


class DetallePedidoCreate(SQLModel):
    """Esquema de entrada para un ítem dentro de la creación de un pedido."""

    producto_id: int
    cantidad: int = Field(ge=1)


class PedidoCreate(SQLModel):
    """Esquema de entrada para crear un nuevo pedido con sus ítems y dirección de entrega."""

    forma_pago_codigo: str = Field(min_length=1, max_length=50)
    direccion_id: Optional[int] = None
    items: List[DetallePedidoCreate] = Field(min_items=1)


class DetallePedidoPublic(SQLModel):
    """Esquema de salida con los datos de un ítem de pedido."""

    id: int
    pedido_id: int
    producto_id: int
    cantidad: int
    precio_unitario: Decimal
    producto_nombre: str


class HistorialEstadoPedidoPublic(SQLModel):
    """Esquema de salida con los datos de una transición de estado en el historial de un pedido."""

    id: int
    pedido_id: int
    estado_anterior_codigo: Optional[str]
    estado_nuevo_codigo: str
    fecha: datetime
    usuario_id: int
    usuario_nombre: Optional[str] = None


class PedidoPublic(SQLModel):
    """Esquema de salida con los datos completos de un pedido incluyendo ítems e historial."""

    id: int
    usuario_id: int
    usuario_nombre: Optional[str] = None
    fecha: datetime
    estado_codigo: str
    forma_pago_codigo: str
    direccion_id: Optional[int]
    direccion: Optional[DireccionPublic] = None
    total: Decimal
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None
    items: List[DetallePedidoPublic] = []
    historial: List[HistorialEstadoPedidoPublic] = []


class EstadoPedidoUpdate(SQLModel):
    """Esquema de entrada para actualizar el estado de un pedido."""

    estado_codigo: str = Field(min_length=1, max_length=50)


class PaginatedPedidos(SQLModel):
    """Respuesta paginada que contiene una lista de pedidos públicos."""

    items: List[PedidoPublic]
    total: int
    page: int
    page_size: int
    pages: int
