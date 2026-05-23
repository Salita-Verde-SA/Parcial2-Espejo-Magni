# Implementation Tasks - Ingrediente Cantidad Producto

## 1. Database - Agregar columna cantidad

- [x] 1.1 Ejecutar ALTER TABLE para agregar columna cantidad a producto_ingrediente
- [x] 1.2 La columna debe ser INTEGER NOT NULL DEFAULT 1
  - *Nota*: SQLModel con `create_all_tables` automáticamente agregará la columna. Si la tabla ya existe, ejecutar: `ALTER TABLE producto_ingrediente ADD COLUMN cantidad INTEGER NOT NULL DEFAULT 1;`

## 2. Backend - Modificar Modelo

- [x] 2.1 Agregar campo `cantidad` al modelo `ProductoIngrediente` en `backend/app/modules/productos/model.py`
- [x] 2.2 Definir default = 1 para mantener compatibilidad
- [x] 2.3 Crear nuevo schema `IngredienteCantidadInput` para el input:
  ```python
  class IngredienteCantidadInput(SQLModel):
      ingrediente_id: int
      cantidad: int = 1
      es_removible: bool = False
  ```

## 3. Backend - Modificar Schemas de Producto

- [x] 3.1 Modificar `ProductoCreate` para usar `ingredientes: list[IngredienteCantidadInput]` en lugar de `ingrediente_ids: list[int]`
- [x] 3.2 Modificar `ProductoUpdate` para usar el mismo formato
- [x] 3.3 Modificar `IngredienteResumen` para incluir campo `cantidad` en la respuesta
- [x] 3.4 Modificar `ProductoPublic` para incluir cantidad en la lista de ingredientes

## 4. Backend - Modificar Repository

- [x] 4.1 Modificar método para crear relación producto-ingrediente para incluir cantidad
- [x] 4.2 Modificar método para actualizar relación con nueva cantidad
- [x] 4.3 Modificar método para obtener ingredientes del producto (incluir cantidad)

## 5. Backend - Modificar Service

- [x] 5.1 Modificar `create_producto` para procesar lista de objetos con cantidad
- [x] 5.2 Modificar `update_producto` para procesar cambios de cantidad
- [ ] 5.3 Modificar función de cálculo de stock para usar cantidad:
  - Fórmula: stock_producto = min(floor(stock_ingrediente / cantidad_necesaria))
  - *Nota*: Esta tarea se implementará en el change "stock-from-ingredients"

## 6. Backend - Modificar Router

- [x] 6.1 Verificar que los endpoints accepten el nuevo formato de ingredientes
- [x] 6.2 Verificar que la documentación OpenAPI refleje los cambios

## 7. Frontend - Modificar Tipos

- [x] 7.1 Crear tipo `IngredienteCantidad` en `frontend/src/types.ts`:
  ```typescript
  interface IngredienteCantidad {
    ingrediente_id: number;
    cantidad: number;
    es_removible: boolean;
  }
  ```
- [x] 7.2 Actualizar tipo `ProductoCreate` y `ProductoUpdate` para usar el nuevo formato

## 8. Frontend - Modificar ProductoModal

- [x] 8.1 Al agregar un nuevo ingrediente al producto, mostrar un prompt/input para especificar la cantidad (valor por defecto: 1)
- [x] 8.2 Al editar un ingrediente existente, permitir modificar la cantidad
- [x] 8.3 El campo de cantidad debe ser un input numérico con valor mínimo 1
- [x] 8.4 Mostrar la cantidad junto a cada ingrediente en la lista de ingredientes del producto
- [x] 8.5 Por defecto, nuevos ingredientes se agregan con cantidad = 1

## 9. Frontend - Actualizar API Client

- [x] 9.1 Actualizar funciones en `frontend/src/api/productos.ts` para enviar formato con objetos

## 10. Testing

- [ ] 10.1 Probar crear producto con cantidad 2 de un ingrediente
- [ ] 10.2 Probar editar cantidad de ingrediente existente
- [ ] 10.3 Verificar cálculo de stock con diferentes cantidades (se implementa en change "stock-from-ingredients")
- [ ] 10.4 Probar productos existentes (deben funcionar con cantidad = 1)
- [ ] 10.5 Validar que cantidad mínima es 1 (rechazar 0 o negativo)