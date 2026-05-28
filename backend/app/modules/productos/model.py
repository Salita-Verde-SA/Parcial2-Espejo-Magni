from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional, TYPE_CHECKING

from sqlalchemy import Column, Numeric
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from app.modules.pedidos.model import DetallePedido
    from app.modules.ingredientes.model import Ingrediente
    from app.modules.categorias.model import Categoria


def _utcnow() -> datetime:
    """Retorna la fecha y hora actual en UTC."""
    return datetime.now(timezone.utc)


class ProductoCategoria(SQLModel, table=True):
    """Tabla de relación muchos-a-muchos entre productos y categorías."""
    __tablename__ = "producto_categoria"

    producto_id: int = Field(foreign_key="producto.id", primary_key=True)
    categoria_id: int = Field(foreign_key="categoria.id", primary_key=True)
    created_at: datetime = Field(default_factory=_utcnow)


class ProductoIngrediente(SQLModel, table=True):
    """Tabla de relación entre productos e ingredientes con cantidad y unidad de medida."""

    __tablename__ = "producto_ingrediente"

    producto_id: int = Field(foreign_key="producto.id", primary_key=True)
    ingrediente_id: int = Field(foreign_key="ingrediente.id", primary_key=True)
    cantidad: Decimal = Field(default=Decimal("1"), sa_column=Column(Numeric(10, 3), nullable=False))
    unidad_medida_id: int = Field(foreign_key="unidad_medida.id")
    es_removible: bool = Field(default=False)
    created_at: datetime = Field(default_factory=_utcnow)


class Producto(SQLModel, table=True):
    """Modelo de tabla que representa un producto del menú con precio, stock e ingredientes."""

    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(index=True, max_length=150)
    descripcion: Optional[str] = Field(default=None, max_length=1000)
    precio_base: Decimal = Field(sa_column=Column(Numeric(10, 2), nullable=False))
    unidad_venta_id: Optional[int] = Field(default=None, foreign_key="unidad_medida.id")
    stock_cantidad: int = Field(default=0)
    disponible: bool = Field(default=True)
    imagen_url: Optional[str] = Field(default=None, max_length=500)
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)
    deleted_at: Optional[datetime] = Field(default=None)

    # ORM Relationships
    categorias_rel: list["Categoria"] = Relationship(back_populates="productos", link_model=ProductoCategoria)
    ingredientes_rel: list["Ingrediente"] = Relationship(back_populates="productos", link_model=ProductoIngrediente)
    detalles: list["DetallePedido"] = Relationship(back_populates="producto")


class IngredienteCantidadInput(SQLModel):
    """Esquema para especificar un ingrediente con su cantidad y unidad al crear/actualizar un producto."""

    ingrediente_id: int
    cantidad: Decimal = Decimal("1")
    unidad_medida_id: int
    es_removible: bool = False


class ProductoCreate(SQLModel):
    """Esquema de entrada para crear un nuevo producto con categorías e ingredientes."""

    nombre: str = Field(max_length=150)
    descripcion: Optional[str] = Field(default=None, max_length=1000)
    precio_base: Decimal
    unidad_venta_id: Optional[int] = None
    disponible: bool = True
    imagen_url: Optional[str] = Field(default=None, max_length=500)
    categoria_ids: list[int] = []
    ingredientes: list[IngredienteCantidadInput] = []


class ProductoUpdate(SQLModel):
    """Esquema de entrada para actualizar parcialmente un producto existente."""

    nombre: Optional[str] = Field(default=None, max_length=150)
    descripcion: Optional[str] = Field(default=None, max_length=1000)
    precio_base: Optional[Decimal] = None
    unidad_venta_id: Optional[int] = None
    disponible: Optional[bool] = None
    imagen_url: Optional[str] = Field(default=None, max_length=500)
    categoria_ids: Optional[list[int]] = None
    ingredientes: Optional[list[IngredienteCantidadInput]] = None


class UnidadMedidaResumen(SQLModel):
    """Representación resumida de una unidad de medida para incrustar en respuestas de producto."""

    id: int
    nombre: str
    simbolo: str


class IngredienteResumen(SQLModel):
    """Representación resumida de un ingrediente para incrustar en respuestas de producto."""

    id: int
    nombre: str
    es_alergeno: bool
    cantidad: Decimal
    unidad_medida_id: int
    simbolo: str
    es_removible: bool
    stock_insumo: int = 0


class ProductoPublic(SQLModel):
    """Esquema de salida con los datos completos de un producto incluyendo ingredientes y categorías."""

    id: int
    nombre: str
    descripcion: Optional[str]
    precio_base: Decimal
    unidad_venta_id: Optional[int] = None
    unidad_venta: Optional[UnidadMedidaResumen] = None
    stock_cantidad: int
    disponible: bool
    imagen_url: Optional[str]
    created_at: datetime
    deleted_at: Optional[datetime] = None
    categorias: list[int] = []
    ingredientes: list[IngredienteResumen] = []


class StockUpdate(SQLModel):
    """Esquema de entrada para actualizar el stock y disponibilidad de un producto."""

    stock_cantidad: int
    disponible: bool


class DisponibilidadUpdate(SQLModel):
    """Esquema de entrada para actualizar únicamente la disponibilidad de un producto."""

    disponible: bool


class PaginatedProductos(SQLModel):
    """Respuesta paginada que contiene una lista de productos públicos."""

    items: list[ProductoPublic]
    total: int
    page: int
    page_size: int
    pages: int