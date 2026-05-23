from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional, List
from sqlalchemy import Column, Numeric
from sqlmodel import SQLModel, Field, Relationship


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class EstadoPedido(SQLModel, table=True):
    __tablename__ = "estado_pedido"

    codigo: str = Field(primary_key=True, max_length=50)
    descripcion: Optional[str] = Field(default=None, max_length=200)
    created_at: datetime = Field(default_factory=_utcnow)


class FormaPago(SQLModel, table=True):
    __tablename__ = "forma_pago"

    codigo: str = Field(primary_key=True, max_length=50)
    descripcion: Optional[str] = Field(default=None, max_length=200)
    created_at: datetime = Field(default_factory=_utcnow)


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


class Pedido(SQLModel, table=True):
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


class DetallePedido(SQLModel, table=True):
    __tablename__ = "detalle_pedido"

    id: Optional[int] = Field(default=None, primary_key=True)
    pedido_id: int = Field(foreign_key="pedido.id")
    producto_id: int = Field(foreign_key="producto.id")
    cantidad: int = Field(default=1)
    precio_unitario: Decimal = Field(sa_column=Column(Numeric(10, 2), nullable=False))
    producto_nombre: str = Field(max_length=150)


class HistorialEstadoPedido(SQLModel, table=True):
    __tablename__ = "historial_estado_pedido"

    id: Optional[int] = Field(default=None, primary_key=True)
    pedido_id: int = Field(foreign_key="pedido.id")
    estado_anterior_codigo: Optional[str] = Field(default=None, foreign_key="estado_pedido.codigo")
    estado_nuevo_codigo: str = Field(foreign_key="estado_pedido.codigo")
    fecha: datetime = Field(default_factory=_utcnow)
    usuario_id: int = Field(foreign_key="usuario.id")


# ─── Schemas de Entrada / Salida (Pydantic / SQLModel) ──────────────────────────

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


class PedidoCreate(SQLModel):
    forma_pago_codigo: str = Field(min_length=1, max_length=50)
    direccion_id: Optional[int] = None
    items: List[DetallePedidoCreate] = Field(min_items=1)


class DetallePedidoPublic(SQLModel):
    id: int
    pedido_id: int
    producto_id: int
    cantidad: int
    precio_unitario: Decimal
    producto_nombre: str


class HistorialEstadoPedidoPublic(SQLModel):
    id: int
    pedido_id: int
    estado_anterior_codigo: Optional[str]
    estado_nuevo_codigo: str
    fecha: datetime
    usuario_id: int
    usuario_nombre: Optional[str] = None  # Enriquecido


class PedidoPublic(SQLModel):
    id: int
    usuario_id: int
    usuario_nombre: Optional[str] = None  # Enriquecido (nombre + apellido)
    fecha: datetime
    estado_codigo: str
    forma_pago_codigo: str
    direccion_id: Optional[int]
    direccion: Optional[DireccionPublic] = None  # Enriquecido
    total: Decimal
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None
    items: List[DetallePedidoPublic] = []
    historial: List[HistorialEstadoPedidoPublic] = []


class EstadoPedidoUpdate(SQLModel):
    estado_codigo: str = Field(min_length=1, max_length=50)


class PaginatedPedidos(SQLModel):
    items: List[PedidoPublic]
    total: int
    page: int
    page_size: int
    pages: int
