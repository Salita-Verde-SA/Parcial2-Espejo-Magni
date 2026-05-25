from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlmodel import SQLModel, Field, Relationship

from app.modules.productos.model import ProductoIngrediente

if TYPE_CHECKING:
    from app.modules.productos.model import Producto


def _utcnow() -> datetime:
    return datetime.utcnow()


class Ingrediente(SQLModel, table=True):
    id:          Optional[int] = Field(default=None, primary_key=True)
    nombre:      str           = Field(index=True, unique=True, max_length=100)
    descripcion: Optional[str] = Field(default=None)
    es_alergeno: bool          = Field(default=False)
    stock_cantidad: int        = Field(default=0)
    created_at:  datetime      = Field(default_factory=_utcnow)
    updated_at:  datetime      = Field(default_factory=_utcnow)
    deleted_at:  Optional[datetime] = Field(default=None)

    # Relaciones ORM
    productos: list["Producto"] = Relationship(back_populates="ingredientes_rel", link_model=ProductoIngrediente)


class IngredienteCreate(SQLModel):
    nombre:      str            = Field(min_length=1, max_length=100)
    descripcion: Optional[str]  = Field(default=None, max_length=500)
    es_alergeno: bool           = Field(default=False)
    stock_cantidad: int         = Field(default=0)


class IngredienteUpdate(SQLModel):
    nombre:      Optional[str]  = Field(default=None, min_length=1, max_length=100)
    descripcion: Optional[str]  = Field(default=None)
    es_alergeno: Optional[bool] = Field(default=None)
    stock_cantidad: Optional[int] = Field(default=None)


class IngredientePublic(SQLModel):
    id:          int
    nombre:      str
    descripcion: Optional[str]
    es_alergeno: bool
    stock_cantidad: int
    created_at:  datetime
    updated_at:  datetime
    deleted_at:  Optional[datetime] = None


class PaginatedIngredientes(SQLModel):
    items:     list[IngredientePublic]
    total:     int
    page:      int
    page_size: int
    pages:     int
