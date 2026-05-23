## Context

El modelo actual de Ingrediente no tiene campo de stock. La tabla `ingrediente` actualmente tiene:
- id, nombre, descripcion, es_alergeno, created_at, updated_at, deleted_at

## Goals / Non-Goals

**Goals:**
- Agregar campo `stock_cantidad` a la tabla ingrediente
- Permitir crear/editar ingredientes con stock inicial
- Mostrar stock en la lista de ingredientes del admin

**Non-Goals:**
- No se implementa validación de stock al crear productos (se hará en otro change)
- No se implementa actualización automática de stock por ventas
- No se implementa alertas de stock bajo

## Decisions

### 1. Nombre del campo

**Decisión**: `stock_cantidad` (consistente con el campo en Producto)

### 2. Valor por defecto

**Decisión**: Default = 0 (nuevo ingrediente sin stock disponible)

### 3. Tipo de dato

**Decisión**: INTEGER (unidades enteras)

## Risks / Trade-offs

- La tabla ya existe - se requiere migración (ALTER TABLE o recreate)

## Migration Plan

1. Modificar modelo Ingrediente para agregar campo stock_cantidad
2. Modificar schemas para incluir el campo
3. Actualizar frontend para mostrar y editar stock
4. Recrear DB para aplicar cambios

## Open Questions

- ¿Se debe permitir stock negativo?
  - No, el mínimo es 0