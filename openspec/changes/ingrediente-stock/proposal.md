## Why

Actualmente los ingredientes (insumos) no tienen un campo de stock para controlar cuántas unidades disponibles existen. Esto genera:
- Imposibilidad de saber qué ingredientes están agotados
- No se puede calcular el stock de los productos derivados
- No hay forma de validar si alcanzan las cantidades requeridas

## What Changes

1. **Base de datos**:
   - Agregar campo `stock_cantidad` a la tabla `ingrediente` (INTEGER, default 0)

2. **Backend**:
   - Modificar modelo `Ingrediente` para incluir `stock_cantidad`
   - Modificar `IngredienteCreate` y `IngredienteUpdate` para permitir setear stock
   - Modificar `IngredientePublic` para incluir stock en respuestas

3. **Frontend**:
   - Modificar `IngredienteModal` para incluir campo de stock al crear/editar
   - Modificar `IngredientesPage` para mostrar el stock en la tabla

## Capabilities

### New Capabilities

- `ingrediente-stock`: Capacidad de gestionar el stock de cada ingrediente, permitiendo conocer la disponibilidad y calcular el stock de productos derivados.

## Impact

- **Database**: Nueva columna `stock_cantidad` en tabla `ingrediente`
- **Backend**: Cambios en `app/modules/ingredientes/model.py`, `service.py`, `router.py`
- **Frontend**: Cambios en `frontend/src/components/IngredienteModal.tsx`, `frontend/src/pages/IngredientesPage.tsx`
- **API**: Schema de ingrediente ahora incluye `stock_cantidad`