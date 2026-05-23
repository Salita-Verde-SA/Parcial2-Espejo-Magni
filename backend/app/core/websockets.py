import json
from typing import List
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # Mantenemos una lista de conexiones activas
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        # Convertimos el diccionario a JSON string
        msg_str = json.dumps(message)
        # Iteramos sobre una copia de la lista para evitar errores si alguien se desconecta en el proceso
        for connection in list(self.active_connections):
            try:
                await connection.send_text(msg_str)
            except Exception:
                # Si falla, probablemente la conexión se cerró abruptamente
                self.disconnect(connection)

# Instancia global del manager para usarla en toda la app
manager = ConnectionManager()
