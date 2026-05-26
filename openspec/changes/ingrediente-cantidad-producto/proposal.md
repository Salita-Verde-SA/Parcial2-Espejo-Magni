## Why

Actualmente, la relación entre productos e ingredientes (`producto_ingrediente`) solo define si un ingrediente es removible (se puede quitar del producto) pero NO define la cantidad de cada ingrediente necesaria para elaborar el producto. Esto impide:

- Calcular correctamente el stock disponible de un producto (se necesita saber cuántos ingredientes se consumen por unidad)
- Gestionar recetas de elaboración con proporciones exactas
- Generar listas de compras precisas

Sin la cantidad, no es posible saber cuántas unidades de un producto pueden prepararse con el stock actual de ingredientes.

## What Changes

1. **Base de datos**:
   - Agregar campo `cantidad` a la tabla `producto_ingrediente` (nullable, default 1)
   - El campo será numérico (INTEGER o DECIMAL según necesidad)

2. **Backend**:
   - Modificar `ProductoIngrediente` model para incluir campo `cantidad`
   - Modificar `ProductoCreate` y `ProductoUpdate` para aceptar lista de objetos con `ingrediente_id` y `cantidad`
   - Actualizar API para permitir especificar cantidad al vincular ingrediente a producto

3. **Frontend**:
   - Modificar `ProductoModal` para que al seleccionar ingredientes se pueda especificar la cantidad
   - Mostrar la cantidad de cada ingrediente en la lista de ingredientes del producto

## Capabilities

### New Capabilities

- `ingrediente-cantidad-producto`: Capacidad de especificar la cantidad de cada ingrediente necesario para elaborar un producto. Esto permite calcular correctamente el stock disponible y gestionar recetas.

### Modified Capabilities

- `stock-calculation`: Se modifica el cálculo de stock para considerar la cantidad de cada ingrediente. Si un producto necesita 2 unidades de un ingrediente y hay 10 unidades en stock, solo pueden prepararse 5 productos (no 10).

## Impact

- **Database**: Agregar columna `cantidad` a tabla `producto_ingrediente`
- **Backend**: Cambios en `app/modules/productos/model.py` (ProductoIngrediente, schemas)
- **Frontend**: Cambios en `frontend/src/components/ProductoModal.tsx`
- **API**: El formato de `ingrediente_ids` cambia de `list[int]` a `list[object {ingrediente_id, cantidad}]`