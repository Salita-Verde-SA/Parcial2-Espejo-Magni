## Why

El sistema de catálogos actual trabaja con stocks expresados en enteros sin unidad de medida definida. Esto genera ambigüedad:

- `stock_cantidad: 100` → ¿100 qué? ¿gramos? ¿kilos? ¿porciones? ¿unidades?
- `precio_base: 12.50` → ¿por qué unidad?

Esta ambigüedad impide:
- Mostrar precios con su unidad: `"S/. 12.50 / kg"`
- Validar compatibilidad de unidades entre ingredientes y productos
- Realizar conversiones entre unidades compatibles (futuro)
- Mantener coherencia en la visualización del catálogo

Además, en la tabla `producto_ingrediente` el campo `cantidad` es INTEGER sin unidad, lo que significa que no hay forma de expresar recetas como "200g de carne + 50g de queso".

## What Changes

1. **Nueva tabla `UnidadMedida`**:
   - Catálogo de unidades con nombre, símbolo y tipo (masa, volumen, unidad, área)
   - Seed inicial con unidades comunes (kg, g, L, mL, u, doc)
   - Relación con `Producto.unidad_venta_id` y `ProductoIngrediente.unidad_medida_id`

2. **Modificación de `Producto`**:
   - Agregar `unidad_venta_id` (FK nullable a `UnidadMedida`)
   - `precio_base` muestra unidad asociada: `"S/. 12.50 / kg"` o `"S/. 3.00"` (sin unidad = por pieza)

3. **Modificación de `ProductoIngrediente`**:
   - Cambiar `cantidad` de INTEGER a DECIMAL(10,3)
   - Agregar `unidad_medida_id` (FK a `UnidadMedida`, NOT NULL)

4. **Frontend**:
   - Mostrar símbolo de unidad en ProductCard y ProductoDetail
   - Selector de unidad al crear/editar productos e ingredientes de receta
   - Badge de alérgenos con ícono de advertencia

## Capabilities

### New Capabilities

- `unidad-medida-catalogo`: Sistema de gestión de unidades de medida con tipos (masa, volumen, unidad, área). Permite asignar unidades a productos e ingredientes de recetas.

### Modified Capabilities

- `catalogo-productos`: Se modifica para incluir unidad de venta en productos, permitiendo mostrar precios con su unidad (ej: `"S/. 12.50 / kg"`).

## Impact

- **Database**: Nueva tabla `unidad_medida`, nuevos campos en `producto` y `producto_ingrediente`
- **Backend**: Nuevo módulo `unidades` con CRUD, cambios en módulos `productos` e `ingredientes`
- **Frontend**: Actualización de ProductCard, ProductoModal, ProductoDetail
- **Seed**: Actualizar `app/db/seed.py` con unidades iniciales