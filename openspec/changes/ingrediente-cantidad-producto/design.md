## Context

Actualmente, la tabla `producto_ingrediente` tiene la siguiente estructura:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| producto_id | FK | ID del producto |
| ingrediente_id | FK | ID del ingrediente |
| es_removible | BOOLEAN | Si el ingrediente puede quitarse |
| created_at | DATETIME | Fecha de creación |

Falta el campo `cantidad` que indique cuánto de cada ingrediente se necesita por unidad de producto.

## Goals / Non-Goals

**Goals:**
- Agregar campo `cantidad` a la relación producto-ingrediente
- Permitir especificar cantidad al crear/editar productos en el frontend
- Actualizar el cálculo de stock para considerar las cantidades
- Mantener compatibilidad hacia atrás (ingredientes existentes tendrá cantidad = 1 por defecto)

**Non-Goals:**
- No se implementa unidad de medida (kg, gr, lt, unidades) - será cantidad en unidades simples
- No se implementa conversión entre unidades
- No se modifican otros módulos que usen esta relación

## Decisions

### 1. Tipo de dato para cantidad

**Decisión**: Usar `INTEGER` con valor mínimo de 1, default 1

**Alternativas consideradas:**
- DECIMAL: ❌ Complica innecesariamente, las recetas suelen ser en unidades enteras
- FLOAT: ❌ Problemas de precisión para cálculos
- INTEGER: ✅ Suficiente para la mayoría de recetas, fácil de validar

**Justificación**: La mayoría de las recetas de comida rápida usan cantidades enteras (2 panes, 1 carne, 3 porciones de queso). Si en el futuro se necesita precisión decimal, se puede migrar.

### 2. Nombre del campo en schema

**Decisión**: El campo se llamará `cantidad` en la tabla y `cantidad` en los schemas

**Alternativas consideradas:**
- `quantity`: ❌ Inconsistente con el resto del código (español)
- `cantidad`: ✅ Consistente con el idioma del proyecto

### 3. Estructura de datos para enviar ingredientes

**Decisión**: Cambiar de `ingrediente_ids: list[int]` a `ingredientes: list[IngredienteCantidad]`

```python
class IngredienteCantidad(SQLModel):
    ingrediente_id: int
    cantidad: int = 1
    es_removible: bool = False
```

**Alternativas consideradas:**
- Mantener `ingrediente_ids` y agregar `ingrediente_cantidades: dict`: ❌ Más complejo de manejar
- Agregar paralelo `ingrediente_cantidades`: ❌ Duplicación de datos
- Nuevo formato con objetos: ✅ Más limpio y extensible

### 4. Compatibilidad hacia atrás

**Decisión**: Si no se envía cantidad, usar default 1

**Justificación**: Los productos existentes no tienen cantidad definida. Al consultarlos, asumimos cantidad = 1 para mantener el comportamiento actual.

## Risks / Trade-offs

- **[Riesgo]** Productos existentes no tienen cantidad definida
  - **Mitigación**: En el backend, al calcular stock, tratar cantidad = 1 si no está definida

- **[Riesgo]** Cambio en formato de API de ingredientes
  - **Mitigación**: El frontend debe actualizarse junto con el backend.新旧 clientes pueden comportarse diferente

- **[Trade-off]** Agregar migración de base de datos
  - **Justificación**: Se necesita ALTER TABLE para agregar la columna con default

## Migration Plan

1. **Database**:
   - Ejecutar: `ALTER TABLE producto_ingrediente ADD COLUMN cantidad INTEGER NOT NULL DEFAULT 1;`

2. **Backend**:
   - Modificar modelo `ProductoIngrediente` para agregar campo cantidad
   - Modificar schemas para aceptar nuevo formato de ingredientes
   - Actualizar service para manejar ambos formatos (con y sin cantidad)

3. **Frontend**:
   - Actualizar `ProductoModal` para pedir cantidad al seleccionar ingrediente
   - Actualizar tipos de TypeScript

4. **Verificación**:
   - Probar creando producto con cantidad 2 de un ingrediente
   - Verificar que el cálculo de stock use la cantidad
   - Probar productos existentes (deben seguir funcionando con cantidad = 1)

## Open Questions

- ¿Se debería permitir cantidad = 0 (ingrediente opcional)?
  - Por ahora: No, cantidad mínima es 1. Si no se quiere el ingrediente, no incluirlo en la lista.

- ¿Qué sucede si se cambia la cantidad de un ingrediente de un producto ya creado?
  - El stock se recalcula automáticamente en el próximo request (cálculo lazy)