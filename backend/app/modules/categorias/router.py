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
    """GET /categorias/ - retorna una página de categorías activas con soporte de filtro por padre."""
    return list_categorias(parent_id, page, page_size, uow)


@router.get(
    "/all",
    response_model=list[CategoriaPublic],
    dependencies=[Depends(require_roles(["ADMIN"]))],
)
def list_cats_all(uow: Annotated[UnitOfWork, Depends(get_uow)]):
    """GET /categorias/all - retorna todas las categorías incluyendo eliminadas, solo admin."""
    return list_categorias_all(uow)


@router.get("/tree", response_model=list[CategoriaTree])
def tree(uow: Annotated[UnitOfWork, Depends(get_uow)]):
    """GET /categorias/tree - retorna el árbol jerárquico de categorías activas."""
    return get_tree(uow)


@router.post(
    "/",
    response_model=CategoriaPublic,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(["ADMIN"]))],
)
def create(data: CategoriaCreate, uow: Annotated[UnitOfWork, Depends(get_uow)]):
    """POST /categorias/ - crea una nueva categoría y retorna la categoría creada."""
    return create_categoria(data, uow)


@router.put(
    "/{cat_id}",
    response_model=CategoriaPublic,
    dependencies=[Depends(require_roles(["ADMIN"]))],
)
def update(cat_id: int, data: CategoriaUpdate, uow: Annotated[UnitOfWork, Depends(get_uow)]):
    """PUT /categorias/{cat_id} - actualiza una categoría y retorna la versión actualizada."""
    return update_categoria(cat_id, data, uow)


@router.delete(
    "/{cat_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_roles(["ADMIN"]))],
)
def delete(cat_id: int, uow: Annotated[UnitOfWork, Depends(get_uow)]):
    """DELETE /categorias/{cat_id} - elimina lógicamente una categoría sin productos activos."""
    delete_categoria(cat_id, uow)


@router.post(
    "/{cat_id}/activate",
    response_model=CategoriaPublic,
    dependencies=[Depends(require_roles(["ADMIN"]))],
)
def activate(cat_id: int, uow: Annotated[UnitOfWork, Depends(get_uow)]):
    """POST /categorias/{cat_id}/activate - reactiva una categoría eliminada y la retorna."""
    return activate_categoria(cat_id, uow)
