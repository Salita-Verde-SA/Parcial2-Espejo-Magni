import json
from typing import List
from fastapi import WebSocket

class ConnectionManager:
    """Gestiona las conexiones WebSocket activas y el envío de mensajes en tiempo real."""

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        """Acepta una nueva conexión WebSocket y la registra en la lista activa."""
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        """Elimina una conexión WebSocket de la lista de conexiones activas."""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        """Envía un mensaje JSON a todas las conexiones WebSocket activas."""
        msg_str = json.dumps(message)
        for connection in list(self.active_connections):
            try:
                await connection.send_text(msg_str)
            except Exception:
                self.disconnect(connection)

manager = ConnectionManager()
