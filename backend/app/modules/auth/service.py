from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status

from app.core.config import settings
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    hash_token,
)
from app.core.uow import UnitOfWork
from app.modules.auth.model import RefreshToken
from app.modules.usuarios.model import Usuario, UserRegister, Token


def register_user(data: UserRegister, uow: UnitOfWork) -> Token:
    with uow:
        if uow.usuarios.get_by_email(data.email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El email ya está registrado",
            )
        user = Usuario(
            nombre=data.nombre,
            apellido=data.apellido,
            email=data.email,
            hashed_password=hash_password(data.password),
        )
        uow.session.add(user)
        uow.session.flush()
        uow.session.refresh(user)
        uow.usuarios.assign_role(user.id, "CLIENT")
        return _issue_tokens(user, ["CLIENT"], uow)


def login_user(email: str, password: str, uow: UnitOfWork) -> Token:
    with uow:
        user = uow.usuarios.get_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales incorrectas",
            )
        if user.disabled:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cuenta desactivada",
            )
        roles = uow.usuarios.get_roles(user.id)
        return _issue_tokens(user, roles, uow)


def refresh_tokens(raw_refresh: str, uow: UnitOfWork) -> Token:
    token_hash = hash_token(raw_refresh)
    with uow:
        rt = uow.refresh_tokens.get_by_hash(token_hash)
        if not rt or rt.revoked_at or rt.expires_at < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token inválido o expirado",
            )
        uow.refresh_tokens.revoke(rt)
        user = uow.usuarios.get_by_id_active(rt.usuario_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
        roles = uow.usuarios.get_roles(user.id)
        return _issue_tokens(user, roles, uow)


def logout_user(raw_refresh: str, uow: UnitOfWork) -> None:
    token_hash = hash_token(raw_refresh)
    with uow:
        rt = uow.refresh_tokens.get_by_hash(token_hash)
        if rt and not rt.revoked_at:
            uow.refresh_tokens.revoke(rt)


def _issue_tokens(user: Usuario, roles: list[str], uow: UnitOfWork) -> Token:
    access = create_access_token(user.id, roles)
    raw_rt, rt_hash = create_refresh_token()
    expires = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    rt = RefreshToken(
        usuario_id=user.id,
        token_hash=rt_hash,
        expires_at=expires,
    )
    uow.session.add(rt)
    uow.session.flush()
    return Token(
        access_token=access,
        refresh_token=raw_rt,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
