# Proposal: Agregar botón para activar registros desactivados

## What

Agregar funcionalidad para activar (recuperar) registros que fueron desactivados (soft deleted) en lugar de simplemente eliminarlos. Esto implica:

1. **Backend**: Crear endpoints POST `/{id}/activate` para:
   - Categorías (`POST /api/v1/categorias/{id}/activate`)
   - Productos (`POST /api/v1/productos/{id}/activate`)
   - Ingredientes (`POST /api/v1/ingredientes/{id}/activate`)

2. **Frontend**: Actualizar las páginas de CRUD para mostrar:
   - **Activar**: Si el registro está desactivado (`deleted_at` no es null)
   - **Editar**: Si el registro está activo (`deleted_at` es null)
   - El botón "Baja" solo aparece para registros activos

## Why

**Problema actual:**
- Cuando un registro se "elimina" (soft delete), desaparece de las listas filtradas por `deleted_at = null`
- No hay forma de recuperarlo desde el frontend
- El usuario no sabe si un registro fue desactivado o borrado definitivamente

**beneficios esperados:**
1. El admin puede activar/desactivar registros sin perder datos
2. Mejor UX: el usuario ve claramente qué está activo vs inactivo
3. Reversibilidad: los errores de "baja" se pueden corregir fácilmente
4. Visibilidad: se puede mostrar un badge "Inactivo" en la tabla

## Non-goals

- No se incluye gestión de usuarios (será otro change si se necesita)
- No se incluye historial de activación/desactivación

## Success criteria

- Endpoint `POST /activate` funciona en backend para los 3 módulos
- Frontend muestra "Activar" en registros inactivos
- Frontend muestra "Editar" solo en registros activos
- Frontend muestra "Baja" solo en registros activos
- Al activar, el registro reaparece en las listas