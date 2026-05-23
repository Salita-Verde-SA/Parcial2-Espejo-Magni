## Why

El sistema actual de cálculo de stock de productos tiene las siguientes deficiencias:

1. **Fórmula incorrecta**: El cálculo actual usa `min(stock_ingredientes)` sin considerar las cantidades necesarias de cada ingrediente para producir una unidad del producto. Por ejemplo, si un producto requiere 2 unidades de carne y tenemos 10 unidades de carne, solo podemos hacer 5 productos, no 10.

2. **Sin validación de stock al añadir ingredientes**: Cuando se crea o edita un producto y se añaden ingredientes, el sistema no valida si hay stock suficiente de esos ingredientes en el inventario.

3. **Lógica de "conjunto de ingredientes" no implementada**: No se está aplicando la lógica de que un conjunto de ingredientes (receta) forman una unidad de producto. Cada ingrediente tiene una cantidad específica necesaria para elaborar una unidad.

4. **Validación de stock insuficiente**: Si un ingrediente se queda sin stock (stock = 0), aunque todos los demás ingredientes tengan stock, el producto no debería contar como disponible. Actualmente el sistema no valida esto.

## What Changes

1. **Backend - Corregir fórmula de cálculo de stock**:
   - Modificar `calcular_stock_producto` en `productos/service.py`
   - Nueva fórmula: `stock_producto = min(floor(stock_ingrediente / cantidad_necesaria))`
   - El repositorio debe retornar la cantidad de cada ingrediente además del stock

2. **Backend - Agregar validación de stock al crear/editar producto**:
   - Antes de guardar un producto con ingredientes, validar que cada ingrediente tenga stock suficiente
   - Si un ingrediente no tiene stock suficiente, mostrar warning o error

3. **Backend - Validación de producto sin stock**:
   - Si algún ingrediente tiene stock = 0, el stock calculado del producto será 0
   - El campo `disponible` del producto debe ser `false` si el stock calculado es 0

4. **Frontend - Mostrar validación de stock al añadir ingredientes**:
   - En el `ProductoModal`, al seleccionar un ingrediente, verificar si hay stock disponible
   - Mostrar warning visual si el ingrediente no tiene stock suficiente

5. **Frontend - Indicador de stock insuficiente**:
   - En la lista de ingredientes del producto, marcar visualmente los ingredientes sin stock

## Capabilities

### New Capabilities

- `stock-calculation-con-cantidades`: Sistema de cálculo de stock de productos que considera las cantidades de cada ingrediente necesarias para elaborar una unidad. La fórmula es: stock_producto = min(floor(stock_ingrediente / cantidad_necesaria)).

- `validacion-stock-ingredientes`: Sistema de validación que verifica si hay stock suficiente de ingredientes antes de crear/editar un producto. Incluye validación de stock insuficiente que marca el producto como no disponible.

### Modified Capabilities

- `stock-calculation`: Se modifica para usar la fórmula correcta con cantidades y validar stock insuficiente.

## Impact

- **Backend**: Cambios en `app/modules/productos/service.py` (fórmula de cálculo), `app/modules/productos/repository.py` (obtener cantidad con stock), `app/modules/productos/model.py` (si es necesario)
- **Frontend**: Cambios en `frontend/src/components/ProductoModal.tsx` (validación visual), `frontend/src/types.ts` (si es necesario)
- **Database**: No requiere cambios
- **API**: El schema de respuesta de productos ya incluye stock calculado, se ajusta la lógica de cálculo