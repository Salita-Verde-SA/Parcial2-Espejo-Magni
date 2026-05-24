from app.modules.pedidos.model import Pedido
from app.modules.pedidos.model import DireccionEntrega
from datetime import datetime, timezone
from typing import Optional

from pydantic import EmailStr
from sqlmodel import SQLModel, Field, Relationship

from app.modules.roles.model import Rol, UsuarioRol


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Usuario(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(max_length=100)
    apellido: str = Field(max_length=100)
    email: str = Field(index=True, unique=True, max_length=254)
    hashed_password: str
    disabled: bool = Field(default=False)
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)
    deleted_at: Optional[datetime] = Field(default=None)

    # ORM Relationships
    roles: list[Rol] = Relationship(back_populates="usuarios", link_model=UsuarioRol)
    direcciones: list["DireccionEntrega"] = Relationship(back_populates="usuario")
    pedidos: list["Pedido"] = Relationship(back_populates="usuario")


class UserRegister(SQLModel):
    nombre: str = Field(min_length=1, max_length=100)
    apellido: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8)


class UserLogin(SQLModel):
    email: EmailStr
    password: str


class UserPublic(SQLModel):
    id: int
    nombre: str
    apellido: str
    email: str
    disabled: bool
    roles: list[str] = []
    created_at: datetime


class UserUpdate(SQLModel):
    nombre: Optional[str] = Field(default=None, min_length=1, max_length=100)
    apellido: Optional[str] = Field(default=None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None


class Token(SQLModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class TokenRefresh(SQLModel):
    refresh_token: str


class PaginatedUsuarios(SQLModel):
    items: list[UserPublic]
    total: int
    page: int
    page_size: int
    pages: int
