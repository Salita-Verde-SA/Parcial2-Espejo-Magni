# Tasks: Agregar botón para activar registros

## Implementation checklist

### Fase 1: Backend - Categorías

- [ ] 1.1 Agregar método `activate()` en `categorias/repository.py`
- [ ] 1.2 Agregar función `activate_categoria()` en `categorias/service.py`
- [ ] 1.3 Agregar endpoint `POST /{id}/activate` en `categorias/router.py`

### Fase 2: Backend - Productos

- [ ] 2.1 Agregar método `activate()` en `productos/repository.py`
- [ ] 2.2 Agregar función `activate_producto()` en `productos/service.py`
- [ ] 2.3 Agregar endpoint `POST /{id}/activate` en `productos/router.py`

### Fase 3: Backend - Ingredientes

- [ ] 3.1 Agregar método `activate()` en `ingredientes/repository.py`
- [ ] 3.2 Agregar función `activate_ingrediente()` en `ingredientes/service.py`
- [ ] 3.3 Agregar endpoint `POST /{id}/activate` en `ingredientes/router.py`

### Fase 4: Frontend - API

- [ ] 4.1 Agregar `activateCategoria()` en `api/categorias.ts`
- [ ] 4.2 Agregar `activateProducto()` en `api/productos.ts`
- [ ] 4.3 Agregar `activateIngrediente()` en `api/ingredientes.ts`

### Fase 5: Frontend - Tipos

- [ ] 5.1 Verificar que los tipos incluyan `deleted_at` en types.ts
- [ ] 5.2 Agregar campo `deleted_at` a los tipos si no existe

### Fase 6: Frontend - Pages

- [ ] 6.1 Actualizar `ProductosPage.tsx` - mostrar Activar/Editar/Baja según estado
- [ ] 6.2 Actualizar `CategoriasPage.tsx` - mostrar Activar/Editar/Baja según estado
- [ ] 6.3 Actualizar `IngredientesPage.tsx` - mostrar Activar/Editar/Baja según estado
- [ ] 6.4 Agregar badges de "Activo" / "Inactivo" en las tablas

### Fase 7: Testing

- [ ] 7.1 Probar activar una categoría
- [ ] 7.2 Probar activar un producto
- [ ] 7.3 Probar activar un ingrediente
- [ ] 7.4 Verificar que los botones cambian según el estado

## Notes

- El get_by_id debe poder buscar registros eliminados para poder activarlos
- Se necesita un método `get_by_id_with_deleted` o similar en cada repository
- El frontend necesita mostrar todos los registros (incluidos los eliminados) o al menos poder ver cuáles están eliminados