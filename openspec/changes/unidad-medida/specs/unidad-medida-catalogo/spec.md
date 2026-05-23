# Unidad de Medida - Specification

## Overview

Sistema de gestión de unidades de medida que permite asignar unidades a productos (precio de venta) y a ingredientes de recetas (cantidades en recetas).

## ADDED Requirements

### Requirement: Catálogo de unidades de medida

El sistema DEBE proporcionar un catálogo de unidades de medida con nombre, símbolo y tipo. Cada unidad tendrá un identificador único, nombre para display (ej: "kilogramo"), símbolo para UI (ej: "kg"), y tipo para categorización (ej: "masa", "volumen", "unidad", "area").

#### Scenario: Listar todas las unidades
- **WHEN** usuario solicita GET /api/v1/unidades/
- **THEN** sistema retorna lista de todas las unidades ordenadas por tipo y nombre

#### Scenario: Crear unidad nueva
- **WHEN** admin envía POST /api/v1/unidades/ con nombre, símbolo y tipo
- **THEN** sistema crea la unidad y retorna el objeto creado con id

#### Scenario: Error al crear unidad duplicada
- **WHEN** admin intenta crear unidad con nombre o símbolo ya existente
- **THEN** sistema retorna HTTP 409 Conflict

#### Scenario: Actualizar unidad
- **WHEN** admin envía PUT /api/v1/unidades/{id} con datos actualizados
- **THEN** sistema actualiza la unidad y retorna el objeto modificado

#### Scenario: Eliminar unidad no usada
- **WHEN** admin envía DELETE /api/v1/unidades/{id} donde la unidad no está en uso
- **THEN** sistema elimina la unidad y retorna HTTP 204

#### Scenario: Eliminar unidad en uso
- **WHEN** admin intenta eliminar unidad que está asignada a productos o recetas
- **THEN** sistema retorna HTTP 400 Bad Request con mensaje de error

---

### Requirement: Asignar unidad de venta a producto

El sistema DEBE permitir asignar una unidad de medida como unidad de venta a un producto. Esta unidad determina cómo se muestra el precio en el frontend.

#### Scenario: Producto con unidad asignada
- **WHEN** producto tiene unidad_venta_id = id de "kilogramo"
- **AND** precio_base = 12.50
- **THEN** frontend muestra "S/. 12.50 / kg"

#### Scenario: Producto sin unidad asignada
- **WHEN** producto tiene unidad_venta_id = null
- **AND** precio_base = 3.00
- **THEN** frontend muestra "S/. 3.00" (por pieza por defecto)

#### Scenario: Crear producto con unidad de venta
- **WHEN** admin envía POST /api/v1/productos/ con unidad_venta_id
- **THEN** sistema crea el producto con la unidad asignada

#### Scenario: Editar unidad de venta de producto
- **WHEN** admin envía PUT /api/v1/productos/{id} con nueva unidad_venta_id
- **THEN** sistema actualiza la unidad del producto

---

### Requirement: Asignar unidad a ingrediente de receta

El sistema DEBE permitir especificar una unidad de medida para cada ingrediente en la relación producto-receta (producto_ingrediente). Esto permite expresar cantidades precisas como "200g de carne".

#### Scenario: Ingrediente de receta con unidad
- **WHEN** ProductoIngrediente tiene cantidad = 200 y unidad_medida_id = id de "gramo"
- **THEN** la receta del producto muestra "200 g" de ese ingrediente

#### Scenario: Ingrediente de receta sin unidad (legacy)
- **WHEN** ProductoIngrediente tiene unidad_medida_id = null (datos antiguos)
- **THEN** el sistema asume unidad "u" (pieza) como default

#### Scenario: Ingrediente con cantidad decimal
- **WHEN** admin define cantidad = 0.5 en ProductoIngrediente
- **THEN** el sistema acepta DECIMAL(10,3), guardando 0.500

#### Scenario: Cantidad debe ser mayor a cero
- **WHEN** admin intenta crear/editar ProductoIngrediente con cantidad <= 0
- **THEN** sistema retorna HTTP 400 con mensaje de validación

---

### Requirement: Display de precio con unidad

El frontend DEBE mostrar el precio de venta del producto formateado con su unidad de medida cuando esté disponible.

#### Scenario: Mostrar precio con unidad en ProductCard
- **WHEN** producto tiene precio_base = 12.50 y unidad = "kg"
- **THEN** ProductCard muestra "S/. 12.50 / kg"

#### Scenario: Mostrar precio sin unidad en ProductCard
- **WHEN** producto tiene precio_base = 3.00 y unidad = null
- **THEN** ProductCard muestra "S/. 3.00"

#### Scenario: Selector de unidad en ProductoModal
- **WHEN** admin abre modal de crear/editar producto
- **THEN** ve un selector dropdown con todas las unidades disponibles para unidad_venta

---

### Requirement: Selector de unidad en ingredientes de receta

El frontend DEBE permitir seleccionar una unidad de medida para cada ingrediente al crear o editar la receta de un producto.

#### Scenario: Selector de unidad por ingrediente
- **WHEN** admin está editando ingredientes de un producto en ProductoModal
- **THEN** cada ingrediente tiene un dropdown para seleccionar su unidad (kg, g, L, mL, u, doc)

#### Scenario: Mostrar cantidad formateada con unidad
- **WHEN** se muestra la lista de ingredientes de un producto
- **THEN** se muestra "200 g" en lugar de solo "200"

---

### Requirement: Seed de unidades iniciales

El sistema DEBE incluir seed con unidades iniciales de los 4 tipos principales.

#### Scenario: Seed crea unidades de masa
- **WHEN** se ejecuta el seed
- **THEN** se crean las unidades: kilogramo (kg), gramo (g)

#### Scenario: Seed crea unidades de volumen
- **WHEN** se ejecuta el seed
- **THEN** se crean las unidades: litro (L), mililitro (mL)

#### Scenario: Seed crea unidades de unidad
- **WHEN** se ejecuta el seed
- **THEN** se crean las unidades: pieza (u), docena (doc)

#### Scenario: Seed crea unidades de area
- **WHEN** se ejecuta el seed
- **THEN** se crea la unidad: metro cuadrado (m²)

#### Scenario: Seed es idempotente
- **WHEN** se ejecuta el seed dos veces
- **THEN** las unidades no se duplican (se usa upsert)

---

### Requirement: Migration de datos existentes

El sistema DEBE proporcionar migración para datos existentes que no tienen unidad asignada.

#### Scenario: Migration asigna unidad default a producto_ingrediente
- **WHEN** existe ProductoIngrediente con unidad_medida_id = null
- **THEN** la migration actualiza a unidad_medida_id = id de "u" (pieza)

#### Scenario: Migration asigna unidad default a productos sin unidad
- **WHEN** existe Producto con unidad_venta_id = null
- **THEN** la migration mantiene null (es nullable por diseño)