# Ingrediente Stock Specification

## ADDED Requirements

### Requirement: El ingrediente tiene campo stock_cantidad

El sistema SHALL incluir un campo `stock_cantidad` en cada ingrediente que represente la cantidad disponible en inventario.

#### Scenario: Crear ingrediente con stock
- **WHEN** el usuario crea un ingrediente y especifica stock_cantidad = 50
- **THEN** el ingrediente SHALL tener stock_cantidad = 50

#### Scenario: Consultar ingrediente muestra stock
- **WHEN** el cliente hace GET /api/v1/ingredientes/{id}
- **THEN** la respuesta SHALL incluir stock_cantidad

### Requirement: El stock se puede modificar al editar

El sistema SHALL permitir modificar el stock de un ingrediente existente.

#### Scenario: Editar stock de ingrediente
- **WHEN** el usuario edita un ingrediente y cambia su stock_cantidad
- **THEN** el nuevo valor SHALL guardarse en la base de datos

### Requirement: El stock por defecto es 0

El sistema SHALL asignar stock_cantidad = 0 cuando no se especifica, tanto en creación como en ingredientes existentes.

#### Scenario: Crear ingrediente sin especificar stock
- **WHEN** el usuario crea un ingrediente sin ingresar stock_cantidad
- **THEN** el sistema SHALL usar stock_cantidad = 0 por defecto