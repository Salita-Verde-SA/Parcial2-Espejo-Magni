# Implementation Tasks - Stock Automático Completo

## 1. Backend - Modificar Repository para obtener cantidad con stock

- [x] 1.1 Modificar método `get_ingrediente_stocks` en `backend/app/modules/productos/repository.py` para retornar tuplas `(ingrediente_id, stock_cantidad, cantidad_necesaria)`
- [x] 1.2 Si la cantidad es null, usar default = 1

## 2. Backend - Corregir función de cálculo de stock

- [x] 2.1 Modificar `calcular_stock_producto` en `backend/app/modules/productos/service.py`
- [x] 2.2 Nueva fórmula: `min(floor(stock_ingrediente / cantidad_necesaria))`
- [x] 2.3 Si cantidad es null, usar 1 por defecto
- [x] 2.4 Si stock de ingrediente es 0 o null, el resultado será 0 (floor(0/x) = 0)

## 3. Backend - Agregar validación de stock al crear/editar producto

- [x] 3.1 Crear función auxiliar `validar_stock_ingredientes(ingredientes: list, uow: UnitOfWork)` en `backend/app/modules/productos/service.py`
- [x] 3.2 La función debe verificar que cada ingrediente tenga stock >= cantidad_necesaria
- [x] 3.3 Modificar `create_producto` para llamar a la validación antes de guardar
- [x] 3.4 Modificar `update_producto` para llamar a la validación cuando se modifican ingredientes
- [x] 3.5 Si la validación falla, lanzar HTTPException con código 400 y mensaje claro

## 4. Backend - Auto-ajustar disponibilidad según stock

- [x] 4.1 Modificar `_enrich` en `backend/app/modules/productos/service.py`
- [x] 4.2 Si el stock calculado es 0, forzar `disponible = False` en el resultado
- [x] 4.3 Si el stock calculado > 0, mantener el valor original de `disponible`

## 5. Backend - Modificar Service para incluir stock del ingrediente en respuesta

- [x] 5.1 Modificar `_enrich` para incluir el stock actual de cada ingrediente en la respuesta
- [x] 5.2 Agregar campo `stock_insumo` a `IngredienteResumen` en `backend/app/modules/productos/model.py`
- [x] 5.3 Modificar `get_ingredientes` en repository para retornar también el stock del ingrediente

## 6. Frontend - Validación visual al añadir ingrediente

- [x] 6.1 Modificar `ProductoModal` en `frontend/src/components/ProductoModal.tsx`
- [x] 6.2 Crear función para verificar si hay stock suficiente antes de añadir ingrediente
- [x] 6.3 Mostrar warning visual cuando el usuario intenta añadir un ingrediente que no tiene stock suficiente
- [x] 6.4 El warning debe mostrar: "Stock insuficiente: tienes X pero necesitas Y"

## 7. Frontend - Indicador visual de ingrediente sin stock

- [x] 7.1 Modificar la lista de ingredientes en `ProductoModal`
- [x] 7.2 Para cada ingrediente mostrar su stock actual junto a la cantidad necesaria
- [x] 7.3 Si `stock_insumo < cantidad_necesaria`, mostrar el ingrediente con color rojo o icono de warning

## 8. Frontend - Actualizar tipos TypeScript

- [x] 8.1 Agregar campo `stock_insumo` a `IngredienteResumen` en `frontend/src/types.ts`

## 9. Testing

- [ ] 9.1 Probar cálculo con diferentes cantidades:
  - Producto requiere 2 unidades de carne (stock=10) → stock=5
  - Producto requiere 1 unidad de pan (stock=10) → stock=10
  - Resultado: min(5, 10) = 5

- [ ] 9.2 Probar producto con ingrediente sin stock:
  - Producto tiene ingrediente con stock=0
  - El stock calculado debe ser 0

- [ ] 9.3 Probar validación al crear producto:
  - Intentar crear producto con ingrediente sin stock suficiente
  - Debe mostrar error

- [ ] 9.4 Probar edición de disponibilidad:
  - Producto con stock>0 debe mantener disponibilidad
  - Producto con stock=0 debe tener disponible=false

- [ ] 9.5 Probar recalculo automático:
  - Cambiar cantidad de ingrediente → stock se recalcula
  - Agregar stock a ingrediente → stock se recalcula

## 10. Validación de Especificaciones

- [ ] 10.1 Verificar que todos los escenarios de spec se cumplen
- [ ] 10.2 Verificar que la fórmula es correcta: stock_producto = min(floor(stock_ingrediente / cantidad_necesaria))
- [ ] 10.3 Verificar que ingredientes sin stock hacen el producto no disponible
- [ ] 10.4 Verificar validación visual en frontend