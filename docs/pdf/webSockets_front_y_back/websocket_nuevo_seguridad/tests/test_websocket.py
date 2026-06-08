# =============================================================================
# TESTS — WebSocket (ConnectionManager + Rooms)
# =============================================================================
#
# Cubre:
#   - ConnectionManager: connect, disconnect, rooms
#   - Broadcast por rol
#   - Broadcast por pedido
#   - Deduplicación (socket en múltiples rooms)
#   - Limpieza en desconexión

import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock
from fastapi import WebSocket

from app.core.websocket import ConnectionManager


# ─── HELPER: Mock WebSocket ──────────────────────────────────────────────────

class MockWebSocket:
    """Mock de WebSocket para tests unitarios del ConnectionManager."""

    def __init__(self):
        self.sent: list[dict] = []
        self.accepted = False
        self.closed = False

    async def accept(self):
        self.accepted = True

    async def send_json(self, data: dict):
        self.sent.append(data)

    async def close(self, code: int = 1000, reason: str = ""):
        self.closed = True


# ─── TESTS DEL CONNECTION MANAGER ───────────────────────────────────────────

class TestConnectionManager:
    """Tests unitarios del ConnectionManager (sin servidor real)."""

    def test_connect_agrega_a_room_rol(self):
        """Al conectar, el socket se une a room de su rol"""
        manager = ConnectionManager()
        ws = MockWebSocket()

        asyncio.run(manager.connect(ws, role="cocina", user_id=1))

        assert "role:cocina" in manager.rooms
        assert ws in manager.rooms["role:cocina"]
        assert ws in manager.socket_rooms

    def test_disconnect_limpia_todas_las_rooms(self):
        """Al desconectar, el socket se remueve de todas las rooms"""
        manager = ConnectionManager()
        ws = MockWebSocket()

        asyncio.run(manager.connect(ws, role="cocina", user_id=1))
        manager.join_order_room(ws, order_id=5)

        assert "role:cocina" in manager.rooms
        assert "order:5" in manager.rooms

        manager.disconnect(ws)

        assert ws not in manager.socket_rooms
        # Rooms vacías deben eliminarse
        assert "role:cocina" not in manager.rooms
        assert "order:5" not in manager.rooms

    def test_join_order_room(self):
        """Unirse a room de pedido específico"""
        manager = ConnectionManager()
        ws = MockWebSocket()

        asyncio.run(manager.connect(ws, role="user", user_id=2))
        manager.join_order_room(ws, order_id=5)

        assert "order:5" in manager.rooms
        assert ws in manager.rooms["order:5"]

    def test_leave_order_room(self):
        """Salir de room de pedido específico"""
        manager = ConnectionManager()
        ws = MockWebSocket()

        asyncio.run(manager.connect(ws, role="user", user_id=2))
        manager.join_order_room(ws, order_id=5)
        manager.leave_order_room(ws, order_id=5)

        assert "order:5" not in manager.rooms

    def test_broadcast_to_role(self):
        """Broadcast a todos los sockets en una room de rol"""
        manager = ConnectionManager()
        ws1 = MockWebSocket()
        ws2 = MockWebSocket()
        ws3 = MockWebSocket()

        asyncio.run(manager.connect(ws1, role="cocina", user_id=1))
        asyncio.run(manager.connect(ws2, role="cocina", user_id=2))
        asyncio.run(manager.connect(ws3, role="pedidos", user_id=3))

        asyncio.run(manager.broadcast_to_role("cocina", "TEST_EVENT", {"msg": "hola"}))

        # Solo los cocineros deben recibir
        assert len(ws1.sent) == 1
        assert len(ws2.sent) == 1
        assert len(ws3.sent) == 0
        assert ws1.sent[0]["event"] == "TEST_EVENT"

    def test_broadcast_to_order(self):
        """Broadcast solo a los sockets suscritos a un pedido"""
        manager = ConnectionManager()
        ws_cocina = MockWebSocket()
        ws_cliente = MockWebSocket()

        asyncio.run(manager.connect(ws_cocina, role="cocina", user_id=1))
        asyncio.run(manager.connect(ws_cliente, role="user", user_id=2))
        manager.join_order_room(ws_cliente, order_id=5)

        asyncio.run(manager.broadcast_to_order(5, "STATUS_CHANGED", {"id": 5}))

        # Solo el cliente suscrito recibe
        assert len(ws_cocina.sent) == 0
        assert len(ws_cliente.sent) == 1
        assert ws_cliente.sent[0]["data"]["id"] == 5

    def test_broadcast_to_roles_deduplica(self):
        """Un socket en múltiples rooms solo recibe una vez"""
        manager = ConnectionManager()
        ws_admin = MockWebSocket()

        asyncio.run(manager.connect(ws_admin, role="admin", user_id=1))
        # Admin también en role:pedidos (simular)
        manager._join_room(ws_admin, "role:pedidos")

        asyncio.run(manager.broadcast_to_roles(["admin", "pedidos"], "EVENT", {}))

        # Debe recibir solo una vez, no dos
        assert len(ws_admin.sent) == 1

    def test_broadcast_room_vacia_no_error(self):
        """Emitir a room vacía no lanza error"""
        manager = ConnectionManager()
        # No debería lanzar excepción
        asyncio.run(manager.broadcast_to_role("no_existe", "EVENT", {}))

    def test_desconexion_limpia_socket_rooms(self):
        """Al desconectar, socket_rooms se limpia correctamente"""
        manager = ConnectionManager()
        ws = MockWebSocket()

        asyncio.run(manager.connect(ws, role="cocina", user_id=1))
        manager.join_order_room(ws, order_id=5)
        manager.join_order_room(ws, order_id=10)

        assert ws in manager.socket_rooms
        assert len(manager.socket_rooms[ws]) == 3  # role:cocina + order:5 + order:10

        manager.disconnect(ws)

        assert ws not in manager.socket_rooms

    def test_get_rooms_info(self):
        """get_rooms_info retorna información de debug"""
        manager = ConnectionManager()
        ws1 = MockWebSocket()
        ws2 = MockWebSocket()

        asyncio.run(manager.connect(ws1, role="cocina", user_id=1))
        asyncio.run(manager.connect(ws2, role="cocina", user_id=2))
        manager.join_order_room(ws1, order_id=5)

        info = manager.get_rooms_info()
        assert info["role:cocina"] == 2
        assert info["order:5"] == 1

    def test_active_connections_count(self):
        """active_connections_count retorna el total de sockets únicos"""
        manager = ConnectionManager()
        ws1 = MockWebSocket()
        ws2 = MockWebSocket()

        asyncio.run(manager.connect(ws1, role="cocina", user_id=1))
        asyncio.run(manager.connect(ws2, role="cocina", user_id=2))
        manager.join_order_room(ws1, order_id=5)

        # 2 sockets únicos (no importa cuántas rooms tengan)
        assert manager.get_active_connections_count() == 2

    def test_varios_roles_misma_room(self):
        """Múltiples sockets en la misma room de rol"""
        manager = ConnectionManager()
        sockets = [MockWebSocket() for _ in range(5)]

        for i, ws in enumerate(sockets):
            asyncio.run(manager.connect(ws, role="cocina", user_id=i))

        assert len(manager.rooms["role:cocina"]) == 5

        asyncio.run(manager.broadcast_to_role("cocina", "EVENT", {}))

        for ws in sockets:
            assert len(ws.sent) == 1
