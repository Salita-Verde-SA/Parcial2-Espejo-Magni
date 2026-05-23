## Why

Actualmente, los productos tienen un campo `stock_cantidad` que se ingresa manualmente en el modal de creación/edición. Esto genera una inconsistencia lógica: un producto está compuesto por ingredientes, y su stock debería ser el resultado del stock mínimo disponible de sus ingredientes (el ingrediente limitante). Ingresar el stock manualmente genera:
- Datos inconsistentes (stock del producto no refleja realidad de ingredientes)
- Posibilidad de error humano
- Desincronización entre stock de producto y stock de ingredientes

## What Changes

1. **Backend**:
   - Eliminar campo `stock_cantidad` de `ProductoCreate` y `ProductoUpdate`
   - Crear función de cálculo de stock basada en ingredientes (stock mínimo de los ingredientes vinculados)
   - Modificar endpoint GET `/productos` para incluir `stock_cantidad` calculado dinámicamente
   - Modificar endpoint GET `/productos/{id}` para incluir `stock_cantidad` calculado

2. **Frontend**:
   - Eliminar campo "Stock" del `ProductoModal` (tanto en crear como en editar)
   - Mostrar stock calculado como texto de solo lectura en el modal después de seleccionar ingredientes
   - Actualizar la lista de productos para mostrar el stock calculado

3. **Modelo de datos**:
   - El campo `stock_cantidad` sigue existiendo en la tabla para compatibilidad con reads, pero NO se usa en input

## Capabilities

### New Capabilities

- `stock-calculation`: Sistema de cálculo automático de stock de productos basado en ingredientes. El stock de un producto es igual al stock mínimo de sus ingredientes (el ingrediente que tiene menos stock disponible).

### Modified Capabilities

- `productos-management`: Se modifica el requisito de gestión de productos para eliminar el input manual de stock y calcularlo automáticamente desde ingredientes.

## Impact

- **Backend**: Cambios en `app/modules/productos/model.py`, `app/modules/productos/router.py`, `app/modules/productos/service.py`
- **Frontend**: Cambios en `frontend/src/components/ProductoModal.tsx`, `frontend/src/api/productos.ts`
- **Database**: No requiere cambios (el campo ya existe, solo se ignora en input)
- **API**: El schema de respuesta de productos ahora incluye `stock_cantidad` calculado (no cambia el nombre del campo, solo su origen)