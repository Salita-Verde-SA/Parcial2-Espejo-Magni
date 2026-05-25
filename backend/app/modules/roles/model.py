from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING

from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from app.modules.usuarios.model import Usuario


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class UsuarioRol(SQLModel, table=True):
    __tablename__ = "usuario_rol"

    usuario_id: int = Field(foreign_key="usuario.id", primary_key=True)
    rol_codigo: str = Field(foreign_key="rol.codigo", primary_key=True)
    created_at: datetime = Field(default_factory=_utcnow)


class Rol(SQLModel, table=True):
    codigo: str = Field(primary_key=True, max_length=20)
    descripcion: Optional[str] = Field(default=None, max_length=200)
    created_at: datetime = Field(default_factory=_utcnow)

    # Relaciones ORM
    usuarios: list["Usuario"] = Relationship(back_populates="roles", link_model=UsuarioRol)
