# Repositorio de Usuario.
#
# Acceso a BD: queries sin lógica de negocio.
# Hereda de BaseRepository[Usuario] y agrega métodos de búsqueda específicos.
#
# Capa: Repository
# Conoce a: Model (Usuario), Session
# NO conoce a: Service, Router

from sqlmodel import Session, select

from app.core.base_repository import BaseRepository
from app.modules.usuarios.models import Usuario


class UsuarioRepository(BaseRepository[Usuario]):

    def __init__(self, session: Session):
        # Inicializa el repositorio base con el modelo Usuario
        super().__init__(Usuario, session)

    def get_by_username(self, username: str) -> Usuario | None:
        # Busca un usuario por su nombre de usuario (único)
        # Se usa en login y en la dependencia get_current_user
        return self.session.exec(
            select(Usuario).where(Usuario.username == username)
        ).first()

    def get_by_email(self, email: str) -> Usuario | None:
        # Busca un usuario por su email (único)
        # Se usa en registro para validar que el email no esté duplicado
        return self.session.exec(
            select(Usuario).where(Usuario.email == email)
        ).first()
