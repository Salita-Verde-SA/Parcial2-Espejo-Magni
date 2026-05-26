# Tasks: Completar CRUD de Productos y Categorías

## Implementation checklist

### Fase 1: Rutas y Menú

- [ ] 1.1 Actualizar `App.tsx` - agregar rutas `/productos` y `/categorias` con RequireRole ADMIN
- [ ] 1.2 Actualizar `Layout.tsx` - agregar nav links a Productos y Categorías (solo ADMIN)

### Fase 2: Página de Productos

- [ ] 2.1 Crear `pages/ProductosPage.tsx` siguiendo el patrón de IngredientesPage
- [ ] 2.2 Implementar filtros: nombre, categoria_id, disponible
- [ ] 2.3 Implementar tabla con todas las columnas
- [ ] 2.4 Implementar paginación
- [ ] 2.5 Agregar botón Exportar Excel
- [ ] 2.6 Agregar botón Nuevo producto (solo ADMIN)
- [ ] 2.7 Agregar acciones Editar y Baja (solo ADMIN)

### Fase 3: Modal de Producto

- [ ] 3.1 Crear `components/ProductoModal.tsx`
- [ ] 3.2 Formulario con campos: nombre, descripcion, precio_base, stock, disponible, imagen_url
- [ ] 3.3 Select multi-select para categorías (traer de API)
- [ ] 3.4 Select multi-select para ingredientes (traer de API)
- [ ] 3.5 Integrar con createProducto y updateProducto

### Fase 4: Página de Categorías

- [ ] 4.1 Crear `pages/CategoriasPage.tsx` siguiendo el patrón de IngredientesPage
- [ ] 4.2 Implementar filtros: nombre
- [ ] 4.3 Implementar tabla con columnas: ID, nombre, descripción, padre, alta, acciones
- [ ] 4.4 Implementar paginación
- [ ] 4.5 Agregar botón Nueva categoría (solo ADMIN)
- [ ] 4.6 Agregar acciones Editar y Baja (solo ADMIN)

### Fase 5: Modal de Categoría

- [ ] 5.1 Crear `components/CategoriaModal.tsx`
- [ ] 5.2 Formulario con campos: nombre, descripcion, parent_id
- [ ] 5.3 Select para categoría padre (traer categorías para select)
- [ ] 5.4 Integrar con createCategoria y updateCategoria

### Fase 6: Testing

- [ ] 6.1 Verificar que /productos funciona con filtros
- [ ] 6.2 Verificar que /categorias funciona con filtros
- [ ] 6.3 Verificar que crear producto funciona
- [ ] 6.4 Verificar que editar producto funciona
- [ ] 6.5 Verificar que eliminar producto funciona
- [ ] 6.6 Verificar que crear categoría funciona
- [ ] 6.7 Verificar que las rutas son solo para ADMIN

## Notes

- Seguir exactamente el patrón de IngredientesPage.tsx para consistencia
- Usar las funciones API ya existentes en api/productos.ts y api/categorias.ts
- Los tipos ya están definidos en types.ts
- El backend ya tiene todos los endpoints ready