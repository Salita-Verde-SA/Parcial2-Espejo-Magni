from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Session, select

from app.core.base_repository import BaseRepository
from app.modules.usuarios.model import Usuario
from app.modules.roles.model import UsuarioRol


class UsuarioRepository(BaseRepository[Usuario]):
    """Repositorio para operaciones de consulta y persistencia de usuarios."""

    def __init__(self, session: Session):
        super().__init__(Usuario, session)

    def get_by_email(self, email: str) -> Usuario | None:
        """Busca un usuario activo por su dirección de email."""
        return self.session.exec(
            select(Usuario)
            .where(Usuario.email == email)
            .where(Usuario.deleted_at.is_(None))
        ).first()

    def get_by_id_active(self, user_id: int) -> Usuario | None:
        """Retorna un usuario no eliminado por su ID o None si no existe."""
        return self.session.exec(
            select(Usuario)
            .where(Usuario.id == user_id)
            .where(Usuario.deleted_at.is_(None))
        ).first()

    def get_roles(self, usuario_id: int) -> list[str]:
        """Retorna la lista de códigos de rol asignados a un usuario."""
        stmt = select(UsuarioRol.rol_codigo).where(UsuarioRol.usuario_id == usuario_id)
        return list(self.session.exec(stmt).all())

    def assign_role(self, usuario_id: int, rol_codigo: str) -> None:
        """Asigna un rol a un usuario si no lo tiene ya asignado."""
        existing = self.session.exec(
            select(UsuarioRol)
            .where(UsuarioRol.usuario_id == usuario_id)
            .where(UsuarioRol.rol_codigo == rol_codigo)
        ).first()
        if not existing:
            self.session.add(UsuarioRol(usuario_id=usuario_id, rol_codigo=rol_codigo))
            self.session.flush()

    def remove_role(self, usuario_id: int, rol_codigo: str) -> None:
        """Elimina un rol de un usuario si lo tiene asignado."""
        existing = self.session.exec(
            select(UsuarioRol)
            .where(UsuarioRol.usuario_id == usuario_id)
            .where(UsuarioRol.rol_codigo == rol_codigo)
        ).first()
        if existing:
            self.session.delete(existing)
            self.session.flush()

    def list_filtered(
        self, rol_codigo: str = "", page: int = 1, page_size: int = 10
    ) -> tuple[list[Usuario], int]:
        """Retorna una página de usuarios activos, opcionalmente filtrados por rol."""
        stmt = select(Usuario).where(Usuario.deleted_at.is_(None))
        if rol_codigo:
            stmt = stmt.join(
                UsuarioRol, UsuarioRol.usuario_id == Usuario.id
            ).where(UsuarioRol.rol_codigo == rol_codigo)
            
        all_items = list(self.session.exec(stmt).all())
        total = len(all_items)
        offset = (page - 1) * page_size
        return all_items[offset : offset + page_size], total

    def soft_delete(self, usuario: Usuario) -> None:
        """Marca el usuario como eliminado registrando la fecha de borrado lógico."""
        usuario.deleted_at = datetime.now(timezone.utc)
        self.session.add(usuario)
        self.session.flush()
