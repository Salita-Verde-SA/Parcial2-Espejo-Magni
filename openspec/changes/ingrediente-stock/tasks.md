# Implementation Tasks - Ingrediente Stock

## 1. Backend - Modificar Modelo

- [x] 1.1 Agregar campo `stock_cantidad` al modelo `Ingrediente` en `backend/app/modules/ingredientes/model.py`
- [x] 1.2 Definir default = 0 para mantener compatibilidad
- [x] 1.3 Modificar `IngredienteCreate` para incluir campo stock_cantidad
- [x] 1.4 Modificar `IngredienteUpdate` para incluir campo stock_cantidad
- [x] 1.5 Modificar `Ingrediente` (respuesta) para incluir stock_cantidad

## 2. Backend - Modificar Service

- [x] 2.1 Modificar `create_ingrediente` para aceptar stock_cantidad
- [x] 2.2 Modificar `update_ingrediente` para actualizar stock_cantidad

## 3. Frontend - Modificar Tipos

- [x] 3.1 Actualizar tipo `Ingrediente` en `frontend/src/types.ts` para incluir stock_cantidad
- [x] 3.2 Actualizar tipo `IngredienteCreate` e `IngredienteUpdate` para incluir stock_cantidad

## 4. Frontend - Modificar IngredienteModal

- [x] 4.1 Agregar campo de stock en el formulario de crear/editar ingrediente
- [x] 4.2 El campo debe ser numérico con valor mínimo 0

## 5. Frontend - Modificar IngredientesPage

- [x] 5.1 Agregar columna "Stock" en la tabla de ingredientes
- [x] 5.2 Mostrar el valor de stock_cantidad

## 6. Database

- [x] 6.1 Recrear la base de datos para aplicar el nuevo campo (docker-compose down -v && docker-compose up -d)

## 7. Testing

- [ ] 7.1 Probar crear ingrediente con stock
- [ ] 7.2 Probar editar stock de ingrediente
- [ ] 7.3 Verificar que la tabla muestra el stock
- [ ] 7.4 Probar ingredientes existentes (deben tener stock = 0)