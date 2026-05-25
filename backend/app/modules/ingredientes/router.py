from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query, status

from app.core.deps import get_current_active_user, require_roles
from app.core.uow import UnitOfWork, get_uow
from app.modules.ingredientes.model import (
    IngredienteCreate,
    IngredientePublic,
    IngredienteUpdate,
    PaginatedIngredientes,
)
from app.modules.ingredientes.service import IngredienteService

router = APIRouter(prefix="/api/v1/ingredientes", tags=["ingredientes"])


@router.get("/export", dependencies=[Depends(require_roles(["ADMIN"]))])
def export_excel(uow: Annotated[UnitOfWork, Depends(get_uow)]):
    with uow:
        return IngredienteService(uow).export_excel()


@router.get("/", response_model=PaginatedIngredientes)
def list_ingredientes(
    uow: Annotated[UnitOfWork, Depends(get_uow)],
    _: Annotated[tuple, Depends(get_current_active_user)],
    nombre: Optional[str] = Query(default=None),
    es_alergeno: Optional[bool] = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
):
    with uow:
        return IngredienteService(uow).list_filtered(nombre, es_alergeno, page, page_size)


@router.get(
    "/all",
    response_model=PaginatedIngredientes,
    dependencies=[Depends(require_roles(["ADMIN", "STOCK"]))],
)
def list_ingredientes_all(uow: Annotated[UnitOfWork, Depends(get_uow)]):
    """Listar todos los ingredientes incluyendo eliminados (para administración)."""
    with uow:
        return IngredienteService(uow).list_all()


@router.get("/{ingrediente_id}", response_model=IngredientePublic)
def get_ingrediente(
    ingrediente_id: int,
    uow: Annotated[UnitOfWork, Depends(get_uow)],
    _: Annotated[tuple, Depends(get_current_active_user)],
):
    with uow:
        return IngredienteService(uow).get_by_id(ingrediente_id)


@router.post(
    "/",
    response_model=IngredientePublic,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(["ADMIN"]))],
)
def create_ingrediente(
    ing_in: IngredienteCreate,
    uow: Annotated[UnitOfWork, Depends(get_uow)],
):
    with uow:
        return IngredienteService(uow).create(ing_in)


@router.patch(
    "/{ingrediente_id}",
    response_model=IngredientePublic,
    dependencies=[Depends(require_roles(["ADMIN", "STOCK"]))],
)
def update_ingrediente(
    ingrediente_id: int,
    ing_in: IngredienteUpdate,
    uow: Annotated[UnitOfWork, Depends(get_uow)],
):
    with uow:
        return IngredienteService(uow).update(ingrediente_id, ing_in)


@router.delete(
    "/{ingrediente_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_roles(["ADMIN"]))],
)
def delete_ingrediente(
    ingrediente_id: int,
    uow: Annotated[UnitOfWork, Depends(get_uow)],
):
    with uow:
        IngredienteService(uow).soft_delete(ingrediente_id)


@router.post(
    "/{ingrediente_id}/activate",
    response_model=IngredientePublic,
    dependencies=[Depends(require_roles(["ADMIN"]))],
)
def activate_ingrediente(
    ingrediente_id: int,
    uow: Annotated[UnitOfWork, Depends(get_uow)],
):
    with uow:
        return IngredienteService(uow).activate(ingrediente_id)
