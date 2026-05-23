# Proposal: Árbol Visual de Categorías

## Why

El sistema tiene una estructura jerárquica de categorías (padre → hija) pero actualmente solo muestra la categoría padre inmediata en texto plano. Los usuarios no pueden visualizar fácilmente la jerarquía completa. Por ejemplo, si "Bebidas" es padre de "Con Alcohol" y "Sin Alcohol", y "Con Alcohol" tiene hijos como "Vino" y "Cerveza", el admin necesita ver esa cadena completa de herencia de forma visual para entender la estructura del catálogo.

## What Changes

- **Frontend**: Nueva sección "Árbol de Categorías" en la página de gestión de categorías (`CategoriasPage`)
- **Visualización**: Mostrar la jerarquía como un árbol expandible con indentación visual y conectores
- **UX**: Expandir/colapsar ramas, hacer clic para editar directamente desde el árbol
- **Indicador de estado**: Mostrar badges de activo/inactivo en cada nodo del árbol
- **Backend**: Nuevo endpoint GET `/api/v1/categorias/tree` que ya existe y retorna la estructura jerárquica completa

## Capabilities

### New Capabilities

- `categoria-tree-visual`: Visualización interactiva del árbol de categorías con expand/collapse, indentación visual, y acciones directas (editar, crear subcategoría)

### Modified Capabilities

- Ninguna (el endpoint `/categorias/tree` ya existe, solo se consume en frontend)

## Impact

- **Frontend**: Se modifica `CategoriasPage.tsx` para agregar sección de árbol
- **Componentes**: Nuevo componente `CategoriaTree.tsx` para el árbol visual
- **API**: No requiere cambios (endpoint ya existe)
- **Estilos**: Agregar estilos para el árbol (líneas de conexión, indentación, iconos expand/collapse)