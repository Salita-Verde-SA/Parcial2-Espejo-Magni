# FastFood - Plataforma de Pedidos

> 📁 **Documentación adicional** en `/docs/pdf/` — archivos complementarios del proyecto.

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
5. [Endpoints Principales](#endpoints-principales)
6. [Configuración Inicial](#configuración-inicial)

---

## Stack Tecnológico

**Backend:**
- FastAPI 0.115.6
- SQLModel + PostgreSQL
- JWT para autenticación
- Pytest para testing

**Frontend:**
- React 18 + TypeScript
- Vite (bundler)
- TanStack Query (state management)
- Tailwind CSS

**Infraestructura:**
- Docker & Docker Compose
- Nginx (frontend)
- PostgreSQL 15

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
│   │   │   └── deps.py               # Dependencias
│   │   ├── modules/                  # Módulos por dominio
│   │   │   ├── admin/                # Operaciones admin
│   │   │   ├── auth/                 # Autenticación
│   │   │   ├── categorias/           # Gestión de categorías
│   │   │   ├── ingredientes/         # Gestión de ingredientes
│   │   │   ├── pedidos/              # Gestión de pedidos
│   │   │   ├── productos/            # Gestión de productos
│   │   │   ├── roles/                # Roles de usuario
│   │   │   ├── unidades/             # Unidades de medida
│   │   │   └── usuarios/             # Gestión de usuarios
│   │   ├── db/                       # Migraciones y seeds
│   │   │   ├── migrations/
│   │   │   └── seed.py
│   │   └── main.py                   # Punto de entrada
│   ├── requirements.txt              # Dependencias Python
│   ├── Dockerfile
│   └── docker-entrypoint.sh
├── frontend/                         # Aplicación React
│   ├── src/
│   │   ├── api/                      # Clientes HTTP por dominio
│   │   ├── components/               # Componentes reutilizables
│   │   ├── hooks/                    # Custom hooks (WebSockets, etc)
│   │   ├── pages/                    # Páginas/rutas
│   │   ├── stores/                   # Zustand stores (estado global)
│   │   ├── types/                    # Tipos TypeScript
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── Dockerfile
│   └── nginx.conf
├── docs/                             # Documentación
│   └── pdf/                          # PDFs del proyecto
├── docker-compose.yml                # Orquestación de contenedores
└── .env.example                      # Variables de entorno (template)
```

---

## Ejecución con Docker

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop) instalado
- **Windows**: Asegúrate que WSL 2 está habilitado
- **Linux**: Solo ejecuta `docker` y `docker-compose` normalmente

### Pasos (Windows y Linux igual)

1. **Clonar/abrir el proyecto:**
   ```bash
   cd Parcial2-Espejo-Magni
   ```

2. **Crear archivo `.env`** (si no existe):
   ```bash
   cp .env.example .env
   # Edita .env con tus valores si es necesario
   ```

3. **Levantar servicios:**
   ```bash
   docker-compose up -d
   ```
   - PostgreSQL: `localhost:5432`
   - Backend API: `http://localhost:8000`
   - Frontend: `http://localhost:3000` (o el puerto configurado)
   - Docs Swagger: `http://localhost:8000/docs`

4. **Ver logs:**
   ```bash
   docker-compose logs -f backend
   docker-compose logs -f frontend
   ```

5. **Detener:**
   ```bash
   docker-compose down
   ```

---

## Ejecución sin Docker

### Prerequisites

**Windows:**
- [Python 3.11+](https://www.python.org/downloads/) (marca "Add Python to PATH")
- [Node.js 18+](https://nodejs.org/)
- [PostgreSQL 15](https://www.postgresql.org/download/windows/) (o instala Docker solo para la BD)

**Linux:**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install python3 python3-venv python3-pip nodejs postgresql postgresql-contrib
```

### Backend (FastAPI)

**Windows:**
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Linux:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API disponible en: `http://localhost:8000`
- Docs: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Frontend (React + Vite)

**Windows:**
```bash
cd frontend
npm install
npm run dev
```

**Linux:**
```bash
cd frontend
npm install
npm run dev
```

App disponible en: `http://localhost:5173` (o el puerto que Vite asigne)

### Configuración de BD (si no usas Docker)

1. Crea una base de datos PostgreSQL
2. Define variables en `.env`:
   ```env
   DATABASE_URL=postgresql://usuario:password@localhost:5432/fastfood
   ```
3. Las migraciones se ejecutan automáticamente al iniciar el backend

---

## Endpoints Principales

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/auth/login` | POST | Autenticarse |
| `/auth/register` | POST | Registrarse |
| `/categorias` | GET/POST | Listar/crear categorías |
| `/productos` | GET/POST | Listar/crear productos |
| `/ingredientes` | GET/POST | Listar/crear ingredientes |
| `/pedidos` | GET/POST | Listar/crear pedidos |
| `/usuarios` | GET/POST | Gestión de usuarios (admin) |
| `/docs` | GET | Swagger UI |

---

## Configuración Inicial

### Variables de Entorno (`.env`)

```env
# Database
DATABASE_URL=postgresql://fastfood:password@postgres:5432/fastfood

# JWT
SECRET_KEY=tu_clave_secreta_super_larga_aqui
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
ALLOWED_ORIGINS=["http://localhost:3000", "http://localhost:5173"]

# App
DEBUG=False
LOG_LEVEL=INFO
```

### Primera Ejecución

- Las tablas se crean automáticamente con SQLModel
- El archivo `backend/app/db/seed.py` puede usarse para datos iniciales
- El admin puede acceder a endpoints protegidos tras autenticarse

---

## Tips

- **Rebuild imágenes:** `docker-compose build --no-cache`
- **Limpiar volúmenes:** `docker-compose down -v`
- **Tests backend:** `pytest backend/` (sin Docker) o `docker-compose exec backend pytest`
- **Hot reload:** Ambas aplicaciones tienen reload automático en desarrollo

---

**Última actualización:** Mayo 2026
