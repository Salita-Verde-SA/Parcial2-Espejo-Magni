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
    return datetime.now(timezone.utc)


class ProductoCategoria(SQLModel, table=True):
    __tablename__ = "producto_categoria"

    producto_id: int = Field(foreign_key="producto.id", primary_key=True)
    categoria_id: int = Field(foreign_key="categoria.id", primary_key=True)
    created_at: datetime = Field(default_factory=_utcnow)


class ProductoIngrediente(SQLModel, table=True):
    __tablename__ = "producto_ingrediente"

    producto_id: int = Field(foreign_key="producto.id", primary_key=True)
    ingrediente_id: int = Field(foreign_key="ingrediente.id", primary_key=True)
    cantidad: Decimal = Field(default=Decimal("1"), sa_column=Column(Numeric(10, 3), nullable=False))
    unidad_medida_id: int = Field(foreign_key="unidad_medida.id")
    es_removible: bool = Field(default=False)
    created_at: datetime = Field(default_factory=_utcnow)


class Producto(SQLModel, table=True):
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

    # Relaciones ORM
    categorias_rel: list["Categoria"] = Relationship(back_populates="productos", link_model=ProductoCategoria)
    ingredientes_rel: list["Ingrediente"] = Relationship(back_populates="productos", link_model=ProductoIngrediente)
    detalles: list["DetallePedido"] = Relationship(back_populates="producto")


class IngredienteCantidadInput(SQLModel):
    ingrediente_id: int
    cantidad: Decimal = Decimal("1")
    unidad_medida_id: int
    es_removible: bool = False


class ProductoCreate(SQLModel):
    nombre: str = Field(max_length=150)
    descripcion: Optional[str] = Field(default=None, max_length=1000)
    precio_base: Decimal
    unidad_venta_id: Optional[int] = None
    disponible: bool = True
    imagen_url: Optional[str] = Field(default=None, max_length=500)
    categoria_ids: list[int] = []
    ingredientes: list[IngredienteCantidadInput] = []


class ProductoUpdate(SQLModel):
    nombre: Optional[str] = Field(default=None, max_length=150)
    descripcion: Optional[str] = Field(default=None, max_length=1000)
    precio_base: Optional[Decimal] = None
    unidad_venta_id: Optional[int] = None
    disponible: Optional[bool] = None
    imagen_url: Optional[str] = Field(default=None, max_length=500)
    categoria_ids: Optional[list[int]] = None
    ingredientes: Optional[list[IngredienteCantidadInput]] = None


class UnidadMedidaResumen(SQLModel):
    id: int
    nombre: str
    simbolo: str


class IngredienteResumen(SQLModel):
    id: int
    nombre: str
    es_alergeno: bool
    cantidad: Decimal
    unidad_medida_id: int
    simbolo: str
    es_removible: bool
    stock_insumo: int = 0


class ProductoPublic(SQLModel):
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
    stock_cantidad: int
    disponible: bool


class ComposicionUpdate(SQLModel):
    """Actualización acotada para el rol STOCK: solo categorías e ingredientes."""
    categoria_ids: list[int] = []
    ingredientes: list[IngredienteCantidadInput] = []


class DisponibilidadUpdate(SQLModel):
    disponible: bool


class PaginatedProductos(SQLModel):
    items: list[ProductoPublic]
    total: int
    page: int
    page_size: int
    pages: int