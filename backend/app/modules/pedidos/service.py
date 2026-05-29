from datetime import datetime, timezone
from decimal import Decimal
from fastapi import HTTPException, status
from typing import List, Optional
from sqlmodel import select

from app.core.uow import UnitOfWork
from app.modules.pedidos.model import (
    Pedido,
    DetallePedido,
    DireccionEntrega,
    EstadoPedido,
    FormaPago,
    HistorialEstadoPedido,
    DireccionCreate,
    DireccionUpdate,
    DireccionPublic,
    PedidoCreate,
    PedidoPublic,
    DetallePedidoPublic,
    HistorialEstadoPedidoPublic,
    PaginatedPedidos,
)
from app.modules.usuarios.model import Usuario
from app.modules.productos.service import calcular_stock_producto, validar_stock_ingredientes
from app.modules.productos.model import Producto, ProductoIngrediente
from app.modules.ingredientes.model import Ingrediente


def _to_direccion_public(d: DireccionEntrega) -> DireccionPublic:
    return DireccionPublic(
        id=d.id,
        usuario_id=d.usuario_id,
        calle=d.calle,
        numero=d.numero,
        piso=d.piso,
        departamento=d.departamento,
        ciudad=d.ciudad,
        alias=d.alias,
        principal=d.principal,
        created_at=d.created_at,
        updated_at=d.updated_at,
        deleted_at=d.deleted_at,
    )


def _enrich_pedido(p: Pedido, uow: UnitOfWork) -> PedidoPublic:
    user = uow.usuarios.get_by_id(p.usuario_id)
    usuario_nombre = f"{user.nombre} {user.apellido}" if user else "Usuario Desconocido"

    direccion = None
    if p.direccion_id:
        d = uow.direcciones.get_by_id(p.direccion_id)
        if d:
            direccion = _to_direccion_public(d)

    detalles = uow.pedidos.get_detalles(p.id)
    items_public = [
        DetallePedidoPublic(
            id=d.id,
            pedido_id=d.pedido_id,
            producto_id=d.producto_id,
            cantidad=d.cantidad,
            precio_unitario=d.precio_unitario,
            producto_nombre=d.producto_nombre,
        )
        for d in detalles
    ]

    historial = uow.pedidos.get_historial(p.id)
    historial_public = []
    for h in historial:
        h_user = uow.usuarios.get_by_id(h.usuario_id)
        h_user_nombre = f"{h_user.nombre} {h_user.apellido}" if h_user else "Sistema"
        historial_public.append(
            HistorialEstadoPedidoPublic(
                id=h.id,
                pedido_id=h.pedido_id,
                estado_anterior_codigo=h.estado_anterior_codigo,
                estado_nuevo_codigo=h.estado_nuevo_codigo,
                fecha=h.fecha,
                usuario_id=h.usuario_id,
                usuario_nombre=h_user_nombre,
            )
        )

    return PedidoPublic(
        id=p.id,
        usuario_id=p.usuario_id,
        usuario_nombre=usuario_nombre,
        fecha=p.fecha,
        estado_codigo=p.estado_codigo,
        forma_pago_codigo=p.forma_pago_codigo,
        direccion_id=p.direccion_id,
        direccion=direccion,
        total=p.total,
        descuento=p.descuento,
        created_at=p.created_at,
        updated_at=p.updated_at,
        deleted_at=p.deleted_at,
        items=items_public,
        historial=historial_public,
    )


def list_direcciones(usuario_id: int, uow: UnitOfWork) -> List[DireccionPublic]:
    with uow:
        items = uow.direcciones.get_all_active_by_user(usuario_id)
        return [_to_direccion_public(d) for d in items]


def create_direccion(usuario_id: int, data: DireccionCreate, uow: UnitOfWork) -> DireccionPublic:
    with uow:
        existing = uow.direcciones.get_all_active_by_user(usuario_id)
        es_principal = data.principal or len(existing) == 0

        d = DireccionEntrega(
            usuario_id=usuario_id,
            calle=data.calle,
            numero=data.numero,
            piso=data.piso,
            departamento=data.departamento,
            ciudad=data.ciudad,
            alias=data.alias,
            principal=es_principal,
        )
        uow.direcciones.add(d)
        uow.session.flush()

        if es_principal and len(existing) > 0:
            uow.direcciones.clear_principal_except(usuario_id, d.id)

        return _to_direccion_public(d)


def update_direccion(
    direccion_id: int, usuario_id: int, data: DireccionUpdate, uow: UnitOfWork
) -> DireccionPublic:
    with uow:
        d = uow.direcciones.get_by_id_active(direccion_id, usuario_id)
        if not d:
            raise HTTPException(status_code=404, detail="Dirección no encontrada")

        if data.calle is not None:
            d.calle = data.calle
        if data.numero is not None:
            d.numero = data.numero
        if data.piso is not None:
            d.piso = data.piso
        if data.departamento is not None:
            d.departamento = data.departamento
        if data.ciudad is not None:
            d.ciudad = data.ciudad
        if data.alias is not None:
            d.alias = data.alias
        
        if data.principal is not None:
            d.principal = data.principal

        d.updated_at = datetime.now(timezone.utc)
        uow.direcciones.update(d)

        if d.principal:
            uow.direcciones.clear_principal_except(usuario_id, d.id)

        return _to_direccion_public(d)


def set_direccion_principal(direccion_id: int, usuario_id: int, uow: UnitOfWork) -> DireccionPublic:
    with uow:
        d = uow.direcciones.get_by_id_active(direccion_id, usuario_id)
        if not d:
            raise HTTPException(status_code=404, detail="Dirección no encontrada")

        if not d.principal:
            d.principal = True
            d.updated_at = datetime.now(timezone.utc)
            uow.direcciones.update(d)
            uow.direcciones.clear_principal_except(usuario_id, d.id)

        return _to_direccion_public(d)


def delete_direccion(direccion_id: int, usuario_id: int, uow: UnitOfWork) -> None:
    with uow:
        d = uow.direcciones.get_by_id_active(direccion_id, usuario_id)
        if not d:
            raise HTTPException(status_code=404, detail="Dirección no encontrada")

        was_principal = d.principal
        uow.direcciones.soft_delete(d)

        if was_principal:
            restantes = uow.direcciones.get_all_active_by_user(usuario_id)
            if restantes:
                nueva_p = restantes[0]
                nueva_p.principal = True
                uow.direcciones.update(nueva_p)


def _deduct_stock_ingredientes(pedido_id: int, uow: UnitOfWork) -> None:
    detalles = uow.pedidos.get_detalles(pedido_id)
    for d in detalles:
        stmt = select(ProductoIngrediente).where(ProductoIngrediente.producto_id == d.producto_id)
        prod_ings = uow.session.exec(stmt).all()
        if not prod_ings:
            prod = uow.productos.get_by_id(d.producto_id)
            if prod:
                if prod.stock_cantidad < d.cantidad:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Stock insuficiente del producto '{prod.nombre}' para procesar el pedido.",
                    )
                prod.stock_cantidad = prod.stock_cantidad - d.cantidad
                uow.session.add(prod)
        else:
            for pi in prod_ings:
                ing = uow.session.get(Ingrediente, pi.ingrediente_id)
                if ing:
                    cantidad_necesaria = float(pi.cantidad) if pi.cantidad and float(pi.cantidad) > 0 else 1.0
                    total_descuento = cantidad_necesaria * d.cantidad
                    if ing.stock_cantidad is not None:
                        if ing.stock_cantidad < total_descuento:
                            raise HTTPException(
                                status_code=400,
                                detail=f"Stock insuficiente del ingrediente '{ing.nombre}' para procesar el pedido.",
                            )
                        ing.stock_cantidad = ing.stock_cantidad - total_descuento
                        uow.session.add(ing)
    uow.session.flush()


def _restore_stock_ingredientes(pedido_id: int, uow: UnitOfWork) -> None:
    detalles = uow.pedidos.get_detalles(pedido_id)
    for d in detalles:
        stmt = select(ProductoIngrediente).where(ProductoIngrediente.producto_id == d.producto_id)
        prod_ings = uow.session.exec(stmt).all()
        if not prod_ings:
            prod = uow.productos.get_by_id(d.producto_id)
            if prod:
                prod.stock_cantidad = prod.stock_cantidad + d.cantidad
                uow.session.add(prod)
        else:
            for pi in prod_ings:
                ing = uow.session.get(Ingrediente, pi.ingrediente_id)
                if ing:
                    cantidad_necesaria = float(pi.cantidad) if pi.cantidad and float(pi.cantidad) > 0 else 1.0
                    total_retorno = cantidad_necesaria * d.cantidad
                    if ing.stock_cantidad is not None:
                        ing.stock_cantidad = ing.stock_cantidad + total_retorno
                        uow.session.add(ing)
    uow.session.flush()


def create_pedido(usuario_id: int, data: PedidoCreate, uow: UnitOfWork) -> PedidoPublic:
    with uow:
        if data.direccion_id:
            d = uow.direcciones.get_by_id_active(data.direccion_id, usuario_id)
            if not d:
                raise HTTPException(status_code=400, detail="Dirección de entrega inválida o inactiva")
        
        fp = uow.formas_pago.get_by_id(data.forma_pago_codigo)
        if not fp:
            raise HTTPException(status_code=400, detail="Forma de pago inválida")

        total = Decimal("0.00")
        items_a_crear = []
        descuento = data.descuento if data.descuento and data.descuento > 0 else Decimal("0")
        
        for item in data.items:
            prod = uow.productos.get_by_id_active(item.producto_id)
            if not prod:
                raise HTTPException(
                    status_code=404,
                    detail=f"Producto con ID {item.producto_id} no encontrado o inactivo",
                )
            
            stmt = select(ProductoIngrediente).where(ProductoIngrediente.producto_id == prod.id)
            relaciones = uow.session.exec(stmt).all()
            
            if not relaciones:
                if prod.stock_cantidad < item.cantidad:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Stock insuficiente del producto '{prod.nombre}': disponible {prod.stock_cantidad}, solicitado {item.cantidad}",
                    )
            else:
                validar_stock_ingredientes(
                    [
                        type(
                            "InputMock",
                            (),
                            {"ingrediente_id": r.ingrediente_id, "cantidad": r.cantidad * item.cantidad},
                        )()
                        for r in relaciones
                    ],
                    uow,
                )
            
            item_total = prod.precio_base * item.cantidad
            total += item_total
            
            items_a_crear.append(
                {
                    "producto_id": prod.id,
                    "cantidad": item.cantidad,
                    "precio_unitario": prod.precio_base,
                    "producto_nombre": prod.nombre,
                }
            )

        if descuento > total:
            raise HTTPException(
                status_code=400,
                detail=f"El descuento (${descuento}) no puede ser mayor al total (${total})",
            )
        total_final = total - descuento

        p = Pedido(
            usuario_id=usuario_id,
            estado_codigo="PENDIENTE",
            forma_pago_codigo=data.forma_pago_codigo,
            direccion_id=data.direccion_id,
            total=total_final,
            descuento=descuento,
        )
        uow.pedidos.add(p)

        for item_data in items_a_crear:
            dp = DetallePedido(
                pedido_id=p.id,
                producto_id=item_data["producto_id"],
                cantidad=item_data["cantidad"],
                precio_unitario=item_data["precio_unitario"],
                producto_nombre=item_data["producto_nombre"],
            )
            uow.session.add(dp)
        uow.session.flush()

        hist = HistorialEstadoPedido(
            pedido_id=p.id,
            estado_anterior_codigo=None,
            estado_nuevo_codigo="PENDIENTE",
            usuario_id=usuario_id,
        )
        uow.session.add(hist)

        return _enrich_pedido(p, uow)


def get_pedido(pedido_id: int, usuario_id: int, roles: List[str], uow: UnitOfWork) -> PedidoPublic:
    with uow:
        p = uow.pedidos.get_by_id_active(pedido_id)
        if not p:
            raise HTTPException(status_code=404, detail="Pedido no encontrado")
        
        is_staff = any(r in ["ADMIN", "PEDIDOS"] for r in roles)
        if not is_staff and p.usuario_id != usuario_id:
            raise HTTPException(status_code=403, detail="Acceso denegado a este pedido")

        return _enrich_pedido(p, uow)


def list_pedidos(
    usuario_id: int,
    roles: List[str],
    estado_codigo: str,
    page: int,
    page_size: int,
    uow: UnitOfWork,
) -> PaginatedPedidos:
    with uow:
        is_staff = any(r in ["ADMIN", "PEDIDOS"] for r in roles)
        user_filter = None if is_staff else usuario_id
        
        items, total = uow.pedidos.list_filtered(
            usuario_id=user_filter,
            estado_codigo=estado_codigo,
            page=page,
            page_size=page_size,
        )
        
        enriched = [_enrich_pedido(p, uow) for p in items]
        pages = max(1, -(-total // page_size))
        return PaginatedPedidos(items=enriched, total=total, page=page, page_size=page_size, pages=pages)


def update_pedido_estado(
    pedido_id: int, nuevo_estado: str, actual_usuario_id: int, uow: UnitOfWork
) -> PedidoPublic:
    with uow:
        p = uow.pedidos.get_by_id_active(pedido_id)
        if not p:
            raise HTTPException(status_code=404, detail="Pedido no encontrado")

        estado_anterior = p.estado_codigo
        if estado_anterior == nuevo_estado:
            return _enrich_pedido(p, uow)

        validas = {
            "PENDIENTE": ["CONFIRMADO", "CANCELADO"],
            "CONFIRMADO": ["EN_PREP", "CANCELADO"],
            "EN_PREP": ["EN_CAMINO", "CANCELADO"],
            "EN_CAMINO": ["ENTREGADO", "CANCELADO"],
            "ENTREGADO": [],
            "CANCELADO": [],
        }

        if nuevo_estado not in validas.get(estado_anterior, []):
            raise HTTPException(
                status_code=400,
                detail=f"Transición de estado inválida: no se puede pasar de {estado_anterior} a {nuevo_estado}",
            )

        if nuevo_estado == "CONFIRMADO":
            _deduct_stock_ingredientes(p.id, uow)
        
        if nuevo_estado == "CANCELADO" and estado_anterior in ["CONFIRMADO", "EN_PREP", "EN_CAMINO"]:
            _restore_stock_ingredientes(p.id, uow)

        p.estado_codigo = nuevo_estado
        p.updated_at = datetime.now(timezone.utc)
        uow.pedidos.update(p)

        hist = HistorialEstadoPedido(
            pedido_id=p.id,
            estado_anterior_codigo=estado_anterior,
            estado_nuevo_codigo=nuevo_estado,
            usuario_id=actual_usuario_id,
        )
        uow.session.add(hist)

        return _enrich_pedido(p, uow)


def cancelar_pedido_cliente(pedido_id: int, usuario_id: int, uow: UnitOfWork) -> PedidoPublic:
    with uow:
        p = uow.pedidos.get_by_id_active(pedido_id)
        if not p:
            raise HTTPException(status_code=404, detail="Pedido no encontrado")
        
        if p.usuario_id != usuario_id:
            raise HTTPException(status_code=403, detail="No puedes cancelar este pedido")
        
        if p.estado_codigo not in ["PENDIENTE", "CONFIRMADO"]:
            raise HTTPException(
                status_code=400,
                detail="Solo puedes cancelar pedidos que estén pendientes o confirmados",
            )
        
        return update_pedido_estado(pedido_id, "CANCELADO", usuario_id, uow)
