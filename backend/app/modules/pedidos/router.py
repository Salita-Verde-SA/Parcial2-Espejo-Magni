from typing import Annotated, Optional
from fastapi import APIRouter, BackgroundTasks, Depends, Query, status
import asyncio

from app.core.deps import get_current_active_user, require_roles
from app.core.uow import UnitOfWork, get_uow
from app.modules.pedidos.model import (
    DireccionCreate,
    DireccionUpdate,
    DireccionPublic,
    PedidoCreate,
    PedidoPublic,
    EstadoPedidoUpdate,
    PaginatedPedidos,
)
from app.modules.pedidos.service import (
    list_direcciones,
    create_direccion,
    update_direccion,
    delete_direccion,
    create_pedido,
    get_pedido,
    list_pedidos,
    update_pedido_estado,
    cancelar_pedido_cliente,
    set_direccion_principal,
)
from app.core.websockets import manager

router = APIRouter(tags=["pedidos"])


@router.get("/api/v1/direcciones/", response_model=list[DireccionPublic])
def list_dirs(
    ctx: Annotated[tuple, Depends(get_current_active_user)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
):
    user, _ = ctx
    return list_direcciones(user.id, uow)


@router.post(
    "/api/v1/direcciones/",
    response_model=DireccionPublic,
    status_code=status.HTTP_201_CREATED,
)
def create_dir(
    data: DireccionCreate,
    ctx: Annotated[tuple, Depends(get_current_active_user)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
):
    user, _ = ctx
    return create_direccion(user.id, data, uow)


@router.put("/api/v1/direcciones/{direccion_id}", response_model=DireccionPublic)
def update_dir(
    direccion_id: int,
    data: DireccionUpdate,
    ctx: Annotated[tuple, Depends(get_current_active_user)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
):
    user, _ = ctx
    return update_direccion(direccion_id, user.id, data, uow)


@router.delete("/api/v1/direcciones/{direccion_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_dir(
    direccion_id: int,
    ctx: Annotated[tuple, Depends(get_current_active_user)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
):
    user, _ = ctx
    delete_direccion(direccion_id, user.id, uow)


@router.patch("/api/v1/direcciones/{direccion_id}/principal", response_model=DireccionPublic)
def set_principal_dir(
    direccion_id: int,
    ctx: Annotated[tuple, Depends(get_current_active_user)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
):
    user, _ = ctx
    return set_direccion_principal(direccion_id, user.id, uow)


@router.post(
    "/api/v1/pedidos/",
    response_model=PedidoPublic,
    status_code=status.HTTP_201_CREATED,
)
async def create_order(
    data: PedidoCreate,
    ctx: Annotated[tuple, Depends(get_current_active_user)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
):
    user, _ = ctx
    result = create_pedido(user.id, data, uow)
    await manager.broadcast({"type": "NEW_PEDIDO", "pedido_id": result.id})
    return result


@router.get("/api/v1/pedidos/", response_model=PaginatedPedidos)
def list_orders(
    ctx: Annotated[tuple, Depends(get_current_active_user)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
    estado_codigo: str = Query(""),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
):
    user, roles = ctx
    return list_pedidos(user.id, roles, estado_codigo, page, page_size, uow)


@router.get("/api/v1/pedidos/{pedido_id}", response_model=PedidoPublic)
def get_order(
    pedido_id: int,
    ctx: Annotated[tuple, Depends(get_current_active_user)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
):
    user, roles = ctx
    return get_pedido(pedido_id, user.id, roles, uow)


@router.patch(
    "/api/v1/pedidos/{pedido_id}/estado",
    response_model=PedidoPublic,
    dependencies=[Depends(require_roles(["ADMIN", "PEDIDOS"]))],
)
async def patch_order_state(
    pedido_id: int,
    data: EstadoPedidoUpdate,
    ctx: Annotated[tuple, Depends(get_current_active_user)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
):
    user, _ = ctx
    result = update_pedido_estado(pedido_id, data.estado_codigo, user.id, uow)
    await manager.broadcast({"type": "PEDIDO_UPDATED", "pedido_id": result.id, "nuevo_estado": result.estado_codigo})
    return result


@router.post("/api/v1/pedidos/{pedido_id}/cancelar", response_model=PedidoPublic)
async def cancel_order_client(
    pedido_id: int,
    ctx: Annotated[tuple, Depends(get_current_active_user)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
):
    user, _ = ctx
    result = cancelar_pedido_cliente(pedido_id, user.id, uow)
    await manager.broadcast({"type": "PEDIDO_UPDATED", "pedido_id": result.id, "nuevo_estado": result.estado_codigo})
    return result
