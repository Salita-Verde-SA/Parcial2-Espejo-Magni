from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query, status

from app.core.deps import get_current_active_user, require_roles
from app.core.uow import UnitOfWork, get_uow
from app.modules.productos.model import (
    PaginatedProductos,
    ProductoCreate,
    ProductoPublic,
    ProductoUpdate,
    StockUpdate,
    DisponibilidadUpdate,
)
from app.modules.productos.service import (
    activate_producto,
    create_producto,
    delete_producto,
    export_excel,
    get_producto,
    list_productos,
    list_productos_all,
    update_producto,
    update_stock,
    update_disponibilidad,
)

router = APIRouter(prefix="/api/v1/productos", tags=["productos"])


@router.get("/export", dependencies=[Depends(require_roles(["ADMIN"]))])
def export(uow: Annotated[UnitOfWork, Depends(get_uow)]):
    return export_excel(uow)


@router.get("/", response_model=PaginatedProductos)
def list_prods(
    uow: Annotated[UnitOfWork, Depends(get_uow)],
    nombre: str = Query(""),
    categoria_id: Optional[int] = Query(None),
    disponible: str = Query(""),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
):
    return list_productos(nombre, categoria_id, disponible, page, page_size, uow)


@router.get(
    "/all",
    response_model=PaginatedProductos,
    dependencies=[Depends(require_roles(["ADMIN", "STOCK"]))],
)
def list_prods_all(uow: Annotated[UnitOfWork, Depends(get_uow)]):
    """List all productos including deleted ones (for admin management)."""
    return list_productos_all(uow)


@router.get("/{producto_id}", response_model=ProductoPublic)
def get_prod(producto_id: int, uow: Annotated[UnitOfWork, Depends(get_uow)]):
    return get_producto(producto_id, uow)


@router.post(
    "/",
    response_model=ProductoPublic,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(["ADMIN"]))],
)
def create(data: ProductoCreate, uow: Annotated[UnitOfWork, Depends(get_uow)]):
    return create_producto(data, uow)


@router.put(
    "/{producto_id}",
    response_model=ProductoPublic,
    dependencies=[Depends(require_roles(["ADMIN"]))],
)
def update(producto_id: int, data: ProductoUpdate, uow: Annotated[UnitOfWork, Depends(get_uow)]):
    return update_producto(producto_id, data, uow)


@router.patch(
    "/{producto_id}/stock",
    response_model=ProductoPublic,
    dependencies=[Depends(require_roles(["ADMIN", "STOCK"]))],
)
def patch_stock(producto_id: int, data: StockUpdate, uow: Annotated[UnitOfWork, Depends(get_uow)]):
    return update_stock(producto_id, data, uow)


@router.patch(
    "/{producto_id}/disponibilidad",
    response_model=ProductoPublic,
    dependencies=[Depends(require_roles(["ADMIN", "STOCK"]))],
)
def patch_disponibilidad(producto_id: int, data: DisponibilidadUpdate, uow: Annotated[UnitOfWork, Depends(get_uow)]):
    return update_disponibilidad(producto_id, data, uow)


@router.delete(
    "/{producto_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_roles(["ADMIN"]))],
)
def delete(producto_id: int, uow: Annotated[UnitOfWork, Depends(get_uow)]):
    delete_producto(producto_id, uow)


@router.post(
    "/{producto_id}/activate",
    response_model=ProductoPublic,
    dependencies=[Depends(require_roles(["ADMIN"]))],
)
def activate(producto_id: int, uow: Annotated[UnitOfWork, Depends(get_uow)]):
    return activate_producto(producto_id, uow)
