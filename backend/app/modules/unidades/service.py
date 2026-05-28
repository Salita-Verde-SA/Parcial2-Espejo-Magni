from app.core.uow import UnitOfWork
from app.modules.unidades.model import (
    UnidadMedida,
    UnidadMedidaCreate,
    UnidadMedidaPublic,
    UnidadMedidaUpdate,
    PaginatedUnidades,
)


def list_unidades(uow: UnitOfWork) -> list[UnidadMedidaPublic]:
    """Retorna todas las unidades de medida ordenadas como lista pública."""
    with uow:
        unidades = uow.unidades.get_all()
        return [
            UnidadMedidaPublic(
                id=u.id,
                nombre=u.nombre,
                simbolo=u.simbolo,
                tipo=u.tipo,
                created_at=u.created_at,
            )
            for u in unidades
        ]


def get_unidad(uow: UnitOfWork, unidad_id: int) -> UnidadMedidaPublic:
    """Retorna una unidad de medida por ID o lanza HTTP 404 si no existe."""
    with uow:
        unidad = uow.unidades.get_by_id(unidad_id)
        if not unidad:
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Unidad de medida no encontrada",
            )
        return UnidadMedidaPublic(
            id=unidad.id,
            nombre=unidad.nombre,
            simbolo=unidad.simbolo,
            tipo=unidad.tipo,
            created_at=unidad.created_at,
        )


def create_unidad(data: UnidadMedidaCreate, uow: UnitOfWork) -> UnidadMedidaPublic:
    """Crea una nueva unidad de medida validando unicidad de nombre y símbolo."""
    with uow:
        if uow.unidades.get_by_nombre(data.nombre):
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ya existe una unidad de medida con ese nombre",
            )
        if uow.unidades.get_by_simbolo(data.simbolo):
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ya existe una unidad de medida con ese símbolo",
            )
        
        unidad = UnidadMedida(
            nombre=data.nombre,
            simbolo=data.simbolo,
            tipo=data.tipo,
        )
        created = uow.unidades.add(unidad)
        return UnidadMedidaPublic(
            id=created.id,
            nombre=created.nombre,
            simbolo=created.simbolo,
            tipo=created.tipo,
            created_at=created.created_at,
        )


def update_unidad(
    unidad_id: int, data: UnidadMedidaUpdate, uow: UnitOfWork
) -> UnidadMedidaPublic:
    """Actualiza los campos de una unidad de medida validando unicidad de nombre y símbolo."""
    with uow:
        unidad = uow.unidades.get_by_id(unidad_id)
        if not unidad:
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Unidad de medida no encontrada",
            )
        
        update_data = data.model_dump(exclude_unset=True)
        
        if "nombre" in update_data:
            if uow.unidades.exists_nombre_excluding(update_data["nombre"], unidad_id):
                from fastapi import HTTPException, status
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Ya existe una unidad de medida con ese nombre",
                )
        
        if "simbolo" in update_data:
            if uow.unidades.exists_simbolo_excluding(update_data["simbolo"], unidad_id):
                from fastapi import HTTPException, status
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Ya existe una unidad de medida con ese símbolo",
                )
        
        for key, value in update_data.items():
            setattr(unidad, key, value)
        
        updated = uow.unidades.update(unidad)
        return UnidadMedidaPublic(
            id=updated.id,
            nombre=updated.nombre,
            simbolo=updated.simbolo,
            tipo=updated.tipo,
            created_at=updated.created_at,
        )


def delete_unidad(unidad_id: int, uow: UnitOfWork) -> None:
    """Elimina una unidad de medida si no está en uso en productos ni recetas."""
    with uow:
        unidad = uow.unidades.get_by_id(unidad_id)
        if not unidad:
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Unidad de medida no encontrada",
            )
        
        if uow.unidades.is_used_in_productos(unidad_id):
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se puede eliminar: la unidad está asignada a productos",
            )
        
        if uow.unidades.is_used_in_recetas(unidad_id):
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se puede eliminar: la unidad está en uso en recetas de productos",
            )
        
        uow.unidades.delete(unidad_id)