# Proposal: Dockerización del Proyecto

## What

Crear la infraestructura de contenedores Docker para el proyecto completo:
- Dockerfile para el backend (FastAPI)
- Dockerfile para el frontend (React/Vite)
- Docker Compose orchestrando: backend + frontend + PostgreSQL

## Why

**Problema actual:** El proyecto no tiene configuración para correr en contenedores, lo que dificulta:
- Despliegue en producción
- Configuración de ambiente de desarrollo homogenio
- Escalabilidad del sistema

**beneficios esperados:**
1. **Consistencia**: Mismo ambiente en desarrollo y producción
2. **Portabilidad**: Ejecutar el proyecto con un solo comando
3. **Aislamiento**: Backend, frontend y DB operan en contenedores separados
4. **Facilidad de despliegue**: Compatible con cualquier orchestrador (Swarm, K8s)

## Non-goals

- No incluye configuración de producción (nginx, SSL, etc.)
- No incluye CI/CD pipelines
- No incluye servicios adicionales como Redis o monitoring

## Success criteria

- `docker-compose up` levanta todos los servicios correctamente
- El frontend puede comunicarse con el backend via API
- La base de datos PostgreSQL inicializa correctamente
- Los logs de cada servicio son accesibles