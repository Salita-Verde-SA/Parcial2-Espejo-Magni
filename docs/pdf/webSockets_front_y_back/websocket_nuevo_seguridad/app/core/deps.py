# Dependencias de autenticación y autorización para FastAPI.
#
# Este módulo define funciones que se inyectan con Depends() para:
#   - Extraer el token JWT desde la cookie HttpOnly
#   - Validar autenticación (token válido, no expirado)
#   - Validar estado del usuario (activo/desactivado)
#   - Validar permisos (RBAC por roles)
#
# Flujo de ejecución típico en un endpoint protegido:
#
#   Request HTTP
#       ↓
#   OAuth2PasswordBearerWithCookie → extrae token de la cookie access_token
#       ↓
#   get_current_user → decodifica JWT y busca usuario en BD
#       ↓
#   get_current_active_user → valida que el usuario esté activo
#       ↓
#   require_role([...]) → valida permisos (RBAC)
#
# Convenciones HTTP:
#   401 → No autenticado (token inválido, ausente o expirado)
#   403 → Autenticado pero sin permisos suficientes

from typing import Annotated
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session

from app.core.database import get_session
from app.core.security import decode_access_token
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork
from app.modules.usuarios.schemas import UserPublic


class OAuth2PasswordBearerWithCookie(OAuth2PasswordBearer):
    # Versión personalizada de OAuth2PasswordBearer que extrae el token
    # EXCLUSIVAMENTE de la cookie HttpOnly (access_token), NO del header Authorization.
    #
    # ¿Por qué?
    #   - Las cookies HttpOnly no pueden ser leídas por JavaScript (mitigan XSS)
    #   - Si permitiéramos el header, el frontend tendría que manipular el token
    #     en texto plano, arruinando el propósito de seguridad de HttpOnly

    async def __call__(self, request: Request) -> str | None:
        # 1. Intenta obtener el token de la cookie HttpOnly
        token = request.cookies.get("access_token")

        # 2. El header Authorization está deliberadamente deshabilitado
        #    (ver explicación arriba). Si se necesita en el futuro,
        #    descomentar el bloque siguiente.
        #
        # if not token:
        #     authorization = request.headers.get("Authorization")
        #     if authorization and authorization.startswith("Bearer "):
        #         token = authorization.split(" ")[1]

        # 3. Si no hay token en ningún lado, lanza 401 o retorna None
        if not token:
            if self.auto_error:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="No autenticado",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            else:
                return None
        return token


# Instancia global del esquema OAuth2 que extrae el token de la cookie
oauth2_scheme = OAuth2PasswordBearerWithCookie(tokenUrl="/api/v1/auth/token")


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    session: Session = Depends(get_session),
):
    # Decodifica el JWT y retorna el usuario correspondiente.
    #
    # Responsabilidades:
    #   1. Validar token (firma, expiración)
    #   2. Extraer identidad (username del claim "sub")
    #   3. Buscar usuario en base de datos

    # Excepción estándar para errores de autenticación (401)
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales inválidas o token expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Decodifica el JWT → retorna payload o None si es inválido
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    # Extrae el "sub" (subject) del token → es el username
    username: str | None = payload.get("sub")
    if username is None:
        raise credentials_exception

    # Busca el usuario en BD usando Unit of Work
    with UsuarioUnitOfWork(session) as uow:
        user = uow.usuarios.get_by_username(username)
        if user is None:
            # El token es válido pero el usuario fue eliminado
            raise credentials_exception

        return UserPublic.model_validate(user)


async def get_current_active_user(
    current_user: Annotated[UserPublic, Depends(get_current_user)],
):
    # Verifica que el usuario autenticado esté activo.
    # Un usuario con disabled=True no puede operar.
    if current_user.disabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cuenta de usuario desactivada",
        )

    return UserPublic.model_validate(current_user)


def require_role(allowed_roles: list[str]):
    # Factory de dependencias para control de acceso basado en roles (RBAC).
    #
    # Genera dinámicamente una dependencia que valida si el usuario autenticado
    # tiene uno de los roles permitidos.
    #
    # Uso típico:
    #   @router.get("/admin", dependencies=[Depends(require_role(["admin"]))])
    #
    # O como parámetro de endpoint:
    #   def mi_endpoint(_user: Annotated[UserPublic, Depends(require_role(["admin"]))]):

    async def role_checker(
        current_user: Annotated[UserPublic, Depends(get_current_active_user)],
    ) -> UserPublic:
        # Valida que el rol del usuario esté dentro de los permitidos.
        # Si no coincide → 403 Forbidden.
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Permisos insuficientes. Tu rol es '{current_user.role}'. "
                    f"Se requiere uno de: {allowed_roles}"
                ),
            )
        return current_user

    return role_checker
