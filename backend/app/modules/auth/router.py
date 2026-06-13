from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status

from app.core.deps import get_current_active_user
from app.core.rate_limit import auth_limiter, client_ip
from app.core.uow import UnitOfWork, get_uow
from app.modules.auth.service import login_user, logout_user, refresh_tokens, register_user
from app.modules.usuarios.model import Token, UserLogin, UserPublic, UserRegister

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(data: UserRegister, request: Request, uow: Annotated[UnitOfWork, Depends(get_uow)], response: Response):
    ip = client_ip(request)
    auth_limiter.check(ip)
    try:
        token_data = register_user(data, uow)
    except HTTPException as exc:
        if exc.status_code in (status.HTTP_409_CONFLICT, status.HTTP_400_BAD_REQUEST):
            auth_limiter.register_failure(ip)
        raise
    auth_limiter.reset(ip)
    response.set_cookie(
        key="access_token",
        value=token_data.access_token,
        httponly=True,
        max_age=1800,
        samesite="lax",
        secure=False,
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=token_data.refresh_token,
        httponly=True,
        max_age=604800, 
        samesite="lax",
        secure=False,
        path="/",
    )
    return token_data


@router.post("/login", response_model=Token)
def login(data: UserLogin, request: Request, uow: Annotated[UnitOfWork, Depends(get_uow)], response: Response):
    ip = client_ip(request)
    auth_limiter.check(ip)
    try:
        token_data = login_user(data.email, data.password, uow)
    except HTTPException as exc:
        if exc.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN):
            auth_limiter.register_failure(ip)
        raise
    auth_limiter.reset(ip)
    response.set_cookie(
        key="access_token",
        value=token_data.access_token,
        httponly=True,
        max_age=1800,
        samesite="lax",
        secure=False,
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=token_data.refresh_token,
        httponly=True,
        max_age=604800, 
        samesite="lax",
        secure=False,
        path="/",
    )
    return token_data


@router.post("/refresh", response_model=Token)
def refresh(uow: Annotated[UnitOfWork, Depends(get_uow)], response: Response, refresh_token: Annotated[str | None, Cookie()] = None):
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token missing")
    token_data = refresh_tokens(refresh_token, uow)
    response.set_cookie(
        key="access_token",
        value=token_data.access_token,
        httponly=True,
        max_age=1800,
        samesite="lax",
        secure=False,
        path="/",
    )
    response.set_cookie(
        key="refresh_token",
        value=token_data.refresh_token,
        httponly=True,
        max_age=604800,
        samesite="lax",
        secure=False,
        path="/",
    )
    return token_data


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(uow: Annotated[UnitOfWork, Depends(get_uow)], response: Response, refresh_token: Annotated[str | None, Cookie()] = None):
    if refresh_token:
        logout_user(refresh_token, uow)
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")


@router.get("/me", response_model=UserPublic)
def me(ctx: Annotated[tuple, Depends(get_current_active_user)]):
    user, roles = ctx
    return UserPublic(
        id=user.id,
        nombre=user.nombre,
        apellido=user.apellido,
        email=user.email,
        celular=user.celular,
        disabled=user.disabled,
        roles=roles,
        created_at=user.created_at,
    )
