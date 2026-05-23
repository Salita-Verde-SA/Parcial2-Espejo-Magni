from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlmodel import select

from app.core.deps import get_current_active_user, require_roles
from app.core.uow import UnitOfWork, get_uow
from app.modules.usuarios.model import Usuario, UserPublic, UserUpdate

router = APIRouter(prefix="/api/v1/usuarios", tags=["usuarios"])


def _to_public(u: Usuario, roles: list[str]) -> UserPublic:
    return UserPublic(
        id=u.id,
        nombre=u.nombre,
        apellido=u.apellido,
        email=u.email,
        disabled=u.disabled,
        roles=roles,
        created_at=u.created_at,
    )


@router.get(
    "/",
    response_model=list[UserPublic],
    dependencies=[Depends(require_roles(["ADMIN"]))],
)
def list_users(uow: Annotated[UnitOfWork, Depends(get_uow)]):
    with uow:
        users = uow.session.exec(
            select(Usuario).where(Usuario.deleted_at.is_(None))
        ).all()
        return [_to_public(u, uow.usuarios.get_roles(u.id)) for u in users]


@router.patch("/me", response_model=UserPublic)
def update_me(
    data: UserUpdate,
    ctx: Annotated[tuple, Depends(get_current_active_user)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
):
    user, _ = ctx
    with uow:
        u = uow.usuarios.get_by_id_active(user.id)
        if data.nombre:
            u.nombre = data.nombre
        if data.apellido:
            u.apellido = data.apellido
        if data.email:
            u.email = str(data.email)
        u.updated_at = datetime.now(timezone.utc)
        uow.usuarios.update(u)
        roles = uow.usuarios.get_roles(u.id)
        return _to_public(u, roles)


@router.post(
    "/{user_id}/roles/{rol_codigo}",
    dependencies=[Depends(require_roles(["ADMIN"]))],
    status_code=status.HTTP_204_NO_CONTENT,
)
def assign_role(
    user_id: int,
    rol_codigo: str,
    uow: Annotated[UnitOfWork, Depends(get_uow)],
):
    with uow:
        uow.usuarios.assign_role(user_id, rol_codigo)


@router.delete(
    "/{user_id}/roles/{rol_codigo}",
    dependencies=[Depends(require_roles(["ADMIN"]))],
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_role(
    user_id: int,
    rol_codigo: str,
    uow: Annotated[UnitOfWork, Depends(get_uow)],
):
    with uow:
        uow.usuarios.remove_role(user_id, rol_codigo)
