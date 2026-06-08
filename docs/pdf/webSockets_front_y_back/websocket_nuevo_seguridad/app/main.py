# Entry point de la aplicación FastAPI.
#
# Responsabilidades:
#   - Crear la app FastAPI con lifespan (creación de tablas al arrancar)
#   - Configurar CORS para consumo desde frontend
#   - Registrar routers de cada módulo (usuarios, categorías, pedidos)
#   - Endpoints globales: favicon, raíz (redirige a KDS), health check

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, Response

from app.core.database import create_all_tables
from app.modules.usuarios.router import router as auth_router
from app.modules.categorias.router import router as categorias_router
from app.modules.pedidos.router import router as pedidos_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Crea las tablas de BD al arrancar la aplicación.
    # En tests, la BD de producción no está disponible (conftest.py usa SQLite).
    # El except silencioso permite que la app arranque aunque la BD no exista aún.
    try:
        create_all_tables()
    except Exception:
        pass
    yield


app = FastAPI(
    title="Seguridad JWT + CRUD Categorías + Pedidos/KDS",
    version="1.0.0",
    lifespan=lifespan,
)

# ─── CORS (ajustar origins en producción) ────────────────────────────────────
# Permite peticiones desde frontend en desarrollo (Vite :5173, CRA :3000).
# En producción, reemplazar con el dominio real del frontend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ─────────────────────────────────────────────────────────────────
# El orden de registro no importa porque cada router tiene su propio prefijo.
app.include_router(auth_router)        # /api/v1/auth
app.include_router(categorias_router)  # /api/v1/categorias
app.include_router(pedidos_router)     # /api/v1 + /api/v1/cocina


# ─── Favicon ──────────────────────────────────────────────────────────────────
# Evita el error 404 en navegadores que piden /favicon.ico automáticamente.
@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    # Responde con contenido vacío y content-type image/x-icon
    return Response(content=b"", media_type="image/x-icon")


# ─── Raíz → redirige al KDS ──────────────────────────────────────────────────
# Para que el usuario acceda directamente al Dashboard de Cocina
# abriendo http://localhost:8000 sin recordar la ruta exacta.
@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/api/v1/cocina")


# ─── Health check ────────────────────────────────────────────────────────────
# Endpoint de verificación para monitoreo (load balancers, Docker healthcheck).
@app.get("/health", tags=["health"])
def health():
    return {"status": "ok", "version": "1.0.0"}


# ─── Debug: rooms activas del ConnectionManager ──────────────────────────────
# Muestra qué sockets están en cada room. Útil para verificar que el cajero
# esté en role:pedidos antes de hacer pruebas de WS.
@app.get("/debug/ws-rooms", tags=["debug"])
def ws_rooms():
    from app.core.websocket import manager
    return {
        "total_connections": manager.get_active_connections_count(),
        "rooms": manager.get_rooms_info(),
    }
