# Implementation Tasks - Unidad de Medida

## 1. Backend - Nuevo módulo unidades

- [x] 1.1 Crear directorio `backend/app/modules/unidades/`
- [x] 1.2 Crear `backend/app/modules/unidades/__init__.py`
- [x] 1.3 Crear `backend/app/modules/unidades/model.py` con:
  - `UnidadMedida` (SQLModel, table=True)
  - `UnidadMedidaCreate`, `UnidadMedidaUpdate`, `UnidadMedidaPublic` (schemas)
- [x] 1.4 Crear `backend/app/modules/unidades/repository.py` con `UnidadMedidaRepository`
- [x] 1.5 Crear `backend/app/modules/unidades/service.py` con `UnidadMedidaService`
- [x] 1.6 Crear `backend/app/modules/unidades/router.py` con endpoints CRUD
- [x] 1.7 Registrar router en `backend/app/main.py`

## 2. Backend - Modificar modelo Producto

- [x] 2.1 Agregar campo `unidad_venta_id: Optional[int] = Field(default=None, foreign_key="unidad_medida.id")` a modelo `Producto`
- [x] 2.2 Agregar `unidad_venta_id: Optional[int]` a `ProductoCreate` schema
- [x] 2.3 Agregar `unidad_venta_id: Optional[int]` a `ProductoUpdate` schema
- [x] 2.4 Agregar `unidad_venta: Optional[UnidadMedida]` a `ProductoPublic` schema

## 3. Backend - Modificar modelo ProductoIngrediente

- [x] 3.1 Cambiar tipo de `cantidad` de INTEGER a DECIMAL en modelo
- [x] 3.2 Agregar `unidad_medida_id: int = Field(foreign_key="unidad_medida.id")` al modelo
- [x] 3.3 Actualizar schema `IngredienteCantidadInput` para incluir `unidad_medida_id: int`
- [x] 3.4 Actualizar `IngredienteResumen` para incluir `unidad_medida_id` y `simbolo`
- [x] 3.5 Agregar validación CHECK para cantidad > 0 (en aplicación)

## 4. Backend - Modificar ProductoRepository

- [x] 4.1 Agregar método `get_ingredientes` para incluir `unidad_medida_id` y `simbolo`
- [x] 4.2 Actualizar `set_ingredientes` para aceptar `unidad_medida_id` por ingrediente
- [x] 4.3 Actualizar `get_ingrediente_stocks` para incluir relación con unidad

## 5. Backend - Modificar ProductoService

- [x] 5.1 Actualizar `_enrich` para incluir `unidad_venta` en `ProductoPublic`
- [x] 5.2 Actualizar `create_producto` para setear `unidad_venta_id` si viene en el input
- [x] 5.3 Actualizar `update_producto` para actualizar `unidad_venta_id` si viene

## 6. Backend - UnitOfWork

- [x] 6.1 Agregar `self.unidades = UnidadMedidaRepository(self.session)` a `__enter__`

## 7. Backend - Seed

- [x] 7.1 Agregar seed de `UnidadMedida` con 8 unidades iniciales:
  - masa: kilogramo (kg), gramo (g)
  - volumen: litro (L), mililitro (mL)
  - unidad: pieza (u), docena (doc)
  - area: metro cuadrado (m²)
- [x] 7.2 Hacer seed idempotente (upsert)

## 8. Frontend - Tipos

- [x] 8.1 Crear tipo `UnidadMedida` en `frontend/src/types.ts`
- [x] 8.2 Agregar `unidad_venta_id` a `Producto` interface
- [x] 8.3 Agregar `unidad_venta: UnidadMedida | null` a `Producto` interface
- [x] 8.4 Actualizar `IngredienteCantidadInput` para incluir `unidad_medida_id: number`
- [x] 8.5 Actualizar `IngredienteResumen` para incluir `unidad_medida_id` y `simbolo`

## 9. Frontend - API

- [x] 9.1 Crear `frontend/src/api/unidades.ts` con funciones CRUD para unidades
- [x] 9.2 Actualizar `fetchProducto` para incluir datos de unidad (ya viene en ProductoPublic)

## 10. Frontend - ProductoModal

- [x] 10.1 Agregar fetch de unidades en `ProductoModal`
- [x] 10.2 Agregar selector de unidad de venta en formulario de producto
- [x] 10.3 Para cada ingrediente de receta, agregar selector de unidad
- [x] 10.4 Mostrar símbolo de unidad junto a cantidad: "200 g" en lugar de "200"

## 11. Frontend - ProductCard / Catálogo

- [x] 11.1 Modificar display de precio para mostrar con unidad:
  - Con unidad: "S/. 12.50 / kg"
  - Sin unidad: "S/. 3.00"

## 12. Migration de datos

- [x] 12.1 Crear script de migration para:
  - Crear tabla `unidad_medida` si no existe
  - Asignar unidad default "u" a todos los `producto_ingrediente` existentes con `unidad_medida_id = NULL`
- [x] 12.2 Documentar migration steps en README o admin guide

  Documentación de la migración (para admin guide):
  1. Para DB nueva: ejecutar seed directamente (create_all_tables crea unidad_medida)
  2. Para DB existente SIN la columna:
     python -m app.db.migrations.add_unidad_medida
     python -m app.db.seed

## 13. Testing

- [ ] 13.1 Probar CRUD de unidades en admin
- [ ] 13.2 Probar crear producto con unidad de venta
- [ ] 13.3 Probar crear receta de producto con ingredientes con distintas unidades
- [ ] 13.4 Probar display de precio con/sin unidad en frontend
- [ ] 13.5 Probar cantidad decimal (ej: 0.500) se guarda correctamente
- [ ] 13.6 Probar que cantidad = 0 es rechazada

## 14. Validación de especificaciones

- [ ] 14.1 Verificar todos los escenarios de spec se cumplen
- [ ] 14.2 Verificar que unidades seed se crean correctamente
- [ ] 14.3 Verificar que no se puede eliminar unidad en uso