# Unit of Work del módulo Usuarios.
# Expone el repositorio de usuarios para operaciones atómicas.

from sqlmodel import Session
from app.core.unit_of_work import UnitOfWork
from app.modules.usuarios.repository import UsuarioRepository


class UsuarioUnitOfWork(UnitOfWork):
    def __init__(self, session: Session) -> None:
        # Inicializa el UoW base y expone el repositorio de usuarios
        super().__init__(session)
        self.usuarios = UsuarioRepository(session)
