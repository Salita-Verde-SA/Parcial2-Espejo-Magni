from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlmodel import SQLModel, Field, Relationship

from app.modules.productos.model import ProductoIngrediente

if TYPE_CHECKING:
    from app.modules.productos.model import Producto


def _utcnow() -> datetime:
    """Retorna la fecha y hora UTC actual."""
    return datetime.utcnow()


class Ingrediente(SQLModel, table=True):
    """Modelo de tabla que representa un ingrediente disponible en el sistema."""
    id:          Optional[int] = Field(default=None, primary_key=True)
    nombre:      str           = Field(index=True, unique=True, max_length=100)
    descripcion: Optional[str] = Field(default=None)
    es_alergeno: bool          = Field(default=False)
    stock_cantidad: int        = Field(default=0)
    created_at:  datetime      = Field(default_factory=_utcnow)
    updated_at:  datetime      = Field(default_factory=_utcnow)
    deleted_at:  Optional[datetime] = Field(default=None)

    # ORM Relationships
    productos: list["Producto"] = Relationship(back_populates="ingredientes_rel", link_model=ProductoIngrediente)


class IngredienteCreate(SQLModel):
    """Esquema de entrada para crear un nuevo ingrediente."""

    nombre:      str            = Field(min_length=1, max_length=100)
    descripcion: Optional[str]  = Field(default=None, max_length=500)
    es_alergeno: bool           = Field(default=False)
    stock_cantidad: int         = Field(default=0)


class IngredienteUpdate(SQLModel):
    """Esquema de entrada para actualizar parcialmente un ingrediente existente."""

    nombre:      Optional[str]  = Field(default=None, min_length=1, max_length=100)
    descripcion: Optional[str]  = Field(default=None)
    es_alergeno: Optional[bool] = Field(default=None)
    stock_cantidad: Optional[int] = Field(default=None)


class IngredientePublic(SQLModel):
    """Esquema de salida con los datos públicos de un ingrediente."""

    id:          int
    nombre:      str
    descripcion: Optional[str]
    es_alergeno: bool
    stock_cantidad: int
    created_at:  datetime
    updated_at:  datetime
    deleted_at:  Optional[datetime] = None


class PaginatedIngredientes(SQLModel):
    """Respuesta paginada que contiene una lista de ingredientes públicos."""

    items:     list[IngredientePublic]
    total:     int
    page:      int
    page_size: int
    pages:     int
