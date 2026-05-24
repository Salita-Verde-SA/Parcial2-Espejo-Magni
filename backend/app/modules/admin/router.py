from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.core.deps import require_roles
from app.core.uow import UnitOfWork, get_uow
from app.modules.usuarios.model import UserPublic, UserUpdate, PaginatedUsuarios
from app.modules.admin.service import (
    list_usuarios_admin,
    update_usuario_admin,
    delete_usuario_admin,
)

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


@router.get(
    "/usuarios",
    response_model=PaginatedUsuarios,
    dependencies=[Depends(require_roles(["ADMIN"]))],
)
def list_users(
    uow: Annotated[UnitOfWork, Depends(get_uow)],
    rol_codigo: str = Query(""),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
):
    return list_usuarios_admin(rol_codigo, page, page_size, uow)


@router.put(
    "/usuarios/{user_id}",
    response_model=UserPublic,
    dependencies=[Depends(require_roles(["ADMIN"]))],
)
def update_user(
    user_id: int,
    data: UserUpdate,
    uow: Annotated[UnitOfWork, Depends(get_uow)],
):
    return update_usuario_admin(user_id, data, uow)


@router.delete(
    "/usuarios/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_roles(["ADMIN"]))],
)
def delete_user(
    user_id: int,
    uow: Annotated[UnitOfWork, Depends(get_uow)],
):
    delete_usuario_admin(user_id, uow)


@router.post(
    "/usuarios/{user_id}/roles/{rol_codigo}",
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
    "/usuarios/{user_id}/roles/{rol_codigo}",
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
