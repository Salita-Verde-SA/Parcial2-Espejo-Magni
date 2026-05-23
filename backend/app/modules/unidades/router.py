from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.core.deps import require_roles
from app.core.uow import UnitOfWork, get_uow
from app.modules.unidades.model import (
    UnidadMedidaCreate,
    UnidadMedidaPublic,
    UnidadMedidaUpdate,
)
from app.modules.unidades.service import (
    create_unidad,
    delete_unidad,
    get_unidad,
    list_unidades,
    update_unidad,
)

router = APIRouter(prefix="/api/v1/unidades", tags=["unidades"])


@router.get("/", response_model=list[UnidadMedidaPublic])
def list_units(uow: Annotated[UnitOfWork, Depends(get_uow)]):
    """Lista todas las unidades de medida ordenadas por tipo y nombre."""
    return list_unidades(uow)


@router.get("/{unidad_id}", response_model=UnidadMedidaPublic)
def get_unit(unidad_id: int, uow: Annotated[UnitOfWork, Depends(get_uow)]):
    """Obtiene una unidad de medida por su ID."""
    return get_unidad(uow, unidad_id)


@router.post(
    "/",
    response_model=UnidadMedidaPublic,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(["ADMIN"]))],
)
def create(data: UnidadMedidaCreate, uow: Annotated[UnitOfWork, Depends(get_uow)]):
    """Crea una nueva unidad de medida. Solo admins."""
    return create_unidad(data, uow)


@router.put(
    "/{unidad_id}",
    response_model=UnidadMedidaPublic,
    dependencies=[Depends(require_roles(["ADMIN"]))],
)
def update(
    unidad_id: int, data: UnidadMedidaUpdate, uow: Annotated[UnitOfWork, Depends(get_uow)]
):
    """Actualiza una unidad de medida existente. Solo admins."""
    return update_unidad(unidad_id, data, uow)


@router.delete(
    "/{unidad_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_roles(["ADMIN"]))],
)
def delete(unidad_id: int, uow: Annotated[UnitOfWork, Depends(get_uow)]):
    """Elimina una unidad de medida (solo si no está en uso). Solo admins."""
    delete_unidad(unidad_id, uow)