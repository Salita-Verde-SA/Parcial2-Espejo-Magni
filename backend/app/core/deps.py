from typing import Annotated

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer

from app.core.security import decode_access_token
from app.core.uow import UnitOfWork, get_uow
from app.modules.usuarios.model import Usuario

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


async def get_current_user(
    request: Request,
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> tuple[Usuario, list[str]]:
    """Extrae y valida el token del request y retorna el usuario activo con sus roles."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales inválidas o token expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = None
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.lower().startswith("bearer "):
        token = auth_header.split(" ")[1]

    if not token:
        token = request.cookies.get("access_token")

    if not token:
        raise credentials_exception

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_id_str: str | None = payload.get("sub")
    if user_id_str is None:
        raise credentials_exception

    try:
        user_id = int(user_id_str)
    except ValueError:
        raise credentials_exception

    with uow:
        user = uow.usuarios.get_by_id_active(user_id)
        if user is None:
            raise credentials_exception
        roles = uow.usuarios.get_roles(user_id)
        uow.session.refresh(user)

    return user, roles


async def get_current_active_user(
    ctx: Annotated[tuple, Depends(get_current_user)],
) -> tuple[Usuario, list[str]]:
    """Verifica que el usuario autenticado no esté desactivado."""
    user, roles = ctx
    if user.disabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cuenta de usuario desactivada",
        )
    return user, roles


def require_roles(allowed: list[str]):
    """Retorna una dependencia que exige que el usuario tenga al menos uno de los roles indicados."""
    async def checker(
        ctx: Annotated[tuple, Depends(get_current_active_user)],
    ) -> tuple[Usuario, list[str]]:
        """Verifica que el usuario posea uno de los roles requeridos."""
        user, roles = ctx
        if not any(r in allowed for r in roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Se requiere uno de: {allowed}",
            )
        return user, roles

    return checker
