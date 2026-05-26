# Tasks: Dockerización del Proyecto

## Implementation checklist

### Fase 1: Preparación

- [ ] 1.1 Crear `.dockerignore` en backend (ignorar __pycache__, .venv, etc.)
- [ ] 1.2 Crear `.dockerignore` en frontend (ignorar node_modules, dist, etc.)
- [ ] 1.3 Crear archivo `.env.example` con las variables requeridas

### Fase 2: Backend

- [ ] 2.1 Crear `backend/Dockerfile`
- [ ] 2.2 Actualizar `backend/app/core/config.py` para leer DATABASE_URL de env
- [ ] 2.3 Verificar que el backend corre dentro del container

### Fase 3: Frontend

- [ ] 3.1 Crear `frontend/Dockerfile` (multi-stage build)
- [ ] 3.2 Crear `frontend/nginx.conf` para configurar proxy a backend
- [ ] 3.3 Actualizar URLs de API en frontend para ambiente Docker
- [ ] 3.4 Verificar que el frontend serves correctamente

### Fase 4: Docker Compose

- [ ] 4.1 Crear `docker-compose.yml` en raíz del proyecto
- [ ] 4.2 Configurar servicios: postgres, backend, frontend
- [ ] 4.3 Configurar red entre servicios
- [ ] 4.4 Agregar volumen para persistencia de PostgreSQL

### Fase 5: Validación

- [ ] 5.1 Ejecutar `docker-compose up --build`
- [ ] 5.2 Verificar que frontend accesible en http://localhost
- [ ] 5.3 Verificar que backend responde en http://localhost:8000/health
- [ ] 5.4 Verificar que la DB tiene las tablas creadas
- [ ] 5.5 Verificar que el login funciona correctamente

### Fase 6: Extras (opcional)

- [ ] 6.1 Agregar Adminer para gestión visual de la DB
- [ ] 6.2 Agregar healthchecks en docker-compose
- [ ] 6.3 Crear script `start-dev.sh` para desarrollo

## Notes

- El orden de implementación es importante: backend → frontend → compose
- Para desarrollo local, considerar volúmenes montados para hot-reload
- Las credenciales de la DB en el ejemplo son de desarrollo; cambiar para producción