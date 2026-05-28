
from datetime import datetime
from typing import Optional

from sqlmodel import SQLModel, Field


def _utcnow() -> datetime:
    """Retorna la fecha y hora UTC actual."""
    return datetime.utcnow()


class UnidadMedida(SQLModel, table=True):
    """Modelo de tabla que representa una unidad de medida para ingredientes y productos."""
    __tablename__ = "unidad_medida"

    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(index=True, unique=True, max_length=50)
    simbolo: str = Field(index=True, unique=True, max_length=10)
    tipo: str = Field(max_length=20)
    created_at: datetime = Field(default_factory=_utcnow)


class UnidadMedidaCreate(SQLModel):
    """Esquema de entrada para crear una nueva unidad de medida."""

    nombre: str = Field(min_length=1, max_length=50)
    simbolo: str = Field(min_length=1, max_length=10)
    tipo: str = Field(min_length=1, max_length=20)


class UnidadMedidaUpdate(SQLModel):
    """Esquema de entrada para actualizar parcialmente una unidad de medida."""

    nombre: Optional[str] = Field(default=None, min_length=1, max_length=50)
    simbolo: Optional[str] = Field(default=None, min_length=1, max_length=10)
    tipo: Optional[str] = Field(default=None, min_length=1, max_length=20)


class UnidadMedidaPublic(SQLModel):
    """Esquema de salida con los datos públicos de una unidad de medida."""

    id: int
    nombre: str
    simbolo: str
    tipo: str
    created_at: datetime


class PaginatedUnidades(SQLModel):
    """Respuesta paginada que contiene una lista de unidades de medida."""

    items: list[UnidadMedidaPublic]
    total: int
    page: int
    page_size: int
    pages: int