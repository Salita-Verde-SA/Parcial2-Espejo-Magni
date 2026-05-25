from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query, status

from app.core.deps import require_roles
from app.core.uow import UnitOfWork, get_uow
from app.modules.categorias.model import (
    CategoriaCreate,
    CategoriaPublic,
    CategoriaTree,
    CategoriaUpdate,
    PaginatedCategorias,
)
from app.modules.categorias.service import (
    activate_categoria,
    create_categoria,
    delete_categoria,
    get_tree,
    list_categorias,
    list_categorias_all,
    update_categoria,
)

router = APIRouter(prefix="/api/v1/categorias", tags=["categorias"])


@router.get("/", response_model=PaginatedCategorias)
def list_cats(
    uow: Annotated[UnitOfWork, Depends(get_uow)],
    parent_id: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
):
    return list_categorias(parent_id, page, page_size, uow)


@router.get(
    "/all",
    response_model=list[CategoriaPublic],
    dependencies=[Depends(require_roles(["ADMIN"]))],
)
def list_cats_all(uow: Annotated[UnitOfWork, Depends(get_uow)]):
    """Listar todas las categorías incluyendo eliminadas (para administración)."""
    return list_categorias_all(uow)


@router.get("/tree", response_model=list[CategoriaTree])
def tree(uow: Annotated[UnitOfWork, Depends(get_uow)]):
    return get_tree(uow)


@router.post(
    "/",
    response_model=CategoriaPublic,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(["ADMIN"]))],
)
def create(data: CategoriaCreate, uow: Annotated[UnitOfWork, Depends(get_uow)]):
    return create_categoria(data, uow)


@router.put(
    "/{cat_id}",
    response_model=CategoriaPublic,
    dependencies=[Depends(require_roles(["ADMIN"]))],
)
def update(cat_id: int, data: CategoriaUpdate, uow: Annotated[UnitOfWork, Depends(get_uow)]):
    return update_categoria(cat_id, data, uow)


@router.delete(
    "/{cat_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_roles(["ADMIN"]))],
)
def delete(cat_id: int, uow: Annotated[UnitOfWork, Depends(get_uow)]):
    delete_categoria(cat_id, uow)


@router.post(
    "/{cat_id}/activate",
    response_model=CategoriaPublic,
    dependencies=[Depends(require_roles(["ADMIN"]))],
)
def activate(cat_id: int, uow: Annotated[UnitOfWork, Depends(get_uow)]):
    return activate_categoria(cat_id, uow)
