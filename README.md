# FastFood - Plataforma de Pedidos

> 📁 **Documentación adicional** en `/docs/pdf/` — archivos complementarios del proyecto.

## Entrega para el parcial

[Enlace al video para la presentación del segundo parcial](https://drive.google.com/file/d/111Qs4vTrp4xQ8rA84ZaXlW0PcZnhixfC/view?usp=sharing)

**Integrantes del grupo**

- Castillo Fabrizio
- Genem Agustín
- Luna Joaquín
- Palmero Manuel
- Rojas Uriel

## Índice

1. [Stack Tecnológico](#stack-tecnológico)
2. [Estructura del Proyecto](#estructura-del-proyecto)
3. [Ejecución con Docker](#ejecución-con-docker)
4. [Ejecución sin Docker](#ejecución-sin-docker)
5. [Roles y Permisos](#roles-y-permisos)
6. [Endpoints Principales](#endpoints-principales)
7. [Configuración Inicial](#configuración-inicial)

---

## Stack Tecnológico

**Backend:**
- FastAPI 0.115.6
- SQLModel + PostgreSQL 15
- JWT (access token 30 min + refresh token 7 días)
- WebSockets para actualizaciones en tiempo real
- Pytest para testing

**Frontend:**
- React 18 + TypeScript
- Vite (bundler)
- TanStack Query v5 (server state)
- Zustand v5 (client state)
- Axios + Tailwind CSS

**Infraestructura:**
- Docker & Docker Compose
- Nginx (frontend)
- PostgreSQL 15
- Adminer (administración de BD)

---

## Estructura del Proyecto

```
Parcial2-Espejo-Magni/
├── backend/                          # API FastAPI
│   ├── app/
│   │   ├── core/                     # Configuración central
│   │   │   ├── config.py             # Variables de entorno
│   │   │   ├── database.py           # Conexión a BD
│   │   │   ├── security.py           # JWT, hashing
│   │   │   ├── deps.py               # Dependencias (auth, roles)
│   │   │   ├── uow.py                # Unit of Work
│   │   │   ├── base_repository.py    # Repositorio genérico
│   │   │   └── websockets.py         # ConnectionManager
│   │   ├── modules/                  # Módulos por dominio
│   │   │   ├── admin/
│   │   │   ├── auth/
│   │   │   ├── categorias/
│   │   │   ├── ingredientes/
│   │   │   ├── pedidos/
│   │   │   ├── productos/
│   │   │   ├── roles/
│   │   │   ├── unidades/
│   │   │   └── usuarios/
│   │   ├── db/
│   │   │   ├── migrations/
│   │   │   └── seed.py               # Datos iniciales (idempotente)
│   │   └── main.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── docker-entrypoint.sh
├── frontend/                         # App React unificada (admin + tienda)
│   ├── src/
│   │   ├── api/
│   │   ├── components/               # Layout con nav por rol, CarritoDrawer
│   │   ├── hooks/                    # usePedidosWebSocket (tiempo real)
│   │   ├── pages/                    # Catálogo, Checkout, MisPedidos, Admin*
│   │   ├── stores/                   # authStore, cartStore, uiStore (Zustand)
│   │   └── types/
│   ├── package.json
│   ├── vite.config.ts
│   ├── Dockerfile
│   └── nginx.conf
├── docs/
│   └── pdf/
├── docker-compose.yml
└── .env.example
```

---

## Ejecución con Docker

### Requisitos
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Windows**: WSL 2 habilitado

### Pasos

1. **Clonar el proyecto y entrar al directorio:**
   ```bash
   cd Parcial2-Espejo-Magni
   ```

2. **Crear `.env`** (si no existe):
   ```bash
   cp .env.example .env
   ```

3. **Levantar todos los servicios:**
   ```bash
   docker-compose up -d
   ```

   | Servicio | URL |
   |----------|-----|
   | Backend API | http://localhost:8000 |
   | Swagger UI | http://localhost:8000/docs |
   | Frontend (Admin + Tienda) | http://localhost:80 |
   | Adminer (BD) | http://localhost:8080 |

4. **Ver logs:**
   ```bash
   docker-compose logs -f backend
   docker-compose logs -f frontend
   ```

5. **Detener:**
   ```bash
   docker-compose down
   ```

### Acceder a Adminer

Ir a http://localhost:8080 y completar:
- **Sistema:** PostgreSQL
- **Servidor:** `postgres`
- **Usuario:** `fastfood`
- **Contraseña:** `fastfood`
- **Base de datos:** `fastfood_db`

---

## Ejecución sin Docker

### Requisitos
- Python 3.11+
- Node.js 18+
- PostgreSQL 15

### Backend (FastAPI)

```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Disponible en http://localhost:5173
```

### Datos iniciales (seed)

```bash
cd backend
python -m app.db.seed
```

El seed es idempotente: puede ejecutarse múltiples veces sin duplicar datos. Carga roles, estados de pedido, formas de pago, unidades de medida, categorías, ingredientes, usuarios de prueba y productos.

---

## Roles y Permisos

Un único login (`/login`) para todos los roles. Tras autenticarse, el sistema redirige automáticamente según el rol y muestra solo las secciones autorizadas.

| Rol | Secciones visibles | Redirige a |
|-----|--------------------|------------|
| `ADMIN` | Catálogo, Insumos, Productos, Categorías, Usuarios, Pedidos | `/admin/pedidos` |
| `STOCK` | Insumos, Productos | `/ingredientes` |
| `PEDIDOS` | Pedidos (gestión) | `/admin/pedidos` |
| `CLIENT` | Catálogo, Mis Pedidos, Carrito/Checkout | `/catalogo` |

**Usuarios de prueba (seed):**
| Email | Contraseña | Rol |
|-------|-----------|-----|
| admin@fastfood.com | admin123 | ADMIN |
| stock@fastfood.com | stock123 | STOCK |
| pedidos@fastfood.com | pedidos123 | PEDIDOS |
| cliente@fastfood.com | cliente123 | CLIENT |

---

## Endpoints Principales

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/v1/auth/login` | POST | Autenticarse |
| `/api/v1/auth/register` | POST | Registrarse |
| `/api/v1/auth/refresh` | POST | Renovar token |
| `/api/v1/auth/logout` | POST | Cerrar sesión |
| `/api/v1/categorias` | GET/POST | Listar/crear categorías |
| `/api/v1/categorias/tree` | GET | Árbol jerárquico de categorías |
| `/api/v1/productos` | GET/POST | Listar/crear productos |
| `/api/v1/ingredientes` | GET/POST | Listar/crear insumos |
| `/api/v1/pedidos` | GET/POST | Listar/crear pedidos |
| `/api/v1/pedidos/{id}/estado` | PATCH | Avanzar estado (FSM) |
| `/api/v1/usuarios` | GET/POST | Gestión de usuarios (ADMIN) |
| `/ws/pedidos` | WS | Actualizaciones en tiempo real |
| `/docs` | GET | Swagger UI |
| `/health` | GET | Health check |

---

## Configuración Inicial

### Variables de Entorno (`.env`)

```env
# Database
DATABASE_URL=postgresql://fastfood:fastfood@postgres:5432/fastfood_db

# JWT
SECRET_KEY=tu_clave_secreta_super_larga_aqui
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
ALLOWED_ORIGINS=["http://localhost:80", "http://localhost:5173"]

# App
DEBUG=False
LOG_LEVEL=INFO
```

### Notas

- Las tablas se crean automáticamente al iniciar el backend (SQLModel `create_all`)
- El seed se ejecuta automáticamente en el entrypoint de Docker
- Los pedidos siguen un FSM: `PENDIENTE → CONFIRMADO → EN_PREP → EN_CAMINO → ENTREGADO / CANCELADO`
- Los WebSockets (`/ws/pedidos`) notifican a todos los clientes conectados al cambiar un pedido; las páginas `AdminPedidos` y `MisPedidos` se actualizan en tiempo real sin recargar

---

**Última actualización:** Mayo 2026
