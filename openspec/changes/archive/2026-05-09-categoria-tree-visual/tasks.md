## 1. Crear componente CategoriaTree

- [x] 1.1 Crear archivo `frontend/src/components/CategoriaTree.tsx`
- [x] 1.2 Definir interfaz `CategoriaTreeNode` para el tipo del endpoint `/tree`
- [x] 1.3 Crear estado `expandedIds: Set<number>` con useState
- [x] 1.4 Implementar función `toggleExpand(id: number)` para expandir/colapsar
- [x] 1.5 Implementar función `isExpanded(id: number)` para verificar estado

## 2. Implementar nodo del árbol (CategoriaNode)

- [x] 2.1 Crear componente interno `CategoriaNode` para renderizar cada nodo
- [x] 2.2 Implementar indentación visual (24px × nivel de profundidad)
- [x] 2.3 Mostrar icono 📁 para nodos con hijos, 📄 para hojas
- [x] 2.4 Mostrar icono ▶/▼ para expandir/colapsar (solo si tiene hijos)
- [x] 2.5 Renderizar nombre de la categoría con badge de estado (activo/inactivo)
- [x] 2.6 Manejar click en nombre para llamar `onEdit(categoria)`

## 3. Implementar recursión del árbol

- [x] 3.1 Renderizar recursivamente los hijos cuando el nodo está expandido
- [x] 3.2 Pasar `depth` como prop para calcular indentación
- [x] 3.3 Detener recursión en nodos hoja (sin `children`)

## 4. Agregar estilos CSS

- [x] 4.1 Crear estilos para `.categoria-tree` (contenedor principal)
- [x] 4.2 Crear estilos para `.tree-node` (cada nodo individual)
- [x] 4.3 Crear estilos para `.tree-indent` (espaciado por nivel)
- [x] 4.4 Crear estilos para `.tree-connector` (líneas verticales)
- [x] 4.5 Crear estilos para `.tree-toggle` (iconos expand/collapse)
- [x] 4.6 Agregar estilos en `index.css` o crear archivo CSS 模块

## 5. Integrar con CategoriasPage

- [x] 5.1 Importar `CategoriaTree` en `CategoriasPage.tsx`
- [x] 5.2 Crear query para obtener datos del endpoint `/categorias/tree`
- [x] 5.3 Agregar estado `showTree` para alternar entre vista árbol y tabla
- [x] 5.4 Crear toggle button para cambiar entre vista árbol/tabla
- [x] 5.5 Pasar `onEdit` que llame a `handleEdit` existente
- [x] 5.6 Manejar estados de carga y error

## 6. Tipos TypeScript

- [x] 6.1 Definir/verificar tipo `CategoriaTreeNode` en `types.ts`
- [x] 6.2 Asegurar que coincida con la respuesta del endpoint `/categorias/tree`

## 7. Testing manual

- [ ] 7.1 Verificar que el árbol renderiza todas las categorías
- [ ] 7.2 Verificar que expand/collapse funciona correctamente
- [ ] 7.3 Verificar que al hacer click en nombre se abre el modal de edición
- [ ] 7.4 Verificar que los badges de estado muestran correctamente
- [ ] 7.5 Verificar que la indentación visual es correcta
- [ ] 7.6 Verificar con datos de prueba (Bebidas > Con Alcohol > Vino, Cerveza)