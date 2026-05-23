# Proposal: Completar CRUD de Productos y Categorías en Panel Admin

## What

Crear las páginas de administración para Productos y Categorías en el frontend, siguiendo el mismo patrón existente en `IngredientesPage`:

- **ProductosPage**: CRUD completo con filtros, paginación, modal de edición, exportación Excel
- **CategoriasPage**: CRUD completo con filtros, paginación, modal de edición
- **ProductoModal**: Formulario para crear/editar productos con selección de categorías e ingredientes
- **CategoriaModal**: Formulario para crear/editar categorías
- Actualizar rutas y menú de navegación

## Why

**Problema actual:**
- El backend ya tiene todos los endpoints para CRUD de productos y categorías
- El frontend ya tiene las funciones API (`api/productos.ts`, `api/categorias.ts`)
- Pero NO hay páginas de administración para gestionar estos recursos desde el panel de ADMIN
- Solo existe `IngredientesPage` como ejemplo de CRUD en el admin

**beneficios esperados:**
1. El admin puede crear/editar/eliminar productos directamente
2. El admin puede crear/editar/eliminar categorías
3. Sistema consistente: mismo diseño y UX que Insumos
4.复用 del código existente (patrón, componentes, estilos)

## Non-goals

- No se implementa gestión de pedidos (será otro change)
- No se implementa dashboard de estadísticas
- No se implementa gestión de usuarios (por ahora)

## Success criteria

- `/productos` visible solo para ADMIN, con CRUD completo
- `/categorias` visible solo para ADMIN, con CRUD completo
- Los modales funcionan para crear y editar
- Los filtros y paginación funcionan correctamente
- El diseño es consistente con `IngredientesPage`