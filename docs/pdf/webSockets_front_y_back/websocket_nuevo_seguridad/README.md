# Seguridad JWT + Pedidos — FastAPI

API REST con autenticación JWT (cookie HttpOnly), control de acceso por roles (RBAC),
CRUD de categorías, gestión de pedidos con máquina de estados (FSM),
pantallas de cocina/cajero/cliente en tiempo real vía WebSocket con rooms por rol y por pedido.

---

## Arquitectura general

El proyecto sigue **arquitectura en capas** con separación estricta de responsabilidades:

```
Router (HTTP) → Service (lógica de negocio) → Unit of Work (transacción) → Repository (BD) → Model (SQLModel)
```

Cada módulo de dominio (`usuarios`, `categorias`, `pedidos`) replica esta misma estructura,
permitiendo que sean independientes entre sí.

```
app/
├── main.py                    # Entry point — CORS, routers, lifespan
├── core/                      # Infraestructura compartida
│   ├── config.py              # Settings desde .env (pydantic-settings)
│   ├── database.py            # Engine PostgreSQL + factory de sesiones
│   ├── security.py            # bcrypt (passlib) + JWT (python-jose)
│   ├── deps.py                # Dependencias FastAPI: auth, RBAC
│   ├── base_repository.py     # CRUD genérico (BaseRepository[T])
│   ├── unit_of_work.py        # Transacciones atómicas (UnitOfWork)
│   └── websocket.py           # ConnectionManager con rooms por rol y por pedido
├── modules/
│   ├── usuarios/              # Auth, registro, roles (model → repo → uow → service → router)
│   ├── categorias/            # CRUD simple (misma estructura)
│   └── pedidos/               # Pedidos + FSM + WebSocket rooms (misma estructura)
├── db/
│   └── seed.py                # Precarga idempotente de usuarios de prueba
├── templates/
│   ├── kds.html               # Frontend Cocina (KDS)
│   ├── cajero.html            # Frontend Cajero
│   └── cliente.html           # Frontend Cliente
└── tests/
    ├── conftest.py            # Setup de tests (SQLite, fixtures, helpers)
    ├── test_auth.py           # Tests de autenticación
    ├── test_pedidos.py        # Tests de pedidos (CRUD + FSM + RBAC)
    ├── test_categorias.py     # Tests de categorías
    └── test_websocket.py      # Tests del ConnectionManager
```

---

## Autenticación (JWT + cookie HttpOnly)

```
POST /api/v1/auth/register   → crea usuario (role="user")
POST /api/v1/auth/token      → login, devuelve JWT en cookie HttpOnly
POST /api/v1/auth/logout     → elimina la cookie
GET  /api/v1/auth/me         → datos del usuario autenticado
GET  /api/v1/auth/privado    → endpoint de prueba (requiere auth)
```

### Flujo de login

1. El frontend envía `username` + `password` vía form-urlencoded a `POST /api/v1/auth/token`
2. El service valida credenciales contra BD (bcrypt)
3. Si son válidas, genera un JWT firmado con HS256 que incluye `sub` (username) y `role`
4. El router setea una cookie **HttpOnly** con el JWT → no accesible desde JavaScript
5. Las requests subsiguientes leen el token **exclusivamente de la cookie** (no del header Authorization)

### RBAC (Role-Based Access Control)

| Rol | Acceso |
|-----|--------|
| `admin` | Rutas de administración + cualquier transición de estado |
| `pedidos` | Transiciones FSM completas (excepto cancelar en preparación) |
| `cocina` | Solo `confirmado → preparando` y `preparando → enviado` |
| `user` | Rutas protegidas básicas, CRUD categorías, ver sus pedidos |

---

## CRUD Categorías

```
GET    /api/v1/categorias      → listar todas
GET    /api/v1/categorias/{id} → obtener una
POST   /api/v1/categorias      → crear (nombre único)
PATCH  /api/v1/categorias/{id} → actualizar parcial
DELETE /api/v1/categorias/{id} → eliminar
```

Todas requieren autenticación (cualquier rol activo).

---

## Gestión de Pedidos + Máquina de Estados (FSM)

```
GET    /api/v1/pedidos              → listar todos
GET    /api/v1/pedidos/{id}         → obtener uno
POST   /api/v1/pedidos              → crear (estado inicial: "pendiente")
PATCH  /api/v1/pedidos/{id}/estado  → avanzar estado (FSM + RBAC)
```

### Máquina de Estados Finita

Cada pedido nace en `pendiente` y avanza a través de transiciones válidas:

```
                    ┌─────────┐
                    │pendiente│
                    └────┬────┘
                    ┌────┴────┐
               ┌────┤confirmado├────┐
               │    └─────────┘    │
               ▼                   ▼
        ┌───────────┐         ┌──────────┐
        │preparando │         │cancelado │
        └─────┬─────┘         └──────────┘
          ┌───┴───┐
          ▼       ▼
     ┌────────┐ ┌──────────┐
     │ enviado│ │cancelado │
     └───┬────┘ └──────────┘
         ▼
   ┌──────────┐
   │entregado │
   └──────────┘
```

**Reglas:**

- `entregado` y `cancelado` son **estados terminales** — no admiten más transiciones
- `pendiente` solo puede ir a `confirmado` o `cancelado`
- `preparando` puede ir a `enviado` o `cancelado` (pero cancelar en preparación requiere rol `admin`)
- `enviado` solo puede ir a `entregado`

### Permisos por rol (unificados en TRANSICIONES)

La validación FSM y RBAC está unificada en un solo diccionario `TRANSICIONES` en `pedidos/service.py`:

```python
TRANSICIONES = {
    "ADMIN": {
        "pendiente":  {"confirmado", "cancelado"},
        "confirmado": {"preparando", "cancelado"},
        "preparando": {"enviado", "cancelado"},
        "enviado":    {"entregado"},
    },
    "PEDIDOS": {
        "pendiente":  {"confirmado", "cancelado"},
        "confirmado": {"preparando", "cancelado"},
        "preparando": {"enviado"},   # Sin "cancelado"
        "enviado":    {"entregado"},
    },
    "COCINA": {
        "confirmado": {"preparando"},
        "preparando": {"enviado"},
    },
}
```

Cada transición se valida con un solo lookup:

```python
permitidos = TRANSICIONES.get(rol, {}).get(origen, set())
if destino not in permitidos:
    raise HTTPException(403, "Transición no permitida para tu rol")
```

Si un rol no está en el diccionario, no tiene permisos para avanzar estados.

---

## WebSocket — Rooms por Rol y por Pedido

### Arquitectura

El sistema WebSocket usa una arquitectura **híbrida de rooms**:

| Room | Tipo | Quién recibe |
|------|------|--------------|
| `role:cocina` | Rol | Personal de cocina |
| `role:pedidos` | Rol | Cajeros/admin pedidos |
| `role:admin` | Rol | Administradores |
| `role:user` | Rol | Clientes |
| `order:{id}` | Pedido | Cliente que hizo ese pedido |

### Flujo

1. **Conexión**: el backend valida JWT desde cookie HttpOnly, une el socket a `role:{rol}`
2. **Staff**: recibe todos los eventos de su rol automáticamente
3. **Cliente**: se suscribe a `order:{id}` para ver solo sus pedidos
4. **Emisión**: al cambiar estado, se emite a las rooms de rol + room del pedido

### Protocolo WebSocket

```
Cliente → Backend:
  {"action": "subscribe-order",   "order_id": 5}
  {"action": "unsubscribe-order", "order_id": 5}

Backend → Cliente:
  {"event": "PEDIDO_CONFIRMADO",     "data": {...}}
  {"event": "PEDIDO_EN_PREPARACION", "data": {...}}
  {"event": "PEDIDO_EN_CAMINO",      "data": {...}}
  {"event": "PEDIDO_CANCELADO",      "data": {...}}
  {"event": "PEDIDO_ENTREGADO",      "data": {...}}
  {"event": "SUBSCRIBED",            "data": {"order_id": 5}}
```

### Seguridad

- JWT se lee **exclusivamente** de la cookie HttpOnly (no del header)
- Los clientes solo pueden suscribirse a pedidos propios (validación en BD)
- Las rooms son volátiles; al reconectar, se hace fetch inicial desde la API REST

---

## Frontends

### Cocina (KDS)

```
GET /api/v1/cocina           → pantalla HTML
GET /api/v1/cocina/pedidos   → pedidos activos (confirmado + preparando)
```

Board de 2 columnas: **Confirmados** y **En Preparación**. Botones "Cocinar" y "Despachar".
Requiere rol: `cocina`, `pedidos` o `admin`.

### Cajero

```
GET /api/v1/cajero           → pantalla HTML
GET /api/v1/cajero/pedidos   → todos los pedidos
```

Lista completa de pedidos. Crear pedidos, confirmar pendientes, cancelar.
Requiere rol: `pedidos` o `admin`.

### Cliente

```
GET /api/v1/cliente              → pantalla HTML
GET /api/v1/cliente/mis-pedidos  → pedidos del usuario autenticado
```

Ver pedidos propios, crear pedidos, barra de progreso visual.
Se suscribe automáticamente a updates vía WebSocket.
Requiere rol: `user`.

---

## Tests

```bash
pytest tests/ -v
```

66 tests cubriendo:

| Archivo | Tests | Cubre |
|---------|-------|-------|
| `test_auth.py` | 18 | Registro, login, logout, /me, RBAC |
| `test_pedidos.py` | 22 | CRUD, FSM, RBAC por rol, KDS |
| `test_categorias.py` | 14 | CRUD completo |
| `test_websocket.py` | 12 | ConnectionManager, rooms, broadcast |

---

## Requisitos

- Python 3.11+
- PostgreSQL (local o contenedor)

## Instalación

```bash
pip install -r requirements.txt
```

## Variables de entorno

Crear `.env` en la raíz del proyecto:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=tu_password
POSTGRES_DB=seguridad_jwt_db
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

SECRET_KEY=una_clave_muy_larga_de_al_menos_32_caracteres
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## Seed (datos iniciales)

```bash
python -m app.db.seed
```

Usuarios que se crean:

| Usuario | Password | Rol | Pantalla |
|---------|----------|-----|----------|
| admin | Admin1234! | admin | Cajero / Cocina |
| pedidos | Pedidos1234! | pedidos | Cajero |
| cocina | Cocina1234! | cocina | Cocina (KDS) |
| juan | Juan1234! | user | Cliente |
| maria | Maria1234! | user | Cliente |

## Ejecución

```bash
uvicorn app.main:app --reload
```

| URL | Descripción |
|-----|-------------|
| `http://localhost:8000` | Redirige al KDS |
| `http://localhost:8000/docs` | Swagger UI |
| `http://localhost:8000/redoc` | ReDoc |
| `http://localhost:8000/api/v1/cocina` | Pantalla Cocina (KDS) |
| `http://localhost:8000/api/v1/cajero` | Pantalla Cajero |
| `http://localhost:8000/api/v1/cliente` | Pantalla Cliente |



source venv/bin/activate

python -m app.db.seed

python -m fastapi dev app/main.py