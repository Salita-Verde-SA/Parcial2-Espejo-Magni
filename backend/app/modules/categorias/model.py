from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING

from sqlmodel import SQLModel, Field, Relationship

from app.modules.productos.model import ProductoCategoria

if TYPE_CHECKING:
    from app.modules.productos.model import Producto


def _utcnow() -> datetime:
    """Retorna la fecha y hora actual en UTC."""
    return datetime.now(timezone.utc)


class Categoria(SQLModel, table=True):
    """Modelo de tabla que representa una categoría de productos con soporte de jerarquía."""
    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(index=True, unique=True, max_length=100)
    descripcion: Optional[str] = Field(default=None, max_length=500)
    parent_id: Optional[int] = Field(default=None, foreign_key="categoria.id")
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)
    deleted_at: Optional[datetime] = Field(default=None)

    # ORM Relationships
    parent: Optional["Categoria"] = Relationship(back_populates="children", sa_relationship_kwargs={"remote_side": "Categoria.id"})
    children: list["Categoria"] = Relationship(back_populates="parent")
    productos: list["Producto"] = Relationship(back_populates="categorias_rel", link_model=ProductoCategoria)


class CategoriaCreate(SQLModel):
    """Esquema de entrada para crear una nueva categoría."""

    nombre: str = Field(min_length=1, max_length=100)
    descripcion: Optional[str] = Field(default=None, max_length=500)
    parent_id: Optional[int] = None


class CategoriaUpdate(SQLModel):
    """Esquema de entrada para actualizar parcialmente una categoría existente."""

    nombre: Optional[str] = Field(default=None, min_length=1, max_length=100)
    descripcion: Optional[str] = Field(default=None, max_length=500)
    parent_id: Optional[int] = None


class CategoriaPublic(SQLModel):
    """Esquema de salida con los datos públicos de una categoría."""

    id: int
    nombre: str
    descripcion: Optional[str]
    parent_id: Optional[int]
    created_at: datetime
    deleted_at: Optional[datetime] = None
    in_use: bool = False


class CategoriaTree(SQLModel):
    """Nodo del árbol jerárquico de categorías con sus hijos anidados."""

    id: int
    nombre: str
    descripcion: Optional[str]
    parent_id: Optional[int]
    hijos: list["CategoriaTree"] = []


CategoriaTree.model_rebuild()


class PaginatedCategorias(SQLModel):
    """Respuesta paginada que contiene una lista de categorías públicas."""

    items: list[CategoriaPublic]
    total: int
    page: int
    page_size: int
    pages: int
