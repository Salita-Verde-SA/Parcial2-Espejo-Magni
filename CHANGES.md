# CHANGES — Parcial 2 (pendientes)

## BACKEND ✅ COMPLETO

### 1. `PATCH /api/v1/direcciones/{id}/principal` — YA IMPLEMENTADO
- Endpoint en `pedidos/router.py:77-84`, service en `pedidos/service.py:168-180`.

### 2. Usuarios admin — YA IMPLEMENTADO en `modules/admin/`
- `GET /api/v1/admin/usuarios?rol_codigo=X&page=1&page_size=10` con paginación y filtro por rol.
- `DELETE /api/v1/admin/usuarios/{id}` soft delete.
- `PUT /api/v1/admin/usuarios/{id}` actualización por admin.
- `POST/DELETE /api/v1/admin/usuarios/{id}/roles/{rol}` asignación de roles.
- Todo en `modules/admin/router.py` + `modules/admin/service.py`.

---

## FRONTEND

### 3. Segundo proyecto frontend (Módulo Store separado)
- El PDF dice: "Frontend 2 proyectos consumen un backend".
- Actualmente hay UN solo frontend con todo mezclado.
- Debe existir un segundo proyecto React independiente (ej. `frontend-store/`) con:
  - Home / Catálogo de productos
  - Carrito (Zustand + persist middleware → localStorage)
  - Pantalla de pedidos del cliente (`/mis-pedidos`)
  - Realizar pedido / Checkout (sin pasarela de pago)
  - Instancia de axios propia
  - Axios interceptor propio
  - Rutas propias (react-router-dom)
  - TanStack Query: `useQuery` para listado, `useMutation` para crear pedido

### 4. Módulo Administración — frontend actual debe quedar como proyecto separado
- El frontend actual (`frontend/`) pasa a ser el Módulo Administración.
- Debe tener explícitamente:
  - Inicio de sesión con token en cookie httpOnly (ya funciona)
  - Protección de rutas por autenticación Y por rol (ya funciona)
  - Pantalla cajero/empleado: cambiar estados del pedido (ya funciona en `AdminPedidosPage`)
  - **Modo Admin** puede crear/editar/eliminar — **Modo Empleado** (PEDIDOS/STOCK) solo puede ver
    - Actualmente la UI no oculta/deshabilita botones según rol en las pantallas de Categorías, Ingredientes y Productos. Hay que agregar lógica de rol en esas páginas.

---

## CHECKLIST RÁPIDO

- [x] `PATCH /api/v1/direcciones/{id}/principal` en backend — YA IMPLEMENTADO
- [x] `GET /api/v1/admin/usuarios?rol_codigo=X&page=1` paginado — YA IMPLEMENTADO
- [x] `DELETE /api/v1/admin/usuarios/{id}` soft delete — YA IMPLEMENTADO
- [x] Crear segundo proyecto `frontend-store/` (Módulo Store) — IMPLEMENTADO en `frontend-store/`
- [x] En Módulo Admin: deshabilitar acciones de CRUD para roles que no son ADMIN — IMPLEMENTADO
