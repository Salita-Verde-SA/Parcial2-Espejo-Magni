# Implementation Tasks - Stock from Ingredients

## 1. Backend - Modificar Modelos

- [x] 1.1 Eliminar campo `stock_cantidad` de `ProductoCreate` schema en `backend/app/modules/productos/model.py`
- [x] 1.2 Eliminar campo `stock_cantidad` de `ProductoUpdate` schema en `backend/app/modules/productos/model.py`
- [x] 1.3 Verificar que `ProductoPublic` siga incluyendo `stock_cantidad` para la respuesta (ya que es para lectura)

## 2. Backend - Implementar Función de Cálculo

- [x] 2.1 Crear función `calcular_stock_producto(producto_id: int) -> int` en `backend/app/modules/productos/service.py`
- [x] 2.2 La función debe obtener los ingredientes del producto via repository
- [x] 2.3 La función debe retornar el mínimo stock de los ingredientes (tratando null/negativo como 0)
- [x] 2.4 Si el producto no tiene ingredientes, retornar 0

## 3. Backend - Modificar Service

- [x] 3.1 Modificar método `get_producto` en service para incluir stock calculado
- [x] 3.2 Modificar método `list_productos` en service para incluir stock calculado en cada item
- [x] 3.3 Modificar método `create_producto` para no aceptar stock_cantidad en input
- [x] 3.4 Modificar método `update_producto` para no aceptar stock_cantidad en input

## 4. Backend - Modificar Repository

- [x] 4.1 Agregar método para obtener ingredientes de un producto con su stock en `backend/app/modules/productos/repository.py`
- [x] 4.2 El método debe retornar lista de tuplas (ingrediente_id, stock_cantidad)

## 5. Frontend - Modificar ProductoModal

- [x] 5.1 Eliminar campo de input "Stock" del formulario en `frontend/src/components/ProductoModal.tsx`
- [x] 5.2 Agregar visualización de stock calculado como texto de solo lectura
- [x] 5.3 El stock debe mostrarse después de que se seleccionen los ingredientes
- [x] 5.4 Mostrar mensaje "Sin ingredientes asignados" si no hay ingredientes

## 6. Frontend - Verificar Tipos

- [x] 6.1 Actualizar tipo `ProductoCreate` en `frontend/src/types.ts` para remover campo stock
- [x] 6.2 Verificar que la API response type incluya stock calculado

## 7. Testing

- [x] 7.1 Probar crear producto sin ingredientes → stock debe ser 0
- [x] 7.2 Probar crear producto con ingredientes con stocks [10, 5, 8] → stock debe ser 5
- [x] 7.3 Probar editar producto y verificar que stock se muestra como solo lectura
- [x] 7.4 Verificar que la lista de productos muestra el stock calculado

## 8. Validación de Especificaciones

- [x] 8.1 Verificar que todos los escenarios de spec se cumplen
- [x] 8.2 Probar caso de ingrediente con stock null
- [x] 8.3 Probar caso de ingrediente con stock negativo