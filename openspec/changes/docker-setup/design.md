# Design: Dockerización del Proyecto

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     docker-compose.yml                      │
├─────────────┬─────────────┬─────────────┬───────────────────┤
│   frontend  │   backend   │  postgres  │     optional      │
│   (nginx)   │  (FastAPI)  │  (database)│   (adminer)       │
│   :80       │   :8000     │   :5432    │    :8080          │
└─────────────┴─────────────┴─────────────┴───────────────────┘
```

## Tech stack de containers

| Servicio | Imagen base | Puerto |
|----------|-------------|--------|
| frontend | nginx:alpine para servir build estático | 80 |
| backend | python:3.11-slim | 8000 |
| postgres | postgres:15-alpine | 5432 |
| adminer (opcional) | adminer | 8080 |

## Detalles de implementación

### 1. Dockerfile backend

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Notas técnicas:**
- Multistage build para reducir tamaño (opcional)
- Instalar solo producción dependencies
- Usar `--no-cache-dir` en pip para reducir imagen

### 2. Dockerfile frontend

```dockerfile
# Build stage
FROM node:20-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Serve stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Notas técnicas:**
- Multi-stage build: build en Node, serve en Nginx
- Configurar nginx para proxy de API al backend

### 3. docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: fastfood
      POSTGRES_PASSWORD: fastfood
      POSTGRES_DB: fastfood
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://fastfood:fastfood@postgres:5432/fastfood
      - SECRET_KEY=${SECRET_KEY}
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

## Variables de entorno

El backend requiere:
- `DATABASE_URL` — conexión a PostgreSQL
- `SECRET_KEY` — para JWT

Se deben definir en un archivo `.env` o pasar via docker-compose.

## Networking

- Todos los servicios en la red default de Docker
- Frontend comunica con backend via `http://backend:8000`
- Backend comunica con postgres via `postgres:5432`

## Persistencia

- PostgreSQL: volumen `postgres_data` para persistir datos
- Frontend: sin persistencia (build estático)
- Backend: sin persistencia (stateless)

## Health checks

- Backend: `GET /health`
- PostgreSQL: health check de Docker

## Puertos expuestos

| Servicio | Host | Container |
|----------|------|-----------|
| frontend | 80 | 80 |
| backend | 8000 | 8000 |
| postgres | 5432 | 5432 |
| adminer (opcional) | 8080 | 8080 |

## Desarrollo vs Producción

**Desarrollo:**
- Volumes montados para hot-reload (backend)
- Puertos expuestos para debugging
- Logs visibles en terminal

**Producción (futuro):**
- Build optimizado
- Variables de entorno en producción
- Nginx como reverse proxy