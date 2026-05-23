from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status

from app.core.deps import get_current_active_user
from app.core.uow import UnitOfWork, get_uow
from app.modules.auth.service import login_user, logout_user, refresh_tokens, register_user
from app.modules.usuarios.model import Token, TokenRefresh, UserLogin, UserPublic, UserRegister

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(data: UserRegister, uow: Annotated[UnitOfWork, Depends(get_uow)], response: Response):
    token_data = register_user(data, uow)
    response.set_cookie(
        key="access_token",
        value=token_data.access_token,
        httponly=True,
        max_age=1800,
        samesite="lax",
        secure=False,
        path="/",
    )
    return token_data


@router.post("/login", response_model=Token)
def login(data: UserLogin, uow: Annotated[UnitOfWork, Depends(get_uow)], response: Response):
    token_data = login_user(data.email, data.password, uow)
    response.set_cookie(
        key="access_token",
        value=token_data.access_token,
        httponly=True,
        max_age=1800,
        samesite="lax",
        secure=False,
        path="/",
    )
    return token_data


@router.post("/refresh", response_model=Token)
def refresh(data: TokenRefresh, uow: Annotated[UnitOfWork, Depends(get_uow)], response: Response):
    token_data = refresh_tokens(data.refresh_token, uow)
    response.set_cookie(
        key="access_token",
        value=token_data.access_token,
        httponly=True,
        max_age=1800,
        samesite="lax",
        secure=False,
        path="/",
    )
    return token_data


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(data: TokenRefresh, uow: Annotated[UnitOfWork, Depends(get_uow)], response: Response):
    logout_user(data.refresh_token, uow)
    response.delete_cookie(key="access_token", path="/")


@router.get("/me", response_model=UserPublic)
def me(ctx: Annotated[tuple, Depends(get_current_active_user)]):
    user, roles = ctx
    return UserPublic(
        id=user.id,
        nombre=user.nombre,
        apellido=user.apellido,
        email=user.email,
        disabled=user.disabled,
        roles=roles,
        created_at=user.created_at,
    )
