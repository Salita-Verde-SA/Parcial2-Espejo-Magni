## Context

Actualmente, el modelo `Producto` tiene un campo `stock_cantidad` que se ingresa manualmente en el modal de creación/edición. Sin embargo, los productos están formados por ingredientes (relación muchos a muchos via `ProductoIngrediente`), y tiene sentido que el stock del producto derive del stock disponible de sus ingredientes.

El objetivo es eliminar el input manual del stock en el frontend y calcularlo automáticamente en el backend basándose en el stock de los ingredientes vinculados.

## Goals / Non-Goals

**Goals:**
- Eliminar campo `stock_cantidad` del modal de producto (frontend)
- Calcular stock de producto como el mínimo stock de sus ingredientes (backend)
- Mostrar stock calculado en la lista de productos y en el modal de edición
- Mantener compatibilidad con datos existentes (el campo sigue en la tabla)

**Non-Goals:**
- Modificar el sistema de pedidos o reservado de stock al vender
- Implementar lógica de alertas de stock bajo
- Agregar historial de cambios de stock
- Modificar el modelo de datos de la tabla

## Decisions

### 1. Fórmula de cálculo de stock

**Decisión**: El stock de un producto = mínimo(stock de sus ingredientes)

**Alternativas consideradas:**
- Sumar todos los ingredientes: ❌ No tiene sentido, un producto necesita todos los ingredientes
- Stock promedio: ❌ No refleja la realidad, el limitante es el ingrediente con menos stock
- Cantidad máxima que se puede producir: ✅ Esta es la lógica correcta

**Justificación**: Si un producto requiere 2 hamburguesas y 3 panes, y tenemos 10 hamburguesas y 3 panes, solo podemos hacer 3 productos (limitado por los panes).

### 2. Productos sin ingredientes

**Decisión**: El stock será 0 si el producto no tiene ingredientes vinculados

**Alternativas consideradas:**
- Stock infinito: ❌ No tiene sentido comercial
- Bloquear creación sin ingredientes: ❌ Puede ser muy restrictivo
- Stock = 0: ✅ Valor por defecto claro y consistente

### 3. Ingredientes con stock null o negativo

**Decisión**: Tratar stock null como 0, valores negativos como 0

**Justificación**: SQLModel permite valores negativos en teoría, pero en la práctica stock negativo no tiene sentido. Normalizamos a 0 para evitar inconsistencias.

### 4. Ubicación de la lógica de cálculo

**Decisión**: La lógica de cálculo vive en el Service layer (`productos/service.py`)

**Alternativas consideradas:**
- Repository: ❌ El repository debe ser solo acceso a datos
- Router: ❌ El router debe ser mínimo, solo plumbing
- Base de datos (VIEW): ❌ Agrega complejidad de migración
- Service: ✅ Es el lugar correcto para lógica de negocio

## Risks / Trade-offs

- **[Riesgo]** Productos existentes sin ingredientes definidos pueden mostrar stock = 0
  - **Mitigación**: Al migrar, se puede crear un script para vincular ingredientes a productos existentes si fuera necesario

- **[Riesgo]** Performance al calcular stock en cada request
  - **Mitigación**: El cálculo es simple (min de integers), pero se puede agregar cache si el volumen es alto

- **[Trade-off]** El campo `stock_cantidad` queda en la tabla pero no se usa en写入
  - **Justificación**: Eliminar la columna requeriría migración de datos. Mantenerla permite rollback fácil y no afecta performance

## Migration Plan

1. Modificar backend primero:
   - Agregar función `calcular_stock_producto(producto_id)` en service
   - Modificar schemas para remover `stock_cantidad` de input
   - Modificar endpoints GET para calcular y devolver stock

2. Modificar frontend:
   - Eliminar input de stock del ProductoModal
   - Agregar display de stock calculado (solo lectura)

3. Verificar:
   - Probar creando producto sin ingredientes → stock = 0
   - Probar creando producto con ingredientes → stock = mínimo de ellos
   - Probar editando producto y cambiando ingredientes → stock se recalcula

## Open Questions

- ¿Qué sucede si se modifica el stock de un ingrediente? ¿Debería recalcularse automáticamente el stock de todos los productos afectados?
  - Por ahora: No, el cálculo es lazy (en tiempo de request). Esto simplifica la implementación.
  - Futuro: Se podría agregar triggers o recalculo programado si hay demanda.