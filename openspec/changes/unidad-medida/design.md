## Context

El sistema actual tiene stocks expresados en enteros sin unidad de medida. Esto genera ambigüedad: `stock: 100` no indica si son gramos, kilos, porciones o unidades. Además, en `producto_ingrediente` el campo `cantidad` es INTEGER sin unidad, imposibilitando expresar recetas precisas como "200g de carne".

El objetivo es introducir un catálogo de unidades de medida que se pueden asignar a productos (para precio de venta) y a ingredientes de recetas (para cantidad en recetas).

## Goals / Non-Goals

**Goals:**
- Crear tabla `UnidadMedida` con catálogo de unidades (kg, g, L, mL, u, doc)
- Asignar unidad de venta a productos (`precio: S/. 12.50 / kg`)
- Asignar unidad a cada ingrediente en la relación `producto_ingrediente`
- Cambiar `cantidad` de INTEGER a DECIMAL(10,3) para mayor precisión
- Mostrar unidad en frontend (ProductCard, ProductoModal)

**Non-Goals:**
- Sistema de conversión de unidades (futuro)
- Historial de cambios de unidades
- Múltiples monedas
- Unidades compuestas (ej: "S/. 12.50 / 100g")

## Decisions

### 1. Estructura de la tabla UnidadMedida

**Decisión**: Tabla simple con `id`, `nombre`, `simbolo`, `tipo`, `created_at`

```
UnidadMedida
├── id: BIGSERIAL (PK)
├── nombre: VARCHAR(50) UNIQUE NOT NULL (ej: "kilogramo")
├── simbolo: VARCHAR(10) UNIQUE NOT NULL (ej: "kg")
├── tipo: VARCHAR(20) NOT NULL (ej: "masa", "volumen", "unidad", "area")
└── created_at: TIMESTAMPTZ NOT NULL
```

**Justificación**: Catálogo sencillo permite filtrar por tipo en UI y habilita conversión futura.

### 2. Unidades iniciales (Seed)

**Decisión**: Seed obligatorio con 4 tipos:

| tipo | unidades |
|------|----------|
| masa | kilogramo (kg), gramo (g) |
| volumen | litro (L), mililitro (mL) |
| unidad | pieza (u), docena (doc) |
| area | metro cuadrado (m²) |

**Justificación**: Cubren los casos de uso de comida rápida (gramaje para ingredientes, porciones para productos).

### 3. Relación con Producto

**Decisión**: `Producto.unidad_venta_id` FK nullable a `UnidadMedida`

```
Producto
├── unidad_venta_id: BIGINT FK -> UnidadMedida.id (nullable)
└── precio_base: DECIMAL(10,2) NOT NULL
```

**Alternativas consideradas:**
- Múltiples columnas de precio por unidad: ❌ Excesivo para v1
- Solo símbolo como string: ❌ No permite filtrar por tipo ni conversión futura
- FK a UnidadMedida: ✅ Limpio, extensible

**Display:**
- `precio_base = 12.50, unidad = "kg"` → `"S/. 12.50 / kg"`
- `precio_base = 3.00, unidad = NULL` → `"S/. 3.00"` (por pieza por defecto)

### 4. Relación con ProductoIngrediente

**Decisión**: Agregar `unidad_medida_id` FK NOT NULL, cambiar `cantidad` a DECIMAL(10,3)

```
ProductoIngrediente
├── cantidad: DECIMAL(10,3) NOT NULL CHECK > 0 (cambia de INTEGER)
├── unidad_medida_id: BIGINT FK -> UnidadMedida.id NOT NULL
└── es_removible: BOOLEAN NOT NULL DEFAULT false
```

**Justificación**: Cada fila puede especificarcantidad Y unidad. Ej: 200g de carne, 50g de queso cheddar.

### 5. Unidad por defecto para recetas

**Decisión**: Al crear/editar ProductoIngrediente, si no se especifica unidad, usar la unidad del ingrediente (futuro) o "u" (pieza) como default.

**Implementación**: En el seed de unidades, incluir "u" (pieza) como unidad default.

### 6. Módulo de backend

**Decisión**: Crear módulo `unidades` con CRUD completo similar a `categorias`

```
backend/app/modules/unidades/
├── __init__.py
├── model.py        # UnidadMedida, UnidadMedidaCreate, etc.
├── repository.py   # UnidadMedidaRepository
├── service.py      # UnidadMedidaService
└── router.py       # Endpoints
```

**Rutas:**
- `GET /api/v1/unidades/` - Listar todas (para select)
- `GET /api/v1/unidades/{id}` - Detalle
- `POST /api/v1/unidades/` - Crear (admin)
- `PUT /api/v1/unidades/{id}` - Actualizar (admin)
- `DELETE /api/v1/unidades/{id}` - Eliminar (admin, solo si no está en uso)

## Risks / Trade-offs

- **[Riesgo]** Productos existentes no tienen unidad asignada
  - **Mitigación**: Nullable permite backward compatibility. UI muestra precio sin unidad hasta que se asigne.

- **[Riesgo]** Ingredientes de productos existentes no tienen unidad en `producto_ingrediente`
  - **Mitigación**: Migration script asignará unidad default "u" a todas las filas existentes.

- **[Trade-off]** Agregar FK a ProductoIngrediente
  - **Justificación**: La consistencia de datos vale el JOIN extra. Sin unidad, no hay forma de saber qué representa `cantidad: 200`.

## Migration Plan

1. **Backend primero:**
   - Crear modelo `UnidadMedida`
   - Actualizar `Producto` con `unidad_venta_id`
   - Actualizar `ProductoIngrediente` con `unidad_medida_id`, cambiar `cantidad` a DECIMAL(10,3)
   - Crear módulo `unidades`
   - Actualizar repository de productos para incluir relaciones
   - Actualizar service de productos para incluir unidad en respuestas

2. **Seed:**
   - Agregar seed de `UnidadMedida` con 8 unidades iniciales

3. **Frontend:**
   - Agregar tipos para `UnidadMedida`
   - Crear API para unidades
   - Modificar `ProductoModal` para selector de unidad en venta
   - Modificar `ProductoModal` para selector de unidad en cada ingrediente de receta
   - Modificar `ProductCard` para mostrar precio con unidad

4. **Migration de datos:**
   - Script para asignar "u" (pieza) a todos los `producto_ingrediente` existentes

## Open Questions

- ¿Se permite eliminar una unidad que está en uso?
  - **Decisión provisional**: No, retornar 400 si tiene productos o recetas asociadas.
- ¿Las unidades son editables o solo se crean en seed?
  - **Decisión provisional**: CRUD completo para permitir flexibilidad, pero seed provee las comunes.
- ¿Se requiere conversión entre unidades del mismo tipo?
  - **No para esta iteración**. futuramente: 1000g = 1kg, etc.