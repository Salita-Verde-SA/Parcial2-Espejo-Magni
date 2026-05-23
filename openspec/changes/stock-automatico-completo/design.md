## Context

El sistema actual de cálculo de stock de productos tiene la siguiente estructura:

1. **Modelo de datos**:
   - `Producto` tiene relación muchos-a-muchos con `Ingrediente` via `ProductoIngrediente`
   - `ProductoIngrediente` tiene campos: `producto_id`, `ingrediente_id`, `cantidad`, `unidad_medida_id`, `es_removible`
   - `Ingrediente` tiene campo `stock_cantidad` (stock disponible del ingrediente)

2. **Cálculo actual de stock**:
   - Función `calcular_stock_producto` en `productos/service.py`
   - Obtiene los stocks de ingredientes via `get_ingrediente_stocks`
   - Calcula: `min(stock_ingredientes)` - NO considera cantidades

3. **Frontend**:
   - `ProductoModal` permite especificar cantidad por ingrediente
   - No hay validación visual de stock insuficiente

## Goals / Non-Goals

**Goals:**
- Corregir la fórmula de cálculo para usar cantidades
- Agregar validación de stock al crear/editar productos
- Mostrar indicadores visuales de stock insuficiente en frontend
- Auto-actualizar disponibilidad del producto según stock calculado

**Non-Goals:**
- No modificar el sistema de pedidos (descontar stock al vender)
- No implementar alertas de stock bajo
- No modificar la tabla de ingredientes

## Decisions

### 1. Fórmula de cálculo de stock

**Decisión**: `stock_producto = min(floor(stock_ingrediente / cantidad_necesaria))`

**Alternativas consideradas:**
- `min(stock_ingredientes)`: ❌ No considera cantidades
- `sum(floor(stock_ingrediente / cantidad))`: ❌ No refleja cuántas unidades se pueden hacer
- `min(floor(stock / cantidad))`: ✅ Correcto - limita por el ingrediente más escaso

**Justificación**: Si un producto requiere 2 unidades de carne y tenemos 10, podemos hacer 5 productos. Si requiere 1 pan y tenemos 10 panes, podemos hacer 10 productos. El limitante es el menor: 5 productos.

**Ejemplo**:
```
Producto "Hamburguesa":
- Carne: stock=10, cantidad_para_producto=2 → floor(10/2) = 5
- Pan: stock=10, cantidad_para_producto=1 → floor(10/1) = 10
- Queso: stock=5, cantidad_para_producto=1 → floor(5/1) = 5

Stock máximo = min(5, 10, 5) = 5 productos
```

### 2. Obtener datos para el cálculo

**Decisión**: Modificar `get_ingrediente_stocks` para retornar tuplas `(ingrediente_id, stock_cantidad, cantidad_necesaria)`

**Alternativas consideradas:**
- Llamar a `get_ingredientes` y luego obtener stocks por separado: ❌ Dos queries
- Modificar `get_ingrediente_stocks` para incluir cantidad: ✅ Una sola query optimizada

### 3. Validación de stock al crear/editar producto

**Decisión**: Validar en el backend y mostrar warning en frontend

**Backend**:
- En `create_producto` y `update_producto`, validar que cada ingrediente tenga stock >= cantidad_necesaria
- Si no hay stock suficiente, devolver error 400 con detalle

**Frontend**:
- Al añadir ingrediente, mostrar warning visual si stock_insumo < cantidad_necesaria
- En la lista de ingredientes, marcar con color rojo los que no tienen stock

### 4. Disponibilidad automática del producto

**Decisión**: Si el stock calculado es 0, forzar `disponible = false`

**Justificación**: Un producto sin stock no debería estar disponible para venta, aunque el usuario puede forzar manualmente. Pero el cálculo automático debe reflejarse.

**Alternativas consideradas:**
- Mantener `disponible` como el usuario lo setee: ❌ Desincronizado
- Forzar `disponible = false` si stock = 0: ✅ Consistente

### 5. Stock insuficiente (ingrediente con stock = 0)

**Decisión**: Si cualquier ingrediente tiene stock = 0, el stock del producto es 0

**Justificación**: No se puede elaborar ni una sola unidad si falta un ingrediente.

**Caso especial**:
- Ingrediente con stock null → tratarlo como 0
- Ingrediente con stock negativo → tratarlo como 0

## Risks / Trade-offs

- **[Riesgo]** Productos existentes con cantidades no actualizadas
  - **Mitigación**: Si `cantidad` es null, usar default = 1 (ya implementado)

- **[Riesgo]** Performance al calcular stock con muchos ingredientes
  - **Mitigación**: El cálculo es simple (división y min), pero se puede cachear si es necesario

- **[Trade-off]** Validación en backend puede rechazar creaciones que antes funcionaban
  - **Justificación**: Es mejor validar para evitar datos inconsistentes

## Migration Plan

1. **Backend**:
   - Modificar `get_ingrediente_stocks` para retornar cantidad
   - Modificar `calcular_stock_producto` para usar la fórmula correcta
   - Agregar validación de stock en `create_producto` y `update_producto`
   - Ajustar `disponible` si stock = 0

2. **Frontend**:
   - En `ProductoModal`, agregar validación visual al añadir ingrediente
   - Marcar ingredientes sin stock en rojo

3. **Verificación**:
   - Probar cálculo con diferentes cantidades
   - Probar producto con ingrediente sin stock → stock = 0
   - Probar validación al crear producto con ingrediente sin stock