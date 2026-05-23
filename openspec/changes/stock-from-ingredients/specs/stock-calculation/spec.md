# Stock Calculation Specification

## ADDED Requirements

### Requirement: El stock de un producto se calcula automáticamente desde sus ingredientes

El sistema SHALL calcular el stock de un producto automáticamente basándose en el stock disponible de sus ingredientes vinculados. El valor de stock SHALL ser el menor valor entre todos los ingredientes del producto (ingrediente limitante).

#### Scenario: Producto con múltiples ingredientes con diferentes stocks
- **WHEN** un producto tiene ingredientes con stocks [10, 5, 8]
- **THEN** el stock calculado del producto SHALL ser 5

#### Scenario: Producto sin ingredientes
- **WHEN** un producto no tiene ingredientes vinculados
- **THEN** el stock calculado del producto SHALL ser 0

#### Scenario: Ingrediente con stock null
- **WHEN** uno de los ingredientes del producto tiene stock null
- **THEN** el sistema SHALL tratar ese stock como 0 para el cálculo

#### Scenario: Ingrediente con stock negativo
- **WHEN** uno de los ingredientes del producto tiene stock negativo
- **THEN** el sistema SHALL tratar ese stock como 0 para el cálculo

### Requirement: El campo stock_cantidad no es editable desde el input

El sistema SHALL no permitir que el usuario ingrese el valor de stock_cantidad al crear o editar un producto. El campo SHALL ser calculado automáticamente y shown como solo lectura.

#### Scenario: Crear producto sin ver stock calculado
- **WHEN** el usuario crea un nuevo producto
- **THEN** el modal NO SHALL incluir un campo de entrada para stock_cantidad

#### Scenario: Editar producto muestra stock calculado
- **WHEN** el usuario edita un producto existente
- **THEN** el sistema SHALL mostrar el stock calculado como un valor de solo lectura

### Requirement: El stock calculado se devuelve en las respuestas de API

El sistema SHALL incluir el valor de stock calculado en las respuestas de los endpoints GET de productos.

#### Scenario: GET /productos devuelve stock calculado
- **WHEN** el cliente hace GET a /api/v1/productos
- **THEN** cada producto en la respuesta SHALL incluir el campo stock_cantidad con el valor calculado

#### Scenario: GET /productos/{id} devuelve stock calculado
- **WHEN** el cliente hace GET a /api/v1/productos/{id}
- **THEN** la respuesta SHALL incluir el campo stock_cantidad con el valor calculado

### Requirement: El stock se recalcula al modificar ingredientes de un producto

Cuando se modifican los ingredientes vinculados a un producto, el stock calculado SHALL reflejar los nuevos ingredientes.

#### Scenario: Agregar ingrediente a producto
- **WHEN** se agrega un nuevo ingrediente a un producto existente
- **THEN** el stock del producto SHALL recalcularse considerando el nuevo ingrediente

#### Scenario: Eliminar ingrediente de producto
- **WHEN** se elimina un ingrediente de un producto existente
- **THEN** el stock del producto SHALL recalcularse sin ese ingrediente