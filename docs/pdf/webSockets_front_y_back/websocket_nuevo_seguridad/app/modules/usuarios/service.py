# Service de Usuario — lógica de negocio.
#
# Stateless, orquesta operaciones sobre los repositorios a través del UoW.
# Lanza HTTPException. No hace commit/rollback directamente.
#
# Capa: Service
# Conoce a: UoW, Repository (indirectamente vía UoW)
# NO conoce a: Router
#
# Regla de imports:
#   Router → Service → UoW → Repository → Model

from fastapi import HTTPException, status
from sqlmodel import Session

from app.core.config import settings
from app.core.security import hash_password, verify_password, create_access_token
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.schemas import UserCreate, Token, UserPublic
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork


class UsuarioService:
    # Lógica de negocio para autenticación y gestión de usuarios

    def __init__(self, session: Session) -> None:
        # Recibe la sesión de BD inyectada por FastAPI
        self._session = session

    def register(self, user_in: UserCreate) -> UserPublic:
        # Registra un nuevo usuario con role="user" por defecto.
        # Valida que username y email no estén duplicados.
        with UsuarioUnitOfWork(self._session) as uow:
            # Verifica unicidad del username
            if uow.usuarios.get_by_username(user_in.username):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="El nombre de usuario ya está en uso",
                )

            # Verifica unicidad del email
            if uow.usuarios.get_by_email(user_in.email):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="El email ya está registrado",
                )

            # Crea el usuario con password hasheada y role "user"
            usuario = Usuario(
                username=user_in.username,
                full_name=user_in.full_name,
                email=user_in.email,
                hashed_password=hash_password(user_in.password),
                role="user",
            )

            uow.usuarios.add(usuario)
            result = UserPublic.model_validate(usuario)
        return result

    def authenticate(self, username: str, password: str) -> Token:
        # Autentica con username + password.
        # Retorna un Token con JWT si las credenciales son válidas.
        with UsuarioUnitOfWork(self._session) as uow:
            user = uow.usuarios.get_by_username(username)

            # Verifica credenciales: usuario existe y password coincide
            if not user or not verify_password(password, user.hashed_password):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Credenciales incorrectas",
                    headers={"WWW-Authenticate": "Bearer"},
                )

            # Verifica que la cuenta no esté desactivada
            if user.disabled:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cuenta de usuario desactivada",
                )

            # Genera el token JWT con username y role en el payload
            access_token = create_access_token(
                data={"sub": user.username, "role": user.role}
            )
            result = Token(
                access_token=access_token,
                token_type="bearer",
                expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            )
        return result

    def list_all(self) -> list[UserPublic]:
        # Lista todos los usuarios del sistema (solo admin)
        with UsuarioUnitOfWork(self._session) as uow:
            usuarios = uow.usuarios.get_all()
            result = [UserPublic.model_validate(u) for u in usuarios]
        return result

    def set_disabled(self, user_id: int, disabled: bool) -> UserPublic:
        # Activa o desactiva la cuenta de un usuario (solo admin)
        with UsuarioUnitOfWork(self._session) as uow:
            user = uow.usuarios.get_by_id(user_id)
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Usuario no encontrado",
                )
            user.disabled = disabled
            uow.usuarios.update(user)
            result = UserPublic.model_validate(user)
        return result
