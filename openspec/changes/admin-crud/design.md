# Design: Completar CRUD de Productos y Categorías

## Architecture

### Archivos a crear

```
frontend/src/
├── pages/
│   ├── ProductosPage.tsx     (NEW - CRUD productos)
│   └── CategoriasPage.tsx    (NEW - CRUD categorías)
├── components/
│   ├── ProductoModal.tsx     (NEW - modal crear/editar producto)
│   └── CategoriaModal.tsx    (NEW - modal crear/editar categoría)
```

### Archivos a modificar

```
frontend/src/
├── App.tsx                   (agregar rutas /productos, /categorias)
└── components/Layout.tsx     (agregar nav links)
```

## UI/UX

### Patrón existente (seguir exactamtente)

El diseño debe ser idéntico a `IngredientesPage`:
- Topbar con título
- Card con CardHeader (título + botones acción)
- FiltrosBar con selects e inputs
- Tabla con datos
- Paginación
- Modal para create/edit
- ConfirmDialog para delete

### ProductosPage

**Columnas de la tabla:**
- ID
- Nombre
- Descripción (truncada)
- Precio (formateado como moneda)
- Stock (número)
- Disponible (badge verde/rojo)
- Categorías (tags)
- Alta (fecha)
- Acciones (Editar, Baja)

**Filtros:**
- Nombre (text input)
- Categoría (select con todas las categorías)
- Disponible (select: Todos/Sí/No)

**Botones de acción:**
- Exportar Excel (solo ADMIN)
- Nuevo producto (solo ADMIN)

### CategoriasPage

**Columnas de la tabla:**
- ID
- Nombre
- Descripción
- Padre (nombre de categoría padre o "—")
- Alta (fecha)
- Acciones (Editar, Baja)

**Filtros:**
- Nombre (text input)

**Botones de acción:**
- Nueva categoría (solo ADMIN)

### ProductoModal

**Campos del formulario:**
- Nombre (required)
- Descripción (textarea)
- Precio base (number, required)
- Stock cantidad (number, required)
- Disponible (checkbox)
- Imagen URL (text input, optional)
- Categorías (multi-select)
- Ingredientes (multi-select con checkboxes)

### CategoriaModal

**Campos del formulario:**
- Nombre (required)
- Descripción (textarea, optional)
- Categoría padre (select, optional)

## Routing

```tsx
// App.tsx
<Route path="productos" element={
  <RequireRole role="ADMIN"><ProductosPage /></RequireRole>
} />
<Route path="categorias" element={
  <RequireRole role="ADMIN"><CategoriasPage /></RequireRole>
} />
```

## Estado de implementación

### Frontend existente (listo para usar)
- `api/productos.ts` - funciones CRUD + export
- `api/categorias.ts` - funciones CRUD
- `types.ts` - interfaces completas
- `IngredientesPage.tsx` - patrón a seguir
- `IngredienteModal.tsx` - plantilla para modales
- `ConfirmDialog.tsx` - componente existente

### Backend existente (endpoints ready)
- `GET /api/v1/productos/` - listar con filtros
- `POST /api/v1/productos/` - crear
- `PUT /api/v1/productos/{id}` - actualizar
- `DELETE /api/v1/productos/{id}` - baja lógica
- `GET /api/v1/productos/export` - excel

- `GET /api/v1/categorias/` - listar
- `POST /api/v1/categorias/` - crear
- `PUT /api/v1/categorias/{id}` - actualizar
- `DELETE /api/v1/categorias/{id}` - baja lógica