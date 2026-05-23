# Specification: categoria-tree-visual

## Overview

Visualización interactiva del árbol de categorías en el panel de administración. Permite ver la jerarquía completa, expandir/colapsar ramas, y editar categorías directamente desde el árbol.

## ADDED Requirements

### Requirement: Tree View Rendering
El sistema SHALL renderizar una vista de árbol de las categorías que muestre la jerarquía completa de padre-hijo.

#### Scenario: Render root categories
- **WHEN** el usuario navega a la página de categorías
- **THEN** el sistema muestra todas las categorías raíz (parent_id = null) en la parte superior del árbol

#### Scenario: Render child nodes
- **WHEN** el árbol渲染iza una categoría con hijos
- **THEN** el sistema muestra los hijos indentados debajo del padre con líneas de conexión visuales

#### Scenario: Show category status
- **WHEN** se renderiza cualquier nodo del árbol
- **THEN** el sistema muestra un badge indicando si la categoría está activa o inactiva

### Requirement: Expand/Collapse Functionality
El sistema SHALL permitir expandir y colapsar ramas del árbol de categorías.

#### Scenario: Expand a branch
- **WHEN** el usuario hace clic en el icono de expandir (▶) de un nodo con hijos
- **THEN** el sistema muestra los hijos y cambia el icono a colapsar (▼)

#### Scenario: Collapse a branch
- **WHEN** el usuario hace clic en el icono de colapsar (▼) de un nodo expandido
- **THEN** el sistema oculta los hijos y cambia el icono a expandir (▶)

#### Scenario: Default expansion
- **WHEN** el árbol se renderiza por primera vez
- **THEN** el sistema expande automáticamente los primeros 2 niveles de profundidad

### Requirement: Tree Node Actions
El sistema SHALL permitir realizar acciones en los nodos del árbol.

#### Scenario: Edit category from tree
- **WHEN** el usuario hace clic en el nombre de una categoría en el árbol
- **THEN** el sistema abre el modal de edición existente con los datos de esa categoría

#### Scenario: Show expand icon only for parents
- **WHEN** una categoría tiene hijos
- **THEN** el sistema muestra un icono expand/collapse al lado del nombre

#### Scenario: No expand icon for leaf nodes
- **WHEN** una categoría no tiene hijos (hoja del árbol)
- **THEN** el sistema muestra un icono de documento (📄) sin expand/collapse

### Requirement: Visual Hierarchy Indicators
El sistema SHALL mostrar indicadores visuales claros de la jerarquía.

#### Scenario: Indentation levels
- **WHEN** se renderiza un nodo a nivel N de profundidad
- **THEN** el sistema indenta el nodo N × 24px desde el borde izquierdo

#### Scenario: Connection lines
- **WHEN** un nodo tiene hermanos (mismo padre)
- **THEN** el sistema dibuja una línea vertical连接ando los nodos del mismo padre

#### Scenario: Icons differentiation
- **WHEN** se renderiza un nodo
- **THEN** el sistema muestra 📁 si tiene hijos, o 📄 si es una hoja (sin hijos)

### Requirement: Tree Data Source
El sistema SHALL obtener los datos del árbol desde el endpoint existente del backend.

#### Scenario: Fetch tree data
- **WHEN** la página de categorías se monta
- **THEN** el sistema obtiene los datos del endpoint GET /api/v1/categorias/tree

#### Scenario: Handle empty tree
- **WHEN** no existen categorías en el sistema
- **THEN** el sistema muestra un mensaje "No hay categorías registradas"

#### Scenario: Handle fetch error
- **WHEN** el endpoint de categorías falla
- **THEN** el sistema muestra un mensaje de error con opción de reintentar