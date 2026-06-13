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
    # Quién asignó el rol (auditoría) y expiración opcional (rol temporal, v7).
    # asignado_por_id se deja sin FK formal para no introducir una segunda ruta
    # FK a usuario en la tabla puente (rompería el join M2M Usuario<->Rol).
    asignado_por_id: Optional[int] = Field(default=None)
    expires_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=_utcnow)


class Rol(SQLModel, table=True):
    codigo: str = Field(primary_key=True, max_length=20)
    descripcion: Optional[str] = Field(default=None, max_length=200)
    created_at: datetime = Field(default_factory=_utcnow)

    # Relaciones ORM
    usuarios: list["Usuario"] = Relationship(back_populates="roles", link_model=UsuarioRol)
