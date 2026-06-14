"""
WebSocket Manager (v7) — pool de conexiones por canal.

Canales:
  - "admin"          → feed global para ADMIN/PEDIDOS (todos los pedidos).
  - f"pedido:{id}"   → feed de un pedido puntual (su dueño).

El broadcast SIEMPRE se invoca DESPUÉS del commit del UoW (post-commit), nunca
dentro del bloque transaccional. Si no hay suscriptores, es un no-op silencioso.

Autenticación: el handshake recibe ?token=<jwt>. Se valida con decode_access_token.

Capa: core. Conoce a las conexiones WebSocket; no conoce capas superiores.
"""
import json
from collections import defaultdict
from datetime import datetime, timezone
from typing import Optional

from fastapi import WebSocket

from app.core.security import decode_access_token

ADMIN_CHANNEL = "admin"


def pedido_channel(pedido_id: int) -> str:
    return f"pedido:{pedido_id}"


def user_channel(user_id: int) -> str:
    return f"user:{user_id}"


def authenticate_ws(token: Optional[str]) -> Optional[dict]:
    """Valida el JWT del handshake. Devuelve el payload o None si es inválido."""
    if not token:
        return None
    return decode_access_token(token)


class WSManager:
    def __init__(self) -> None:
        # canal -> set de conexiones
        self.rooms: dict[str, set[WebSocket]] = defaultdict(set)

    # ── ciclo de vida ────────────────────────────────────────────────────────
    async def connect(self, websocket: WebSocket, channel: str) -> None:
        await websocket.accept()
        self.rooms[channel].add(websocket)

    def disconnect(self, websocket: WebSocket, channel: Optional[str] = None) -> None:
        if channel is not None:
            self.rooms.get(channel, set()).discard(websocket)
        else:
            for conns in self.rooms.values():
                conns.discard(websocket)

    # ── envío ────────────────────────────────────────────────────────────────
    async def _send_to_channel(self, channel: str, message: dict) -> None:
        msg = json.dumps(message, default=str)
        for connection in list(self.rooms.get(channel, set())):
            try:
                await connection.send_text(msg)
            except Exception:
                self.disconnect(connection, channel)

    async def broadcast_pedido(self, pedido_id: int, evento: dict) -> None:
        """Notifica al dueño del pedido y al canal admin."""
        evento = {**evento, "pedido_id": pedido_id}
        evento.setdefault("timestamp", datetime.now(timezone.utc).isoformat())
        await self._send_to_channel(pedido_channel(pedido_id), evento)
        await self._send_to_channel(ADMIN_CHANNEL, evento)
        uid = evento.get("usuario_id")
        if uid is not None:
            await self._send_to_channel(user_channel(int(uid)), evento)

    async def broadcast_to_role(self, channel: str, evento: dict) -> None:
        evento.setdefault("timestamp", datetime.now(timezone.utc).isoformat())
        await self._send_to_channel(channel, evento)

    async def broadcast(self, evento: dict) -> None:
        """Compatibilidad: emite al canal admin y, si trae pedido_id, a su canal."""
        evento.setdefault("timestamp", datetime.now(timezone.utc).isoformat())
        await self._send_to_channel(ADMIN_CHANNEL, evento)
        pid = evento.get("pedido_id")
        if pid is not None:
            await self._send_to_channel(pedido_channel(int(pid)), evento)
        uid = evento.get("usuario_id")
        if uid is not None:
            await self._send_to_channel(user_channel(int(uid)), evento)


manager = WSManager()
