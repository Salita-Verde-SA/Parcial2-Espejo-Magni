from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING

from sqlmodel import SQLModel, Field, Relationship

from app.modules.productos.model import ProductoCategoria

if TYPE_CHECKING:
    from app.modules.productos.model import Producto


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Categoria(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(index=True, unique=True, max_length=100)
    descripcion: Optional[str] = Field(default=None, max_length=500)
    parent_id: Optional[int] = Field(default=None, foreign_key="categoria.id")
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)
    deleted_at: Optional[datetime] = Field(default=None)

    # Relaciones ORM
    parent: Optional["Categoria"] = Relationship(back_populates="children", sa_relationship_kwargs={"remote_side": "Categoria.id"})
    children: list["Categoria"] = Relationship(back_populates="parent")
    productos: list["Producto"] = Relationship(back_populates="categorias_rel", link_model=ProductoCategoria)


class CategoriaCreate(SQLModel):
    nombre: str = Field(min_length=1, max_length=100)
    descripcion: Optional[str] = Field(default=None, max_length=500)
    parent_id: Optional[int] = None


class CategoriaUpdate(SQLModel):
    nombre: Optional[str] = Field(default=None, min_length=1, max_length=100)
    descripcion: Optional[str] = Field(default=None, max_length=500)
    parent_id: Optional[int] = None


class CategoriaPublic(SQLModel):
    id: int
    nombre: str
    descripcion: Optional[str]
    parent_id: Optional[int]
    created_at: datetime
    deleted_at: Optional[datetime] = None
    in_use: bool = False


class CategoriaTree(SQLModel):
    id: int
    nombre: str
    descripcion: Optional[str]
    parent_id: Optional[int]
    hijos: list["CategoriaTree"] = []


CategoriaTree.model_rebuild()


class PaginatedCategorias(SQLModel):
    items: list[CategoriaPublic]
    total: int
    page: int
    page_size: int
    pages: int
