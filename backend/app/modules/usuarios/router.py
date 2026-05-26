from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.deps import get_current_active_user
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


