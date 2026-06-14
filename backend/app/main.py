from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import create_all_tables
from app.modules.auth.router import router as auth_router
from app.modules.usuarios.router import router as usuarios_router
from app.modules.categorias.router import router as categorias_router
from app.modules.ingredientes.router import router as ingredientes_router
from app.modules.productos.router import router as productos_router
from app.modules.unidades.router import router as unidades_router
from app.modules.pedidos.router import router as pedidos_router
from app.modules.admin.router import router as admin_router
from app.modules.pagos.router import router as pagos_router
from app.modules.uploads.router import router as uploads_router
from app.modules.estadisticas.router import router as estadisticas_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        create_all_tables()
    except Exception:
        pass
    yield


app = FastAPI(
    title="Fast Food API",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "http://localhost:3000"],
    allow_origin_regex=r"http://localhost:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(usuarios_router)
app.include_router(categorias_router)
app.include_router(ingredientes_router)
app.include_router(productos_router)
app.include_router(unidades_router)
app.include_router(pedidos_router)
app.include_router(admin_router)
app.include_router(pagos_router)
app.include_router(uploads_router)
app.include_router(estadisticas_router)


from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query

from app.core.ws_manager import manager, authenticate_ws, ADMIN_CHANNEL, pedido_channel
from app.core.uow import UnitOfWork


async def _admin_feed(websocket: WebSocket, token: str | None):
    """Feed global de pedidos para ADMIN/PEDIDOS. Auth JWT en el handshake."""
    payload = authenticate_ws(token)
    roles = payload.get("roles", []) if payload else []
    if not payload or not any(r in ("ADMIN", "PEDIDOS") for r in roles):
        await websocket.close(code=4001)  # no autenticado / sin permiso
        return
    await manager.connect(websocket, ADMIN_CHANNEL)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, ADMIN_CHANNEL)


@app.websocket("/ws/pedidos")
async def websocket_admin_pedidos(websocket: WebSocket, token: str | None = Query(default=None)):
    await _admin_feed(websocket, token)


@app.websocket("/ws/admin/pedidos")
async def websocket_admin_pedidos_alias(websocket: WebSocket, token: str | None = Query(default=None)):
    await _admin_feed(websocket, token)


@app.websocket("/ws/pedidos/{pedido_id}")
async def websocket_pedido(websocket: WebSocket, pedido_id: int, token: str | None = Query(default=None)):
    """Feed de un pedido puntual: su dueño o staff (ADMIN/PEDIDOS)."""
    payload = authenticate_ws(token)
    if not payload:
        await websocket.close(code=4001)
        return
    roles = payload.get("roles", [])
    user_id = int(payload.get("sub", 0))
    is_staff = any(r in ("ADMIN", "PEDIDOS") for r in roles)
    if not is_staff:
        with UnitOfWork() as uow:
            pedido = uow.pedidos.get_by_id_active(pedido_id)
            if not pedido or pedido.usuario_id != user_id:
                await websocket.close(code=4003)  # sin acceso a este pedido
                return
    channel = pedido_channel(pedido_id)
    await manager.connect(websocket, channel)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, channel)


@app.websocket("/ws/mis-pedidos")
async def websocket_mis_pedidos(websocket: WebSocket, token: str | None = Query(default=None)):
    """Feed global para un cliente de todos sus pedidos."""
    from app.core.ws_manager import user_channel
    payload = authenticate_ws(token)
    if not payload:
        await websocket.close(code=4001)
        return
    user_id = int(payload.get("sub", 0))
    channel = user_channel(user_id)
    await manager.connect(websocket, channel)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, channel)


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok", "version": "2.0.0"}
