# Ingrediente Cantidad en Producto Specification

## ADDED Requirements

### Requirement: La relación producto-ingrediente incluye cantidad

El sistema SHALL incluir un campo `cantidad` en la relación entre productos e ingredientes que especifica cuántas unidades del ingrediente se necesitan para elaborar una unidad del producto.

#### Scenario: Crear producto con ingrediente cantidad 2
- **WHEN** el usuario crea un producto y especifica cantidad 2 para un ingrediente
- **THEN** la relación SHALL almacenar cantidad = 2

#### Scenario: Consultar producto muestra cantidad de ingredientes
- **WHEN** el usuario consulta un producto con ingredientes vinculados
- **THEN** la respuesta SHALL incluir la cantidad de cada ingrediente

### Requirement: La cantidad tiene valor por defecto

El sistema SHALL asignar cantidad = 1 por defecto cuando no se especifica, tanto en creación como en productos existentes.

#### Scenario: Crear producto sin especificar cantidad
- **WHEN** el usuario crea un producto con ingredientes pero sin especificar cantidad
- **THEN** el sistema SHALL usar cantidad = 1 por defecto

#### Scenario: Productos existentes sin cantidad definida
- **WHEN** se consultan productos creados antes de esta característica
- **THEN** el sistema SHALL treatar cantidad como 1 para mantener compatibilidad

### Requirement: El cálculo de stock considera la cantidad

El sistema SHALL usar la cantidad de cada ingrediente para calcular el stock máximo del producto. La fórmula es: stock_producto = floor(stock_ingrediente / cantidad_necesaria) para cada ingrediente, luego tomar el mínimo.

#### Scenario: Producto con ingrediente cantidad 2 y stock 10
- **WHEN** un producto requiere 2 unidades de un ingrediente y el ingrediente tiene stock 10
- **THEN** el producto puede prepararse 5 veces (10 / 2 = 5)

#### Scenario: Múltiples ingredientes con diferentes cantidades
- **WHEN** un producto tiene ingrediente A (cantidad 2, stock 10) y ingrediente B (cantidad 1, stock 8)
- **THEN** el stock del producto SHALL ser 5 (limitado por A: 10/2=5, B: 8/1=8, mínimo=5)

### Requirement: El frontend permite especificar cantidad

El sistema SHALL permitir al usuario ingresar la cantidad de cada ingrediente al crear o editar un producto.

#### Scenario: Modal de producto muestra campo de cantidad
- **WHEN** el usuario edita un producto y selecciona ingredientes
- **THEN** cada ingrediente SHALL tener un campo para especificar cantidad

#### Scenario: Validación de cantidad mínima
- **WHEN** el usuario intenta ingresar cantidad 0 o negativa
- **THEN** el sistema SHALL rechazar el valor y mostrar error (cantidad mínima = 1)

## MODIFIED Requirements

### Requirement: El formato de ingredientes en API cambia

**Reason**: Para permitir especificar cantidad, el formato de envío debe cambiar de lista simple de IDs a objetos con estructura.

El nuevo formato para crear/actualizar productos SHALL ser:
```json
{
  "ingredientes": [
    {"ingrediente_id": 1, "cantidad": 2, "es_removible": true},
    {"ingrediente_id": 2, "cantidad": 1, "es_removible": false}
  ]
}
```

#### Scenario: API acepta nuevo formato con objetos
- **WHEN** el cliente envía POST /productos con formato de objetos
- **THEN** el sistema SHALL procesar correctamente la cantidad

#### Scenario: API responde con cantidad en cada ingrediente
- **WHEN** el cliente hace GET /productos/{id}
- **THEN** cada ingrediente en la respuesta SHALL incluir su cantidad