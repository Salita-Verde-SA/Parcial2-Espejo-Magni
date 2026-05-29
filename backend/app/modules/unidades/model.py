
from datetime import datetime, timezone
from typing import Optional

from sqlmodel import SQLModel, Field


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class UnidadMedida(SQLModel, table=True):
    __tablename__ = "unidad_medida"

    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(index=True, unique=True, max_length=50)
    simbolo: str = Field(index=True, unique=True, max_length=10)
    tipo: str = Field(max_length=20)
    created_at: datetime = Field(default_factory=_utcnow)


class UnidadMedidaCreate(SQLModel):
    nombre: str = Field(min_length=1, max_length=50)
    simbolo: str = Field(min_length=1, max_length=10)
    tipo: str = Field(min_length=1, max_length=20)


class UnidadMedidaUpdate(SQLModel):
    nombre: Optional[str] = Field(default=None, min_length=1, max_length=50)
    simbolo: Optional[str] = Field(default=None, min_length=1, max_length=10)
    tipo: Optional[str] = Field(default=None, min_length=1, max_length=20)


class UnidadMedidaPublic(SQLModel):
    id: int
    nombre: str
    simbolo: str
    tipo: str
    created_at: datetime


class PaginatedUnidades(SQLModel):
    items: list[UnidadMedidaPublic]
    total: int
    page: int
    page_size: int
    pages: int