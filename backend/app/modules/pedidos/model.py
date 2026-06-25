from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import Column, Numeric, JSON
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from app.modules.productos.model import Producto
    from app.modules.usuarios.model import Usuario


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class EstadoPedido(SQLModel, table=True):
    __tablename__ = "estado_pedido"

    codigo: str = Field(primary_key=True, max_length=50)
    descripcion: Optional[str] = Field(default=None, max_length=200)
    orden: int = Field(default=0)
    # es_terminal=True → no admite transiciones salientes (RN-01)
    es_terminal: bool = Field(default=False)
    created_at: datetime = Field(default_factory=_utcnow)

    # Relaciones ORM
    pedidos: list["Pedido"] = Relationship(back_populates="estado")


class FormaPago(SQLModel, table=True):
    __tablename__ = "forma_pago"

    codigo: str = Field(primary_key=True, max_length=50)
    descripcion: Optional[str] = Field(default=None, max_length=200)
    created_at: datetime = Field(default_factory=_utcnow)

    # Relaciones ORM
    pedidos: list["Pedido"] = Relationship(back_populates="forma_pago")


class DireccionEntrega(SQLModel, table=True):
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

    # Relaciones ORM
    usuario: "Usuario" = Relationship(back_populates="direcciones")
    pedidos: list["Pedido"] = Relationship(back_populates="direccion")


class Pedido(SQLModel, table=True):
    __tablename__ = "pedido"

    id: Optional[int] = Field(default=None, primary_key=True)
    usuario_id: int = Field(foreign_key="usuario.id")
    fecha: datetime = Field(default_factory=_utcnow)
    estado_codigo: str = Field(foreign_key="estado_pedido.codigo")
    forma_pago_codigo: str = Field(foreign_key="forma_pago.codigo")
    direccion_id: Optional[int] = Field(default=None, foreign_key="direccion_entrega.id")
    # Snapshot monetario (v7): total = subtotal - descuento + costo_envio
    subtotal: Decimal = Field(default=Decimal("0"), sa_column=Column(Numeric(10, 2), nullable=False, server_default="0"))
    descuento: Decimal = Field(default=Decimal("0"), sa_column=Column(Numeric(10, 2), nullable=False, server_default="0"))
    costo_envio: Decimal = Field(default=Decimal("50"), sa_column=Column(Numeric(10, 2), nullable=False, server_default="50"))
    total: Decimal = Field(sa_column=Column(Numeric(10, 2), nullable=False))
    notas: Optional[str] = Field(default=None, max_length=500)
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)
    deleted_at: Optional[datetime] = Field(default=None)

    # Relaciones ORM
    usuario: "Usuario" = Relationship(back_populates="pedidos")
    direccion: Optional[DireccionEntrega] = Relationship(back_populates="pedidos")
    estado: EstadoPedido = Relationship(back_populates="pedidos")
    forma_pago: FormaPago = Relationship(back_populates="pedidos")
    detalles: list["DetallePedido"] = Relationship(back_populates="pedido")
    historial: list["HistorialEstadoPedido"] = Relationship(back_populates="pedido")


class DetallePedido(SQLModel, table=True):
    __tablename__ = "detalle_pedido"

    id: Optional[int] = Field(default=None, primary_key=True)
    pedido_id: int = Field(foreign_key="pedido.id")
    producto_id: int = Field(foreign_key="producto.id")
    cantidad: int = Field(default=1)
    # Snapshot inmutable al crear el pedido (RN-04)
    precio_unitario: Decimal = Field(sa_column=Column(Numeric(10, 2), nullable=False))
    producto_nombre: str = Field(max_length=150)
    nombre_snapshot: str = Field(default="", max_length=200)
    precio_snapshot: Decimal = Field(default=Decimal("0"), sa_column=Column(Numeric(10, 2), nullable=False, server_default="0"))
    subtotal_snap: Decimal = Field(default=Decimal("0"), sa_column=Column(Numeric(10, 2), nullable=False, server_default="0"))
    # IDs de ingredientes removidos (personalización). JSON para portabilidad SQLite/Postgres.
    personalizacion: Optional[List[int]] = Field(default=None, sa_column=Column(JSON, nullable=True))

    # Relaciones ORM
    pedido: Pedido = Relationship(back_populates="detalles")
    producto: "Producto" = Relationship(back_populates="detalles")


class HistorialEstadoPedido(SQLModel, table=True):
    __tablename__ = "historial_estado_pedido"

    id: Optional[int] = Field(default=None, primary_key=True)
    pedido_id: int = Field(foreign_key="pedido.id")
    estado_anterior_codigo: Optional[str] = Field(default=None, foreign_key="estado_pedido.codigo")
    estado_nuevo_codigo: str = Field(foreign_key="estado_pedido.codigo")
    motivo: Optional[str] = Field(default=None, max_length=300)
    fecha: datetime = Field(default_factory=_utcnow)
    usuario_id: int = Field(foreign_key="usuario.id")

    # Relaciones ORM
    pedido: Pedido = Relationship(back_populates="historial")


class DireccionCreate(SQLModel):
    calle: str = Field(min_length=1, max_length=200)
    numero: str = Field(min_length=1, max_length=50)
    piso: Optional[str] = Field(default=None, max_length=50)
    departamento: Optional[str] = Field(default=None, max_length=50)
    ciudad: str = Field(min_length=1, max_length=100)
    alias: str = Field(max_length=100, default="Casa")
    principal: bool = False


class DireccionUpdate(SQLModel):
    calle: Optional[str] = Field(default=None, max_length=200)
    numero: Optional[str] = Field(default=None, max_length=50)
    piso: Optional[str] = Field(default=None, max_length=50)
    departamento: Optional[str] = Field(default=None, max_length=50)
    ciudad: Optional[str] = Field(default=None, max_length=100)
    alias: Optional[str] = Field(default=None, max_length=100)
    principal: Optional[bool] = None


class DireccionPublic(SQLModel):
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
    producto_id: int
    cantidad: int = Field(ge=1)
    personalizacion: Optional[List[int]] = None


class PedidoCreate(SQLModel):
    forma_pago_codigo: str = Field(min_length=1, max_length=50)
    direccion_id: Optional[int] = None
    descuento: Decimal = Decimal("0")
    notas: Optional[str] = Field(default=None, max_length=500)
    items: List[DetallePedidoCreate] = Field(min_items=1)


class DetallePedidoPublic(SQLModel):
    id: int
    pedido_id: int
    producto_id: int
    cantidad: int
    precio_unitario: Decimal
    producto_nombre: str
    nombre_snapshot: str = ""
    precio_snapshot: Decimal = Decimal("0")
    subtotal_snap: Decimal = Decimal("0")
    personalizacion: Optional[List[int]] = None


class HistorialEstadoPedidoPublic(SQLModel):
    id: int
    pedido_id: int
    estado_anterior_codigo: Optional[str]
    estado_nuevo_codigo: str
    motivo: Optional[str] = None
    fecha: datetime
    usuario_id: int
    usuario_nombre: Optional[str] = None


class PedidoPublic(SQLModel):
    id: int
    usuario_id: int
    usuario_nombre: Optional[str] = None
    fecha: datetime
    estado_codigo: str
    forma_pago_codigo: str
    direccion_id: Optional[int]
    direccion: Optional[DireccionPublic] = None
    subtotal: Decimal = Decimal("0")
    descuento: Decimal = Decimal("0")
    costo_envio: Decimal = Decimal("0")
    total: Decimal
    notas: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None
    items: List[DetallePedidoPublic] = []
    historial: List[HistorialEstadoPedidoPublic] = []


class EstadoPedidoUpdate(SQLModel):
    estado_codigo: str = Field(min_length=1, max_length=50)
    # Obligatorio cuando estado_codigo == CANCELADO (RN-05)
    motivo: Optional[str] = Field(default=None, max_length=300)


class PaginatedPedidos(SQLModel):
    items: List[PedidoPublic]
    total: int
    page: int
    page_size: int
    pages: int
