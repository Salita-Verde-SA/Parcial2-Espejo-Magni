# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> Note: The global/parent `CLAUDE.md` files that may appear in context belong to a different project (`activia-trace`). They do **not** apply here. This is **FastFood**, a food-ordering platform built for a university exam ("Parcial 2"). Codebase and comments are in Spanish.

## Stack

- **Backend**: FastAPI 0.115 + SQLModel + PostgreSQL 15, JWT auth (PyJWT), bcrypt via passlib. Python 3.11+.
- **Frontend**: React 18 + TypeScript + Vite, TanStack Query (server state), Zustand (client state: auth/cart/payment/ui), React Router 6, Tailwind, Axios.
- **Integrations**: Mercado Pago (`pagos` module + `@mercadopago/sdk-react`), WebSockets for live order updates, openpyxl for Excel export.

## Commands

### Docker (full stack)
```bash
docker-compose up -d          # postgres + backend + frontend + adminer
docker-compose logs -f backend
docker-compose down -v        # also drops the postgres volume
```
Exposed ports differ from internal ports — **`docker-compose.yml` is the source of truth**, not the README:
- Postgres: host `5433` → container `5432`
- Backend: host `8001` → container `8000` (Swagger at `http://localhost:8001/docs`)
- Frontend (nginx): host `80`
- Adminer: host `8080`

### Backend (local, no Docker)
```bash
cd backend
python -m venv venv && .\venv\Scripts\activate   # PowerShell / Windows
pip install -r requirements.txt
python -m app.db.seed                            # create tables + seed roles, users, catalog
python -m uvicorn app.main:app --reload --port 8000
```

### Frontend (local)
```bash
cd frontend
npm install
npm run dev      # Vite dev server (proxies /api and /ws to backend — see vite.config.ts)
npm run build    # tsc typecheck + vite build
```

### Tests
`requirements.txt` includes `pytest`/`pytest-asyncio`, but the `backend/test_*.py` and `backend/restore_admin.py` files are **ad-hoc connectivity/debug scripts run directly** (`python backend/test_db.py`), **not** a pytest suite. There is currently no real automated test suite.

## Architecture

### Layered modular monolith (backend)
Strict unidirectional flow — **never skip a layer**:
```
Router → Service → Repository → Model (SQLModel table)
```
- **Routers** (`modules/*/router.py`): HTTP only. Declare auth deps, parse/return Pydantic schemas, no business logic.
- **Services** (`modules/*/service.py`): business logic. Receive a `UnitOfWork`, never touch the session/DB directly — go through repositories. Map ORM models → `*Public` response schemas.
- **Repositories** (`modules/*/repository.py`): the only place that issues queries. Inherit `BaseRepository[T]` (`app/core/base_repository.py`) for CRUD; add domain queries as methods. Repos call `session.flush()`, **never `commit()`** — the UoW commits.
- **Models** (`modules/*/model.py`): SQLModel `table=True` entities **and** the request/response (`*Create`, `*Update`, `*Public`) schemas live together per module.

### Unit of Work (`app/core/uow.py`) — central pattern
`UnitOfWork` opens one `Session(engine, expire_on_commit=False)` in `__enter__`, wires up **every** repository as an attribute (`uow.usuarios`, `uow.pedidos`, `uow.direcciones`, …), and on `__exit__` commits on success / rolls back on exception. Injected into every router via `Depends(get_uow)` and passed down to services. When you add a new module, register its repository in `UnitOfWork.__enter__` so services can reach it.

### Auth & RBAC (`app/core/deps.py`, `app/core/security.py`)
- **Dual token transport**: access JWT is read from the `Authorization: Bearer` header **or** the `access_token` httpOnly cookie. Refresh tokens are random, stored as **sha256 hashes only**, and rotated (`/api/v1/auth/refresh`).
- Identity always derives from the verified JWT `sub` → user loaded from DB → roles loaded from DB. Never trust role/identity from request params.
- `get_current_active_user` → `(Usuario, roles)` tuple; `require_roles(["ADMIN", ...])` is the per-endpoint gate (fail-closed 403).
- **Roles are string codes**: `ADMIN`, `STOCK`, `PEDIDOS`, `CLIENT` (see `modules/roles/model.py` + `db/seed.py`). Many-to-many via `usuario_rol` link table.

### Schema lifecycle — no Alembic
Tables are created with `SQLModel.metadata.create_all(engine)` on app startup (`main.py` lifespan) and in `db/seed.py`. **There are no Alembic migrations.** Schema changes are done by editing models + one-off scripts in `app/db/migrations/` (e.g. `add_unidad_medida.py`). `create_all_tables()` in `app/core/database.py` must `import` every module's model so it registers in the metadata — add new model modules there.

### WebSockets — live order board
`/ws/pedidos` (defined in `main.py`) uses a singleton in-memory `ConnectionManager` (`app/core/websockets.py`). The `pedidos` service/router calls `manager.broadcast(...)` on order state changes; the frontend `usePedidosWebSocket` hook listens and invalidates TanStack Query caches.

### Frontend structure
- `src/api/*.ts`: one Axios module per backend domain. All requests go through `src/api/client.ts`, which injects the bearer token and transparently retries once on 401 by hitting `/api/v1/auth/refresh` (single-flight refresh with a wait queue).
- `src/stores/*`: Zustand stores — `authStore` (token/roles, persisted), `cartStore`, `paymentStore`, `uiStore`.
- `src/features/{admin,store,ui}/components` + `src/pages/*`: pages compose feature components.
- **Routing & access control** in `App.tsx`: `RequireAuth` gates on token presence; `RequireRole` gates on roles; `landingPathFor(roles)` redirects each role to its home area after login.

## Domain model (orders core)
`pedidos` is the most complex module. A `Pedido` has `DetallePedido` lines, a `DireccionEntrega`, an `EstadoPedido` (state machine: `PENDIENTE → CONFIRMADO → EN_PREP → EN_CAMINO → ENTREGADO`, or `CANCELADO`), a `FormaPago` (`EFECTIVO`/`MERCADOPAGO`/`TARJETA`), and a `HistorialEstadoPedido` audit trail. Products (`Producto`) are composed of `Ingrediente`s with quantities/units; stock is validated against ingredient availability (`productos.service.validar_stock_ingredientes` / `calcular_stock_producto`).

## Conventions
- All API routes are prefixed `/api/v1/...`.
- snake_case in Python (incl. DB columns); PascalCase React components, one component per file.
- Soft delete via `deleted_at` columns; repositories expose `*_active` query variants (e.g. `get_by_id_active`).
- Seed credentials (dev only): `admin@fastfood.com / Admin1234!` (ADMIN+CLIENT), plus `stock@`, `pedidos@`, `juan@`.
- Config (`app/core/config.py`) reads `postgres_*` env vars and computes `DATABASE_URL` (overridable by a `DATABASE_URL` env var). Secrets (`SECRET_KEY`, `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `NGROK_URL`) come from `.env` — see `.env.example`.
