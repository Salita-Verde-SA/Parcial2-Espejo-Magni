from fastapi import HTTPException

from app.core.uow import UnitOfWork
from app.modules.usuarios.model import Usuario


def get_user_or_404(user_id: int, uow: UnitOfWork) -> Usuario:
    """Retorna el usuario activo por ID o lanza HTTP 404 si no existe."""
    user = uow.usuarios.get_by_id_active(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user


def set_disabled(user_id: int, disabled: bool, uow: UnitOfWork) -> Usuario:
    """Activa o desactiva la cuenta de un usuario según el valor de disabled."""
    with uow:
        user = uow.usuarios.get_by_id_active(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        user.disabled = disabled
        return uow.usuarios.update(user)
