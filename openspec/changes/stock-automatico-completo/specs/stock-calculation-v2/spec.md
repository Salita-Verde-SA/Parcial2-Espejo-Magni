# Stock Calculation V2 Specification

## ADDED Requirements

### Requirement: El stock de un producto se calcula usando la fórmula con cantidades

El sistema SHALL calcular el stock de un producto considerando la cantidad de cada ingrediente necesaria para elaborar una unidad del producto.

La fórmula de cálculo es:
```
stock_producto = min(floor(stock_ingrediente / cantidad_necesaria_para_producto))
```

#### Scenario: Producto con un ingrediente
- **GIVEN** un producto tiene 1 ingrediente con stock_cantidad=10 y cantidad_necesaria=2
- **THEN** el stock calculado del producto SHALL ser 5

#### Scenario: Producto con múltiples ingredientes con diferentes stocks y cantidades
- **GIVEN** un producto tiene ingredientes con:
  - Ingrediente A: stock=10, cantidad_necesaria=2 → floor(10/2) = 5
  - Ingrediente B: stock=8, cantidad_necesaria=1 → floor(8/1) = 8
  - Ingrediente C: stock=5, cantidad_necesaria=1 → floor(5/1) = 5
- **THEN** el stock calculado del producto SHALL ser 5 (el mínimo)

#### Scenario: Producto sin ingredientes
- **WHEN** un producto no tiene ingredientes vinculados
- **THEN** el stock calculado del producto SHALL ser 0

#### Scenario: Ingrediente con cantidad no definida (null)
- **GIVEN** un producto tiene un ingrediente con stock=10 pero cantidad es null
- **THEN** el sistema SHALL usar cantidad = 1 por defecto

#### Scenario: Ingrediente con stock null
- **WHEN** uno de los ingredientes del producto tiene stock null
- **THEN** el sistema SHALL tratar ese stock como 0 para el cálculo

#### Scenario: Ingrediente con stock negativo
- **WHEN** uno de los ingredientes del producto tiene stock negativo
- **THEN** el sistema SHALL tratar ese stock como 0 para el cálculo

### Requirement: Validación de stock insuficiente

Si algún ingrediente tiene stock_insumo < cantidad_necesaria_para_producto, el sistema SHALL mostrar una advertencia o error.

#### Scenario: Crear producto con ingrediente sin stock suficiente
- **GIVEN** existe un ingrediente "Carne" con stock_cantidad=1
- **WHEN** el usuario crea un producto que requiere cantidad=2 de ese ingrediente
- **THEN** el sistema SHALL mostrar un error indicando que no hay stock suficiente
- **AND** el producto NO deberá ser creado hasta que se ajuste la cantidad o se agregue stock

#### Scenario: Editar producto agregando ingrediente sin stock suficiente
- **GIVEN** existe un producto "Hamburguesa" con stock calculado=5
- **AND** existe un ingrediente "Queso" con stock_cantidad=0
- **WHEN** el usuario edita el producto y agrega el ingrediente "Queso" con cantidad=1
- **THEN** el sistema SHALL mostrar un error indicando que el ingrediente no tiene stock

### Requirement: Stock insuficiente automáticamene hace el producto no disponible

Cuando el stock calculado de un producto es 0 (porque algún ingrediente no tiene stock), el sistema SHALL marcar el producto como no disponible.

#### Scenario: Producto con ingrediente sin stock
- **GIVEN** un producto tiene ingredientes pero uno de ellos tiene stock=0
- **WHEN** se calcula el stock del producto
- **THEN** el stock calculado SHALL ser 0
- **AND** el campo `disponible` SHALL ser false

#### Scenario: Producto recupera disponibilidad al tener stock
- **GIVEN** un producto tiene stock=0 porque un ingrediente se quedó sin stock
- **WHEN** se agrega más stock al ingrediente
- **THEN** el stock del producto SHALL recalcularse automáticamente
- **AND** si el stock calculado > 0, el producto podrá estar disponible

### Requirement: Validación visual en frontend al añadir ingrediente

El frontend SHALL mostrar una validación visual cuando el usuario intenta añadir un ingrediente que no tiene stock suficiente.

#### Scenario: Añadir ingrediente sin stock en modal de producto
- **GIVEN** el modal de producto está abierto
- **AND** existe un ingrediente "Carne" con stock_cantidad=5
- **WHEN** el usuario selecciona ese ingrediente con cantidad=10
- **THEN** el sistema SHALL mostrar un warning visual
- **AND** el warning SHALL indicar que el stock actual (5) es menor a la cantidad necesaria (10)

#### Scenario: Mostrar indicador de ingrediente sin stock en lista
- **GIVEN** un producto tiene ingredientes vinculados
- **WHEN** se muestra la lista de ingredientes del producto
- **THEN** los ingredientes con stock_cantidad=0 SHALL mostrarse con estilo visual diferente (color rojo o icono de warning)

### Requirement: El stock se recalcula al modificar ingredientes o stock de ingredientes

El stock calculado SHALL reflejar los cambios en las cantidades de ingredientes o en el stock de los ingredientes.

#### Scenario: Cambiar cantidad de ingrediente en producto
- **GIVEN** un producto tiene un ingrediente con cantidad=2
- **WHEN** el usuario cambia la cantidad a 4
- **THEN** el stock del producto SHALL recalcularse usando la nueva cantidad

#### Scenario: Agregar stock a ingrediente
- **GIVEN** un producto tiene un ingrediente con stock=2 y cantidad_necesaria=2 (stock_producto=1)
- **WHEN** se agrega más stock al ingrediente (ahora stock=10)
- **THEN** el stock del producto SHALL recalcularse a 5

#### Scenario: Eliminar ingrediente de producto
- **GIVEN** un producto tiene 3 ingredientes y el limitante tiene stock=3
- **WHEN** se elimina uno de los ingredientes (no el limitante)
- **THEN** el stock del producto SHALL recalcularse considerando solo los ingredientes restantes

### Requirement: El campo stock_cantidad no es editable desde el input (ya implementado)

El sistema NO SHALL permitir que el usuario ingrese el valor de stock_cantidad al crear o editar un producto. El campo SHALL ser calculado automáticamente y mostrado como solo lectura.

#### Scenario: Crear producto no muestra campo de stock
- **WHEN** el usuario crea un nuevo producto
- **THEN** el modal NO SHALL incluir un campo de entrada para stock_cantidad

#### Scenario: Editar producto muestra stock calculado como solo lectura
- **WHEN** el usuario edita un producto existente
- **THEN** el sistema SHALL mostrar el stock calculado como un valor de solo lectura