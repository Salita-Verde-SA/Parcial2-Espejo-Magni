"""Compatibilidad: el WSManager vive en app/core/ws_manager.py (v7).

Se reexporta `manager` para no romper imports existentes
(`from app.core.websockets import manager`).
"""
from app.core.ws_manager import (  # noqa: F401
    ADMIN_CHANNEL,
    WSManager,
    authenticate_ws,
    manager,
    pedido_channel,
)

# Alias histórico
ConnectionManager = WSManager
