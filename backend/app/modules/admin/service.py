from fastapi import HTTPException
from typing import Optional

from app.core.uow import UnitOfWork
from app.modules.usuarios.model import Usuario, UserUpdate, PaginatedUsuarios, UserPublic
from app.modules.productos.model import Producto
from app.modules.pedidos.model import Pedido
from app.modules.admin.schema import DashboardData
from sqlalchemy import func


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


def list_usuarios_admin(
    rol_codigo: str, page: int, page_size: int, uow: UnitOfWork
) -> PaginatedUsuarios:
    with uow:
        items, total = uow.usuarios.list_filtered(rol_codigo, page, page_size)
        public_items = [_to_public(u, uow.usuarios.get_roles(u.id)) for u in items]
        pages = max(1, -(-total // page_size))
        return PaginatedUsuarios(
            items=public_items,
            total=total,
            page=page,
            page_size=page_size,
            pages=pages,
        )


def update_usuario_admin(
    user_id: int, data: UserUpdate, uow: UnitOfWork
) -> UserPublic:
    with uow:
        user = uow.usuarios.get_by_id_active(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        if data.nombre is not None:
            user.nombre = data.nombre
        if data.apellido is not None:
            user.apellido = data.apellido
        if data.email is not None:
            # Verificar si el email ya está siendo usado por otro usuario
            existing_user = uow.usuarios.get_by_email(str(data.email))
            if existing_user and existing_user.id != user_id:
                raise HTTPException(status_code=409, detail="Email ya registrado por otro usuario")
            user.email = str(data.email)

        uow.usuarios.update(user)
        roles = uow.usuarios.get_roles(user.id)
        return _to_public(user, roles)


def delete_usuario_admin(user_id: int, uow: UnitOfWork) -> None:
    with uow:
        user = uow.usuarios.get_by_id_active(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        # Eliminación lógica (soft delete)
        uow.usuarios.soft_delete(user)

def get_dashboard_data(uow: UnitOfWork) -> DashboardData:
    with uow:
        session = uow.session
        
        total_usuarios = session.query(Usuario).filter(Usuario.deleted_at == None).count()
        total_productos = session.query(Producto).filter(Producto.deleted_at == None).count()
        total_pedidos = session.query(Pedido).filter(Pedido.deleted_at == None).count()
        
        pedidos_estado_counts = (
            session.query(Pedido.estado_codigo, func.count(Pedido.id))
            .filter(Pedido.deleted_at == None)
            .group_by(Pedido.estado_codigo)
            .all()
        )
        
        pedidos_por_estado = {k: v for k, v in pedidos_estado_counts}
        
        return DashboardData(
            total_pedidos=total_pedidos,
            total_productos=total_productos,
            total_usuarios=total_usuarios,
            pedidos_por_estado=pedidos_por_estado
        )
