from sqlmodel import Session, select

from app.core.base_repository import BaseRepository
from app.modules.usuarios.model import Usuario
from app.modules.roles.model import UsuarioRol


class UsuarioRepository(BaseRepository[Usuario]):
    def __init__(self, session: Session):
        super().__init__(Usuario, session)

    def get_by_email(self, email: str) -> Usuario | None:
        return self.session.exec(
            select(Usuario)
            .where(Usuario.email == email)
            .where(Usuario.deleted_at.is_(None))
        ).first()

    def get_by_id_active(self, user_id: int) -> Usuario | None:
        return self.session.exec(
            select(Usuario)
            .where(Usuario.id == user_id)
            .where(Usuario.deleted_at.is_(None))
        ).first()

    def get_roles(self, usuario_id: int) -> list[str]:
        stmt = select(UsuarioRol.rol_codigo).where(UsuarioRol.usuario_id == usuario_id)
        return list(self.session.exec(stmt).all())

    def assign_role(self, usuario_id: int, rol_codigo: str) -> None:
        existing = self.session.exec(
            select(UsuarioRol)
            .where(UsuarioRol.usuario_id == usuario_id)
            .where(UsuarioRol.rol_codigo == rol_codigo)
        ).first()
        if not existing:
            self.session.add(UsuarioRol(usuario_id=usuario_id, rol_codigo=rol_codigo))
            self.session.flush()

    def remove_role(self, usuario_id: int, rol_codigo: str) -> None:
        existing = self.session.exec(
            select(UsuarioRol)
            .where(UsuarioRol.usuario_id == usuario_id)
            .where(UsuarioRol.rol_codigo == rol_codigo)
        ).first()
        if existing:
            self.session.delete(existing)
            self.session.flush()
