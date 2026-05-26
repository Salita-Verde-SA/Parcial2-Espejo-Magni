## Context

El proyecto ya tiene un modelo de categorías jerárquico con `parent_id` que permite crear árboles de cualquier profundidad. El backend ya expone un endpoint `/categorias/tree` que retorna la estructura completa con hijos anidados. La página `CategoriasPage` solo muestra la categoría padre inmediata en una columna de texto plano.

**Estado actual:**
```
Categorías del sistema:
├── Bebidas (padre: null)
│   └── Con Alcohol (padre: Bebidas)
│       ├── Vino (padre: Con Alcohol)
│       └── Cerveza (padre: Con Alcohol)
├── Sin Alcohol (padre: Bebidas)
└── Comida (padre: null)
```

**Lo que se ve hoy en la tabla:**
| ID | Nombre | Categoría padre |
|----|--------|-----------------|
| 1 | Bebidas | — |
| 2 | Con Alcohol | Con Alcohol |
| 3 | Vino | Con Alcohol |

❌ El admin no ve que Vino pertenece a "Bebidas > Con Alcohol"

## Goals / Non-Goals

**Goals:**
- Visualizar la jerarquía completa de categorías de forma clara e intuitiva
- Permitir expandir/colapsar ramas del árbol
- Mostrar estado (activo/inactivo) de cada nodo
- Permitir editar una categoría directamente desde el árbol
- Mantener consistencia visual con el diseño existente del admin

**Non-Goals:**
- Modificar el backend (el endpoint ya existe y funciona)
- Implementar drag-and-drop para reordenar (sería otro change)
- Soportar múltiples padres por categoría (el modelo no lo soporta)
- Agregar funcionalidades de exportar o imprimir el árbol

## Decisions

### Decisión 1: Implementación pura en React vs librería de árbol

**Elección:** Implementación pura (sin librería adicional)

**Rationale:**
- El proyecto ya tiene suficientes dependencias; agregar una librería de árbol solo para esto es overkill
- Un componente recursivo simple cubre el 90% de las necesidades
- Control total sobre el estilo visual
- No introduce dependencias con posibles breaking changes

**Alternativas consideradas:**
- `react-arborist`: Funcionalidades avanzadas (drag-drop, search) pero overkill
- `primereact` TreeTable: Componente muy robusto pero demasiado grande para este uso

### Decisión 2: Estructura visual del árbol

**Elección:** Lista con indentación + iconos expand/collapse + líneas de conexión sutiles

```
📁 Bebidas [Activo]
├── 📁 Con Alcohol [Activo]
│   ├── 🍷 Vino [Activo]
│   └── 🍺 Cerveza [Activo]
├── 📁 Sin Alcohol [Activo]
└── 📁 Comida [Inactivo]
```

**Rationale:**
- Familiar para usuarios de sistemas de archivos (Windows Explorer, macOS Finder)
- Escala bien con muchos niveles de profundidad
- Las líneas de conexión ayudan a seguir visualmente la jerarquía
- Los iconos 📁/📄 diferencian nodos con/sin hijos

### Decisión 3: Posicionamiento en la página

**Elección:** Nueva sección colapsable "Árbol de Categorías" arriba de la tabla existente

**Rationale:**
- Mantiene la funcionalidad existente (tabla con filtros y paginación)
- El admin puede elegir ver el árbol O la tabla
- No rompe el flujo de trabajo actual

### Decisión 4: Conexión con acciones

**Elección:** Click en el nombre abre el modal de edición existente

**Rationale:**
- Reutiliza código existente (`CategoriaModal`)
- El modal ya tiene la lógica de guardado y validación
- Solo hay que pasar la categoría seleccionada al modal

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Árbol muy profundo (10+ niveles) hace scroll horizontal | Limitar indentación máxima visual, usar scroll interno en contenedor |
| Muchas categorías (100+) puede hacer el árbol lento | Virtualizar solo si es necesario (usar CSS overflow) |
| El endpoint `/tree` trae todas las categorías siempre | El backend ya filtra `deleted_at IS NULL` por defecto |
| Ruido visual si todas las categorías son raíz | Agrupar visualmente las raíces sin padre |

## Component Design

```
┌─────────────────────────────────────────────────────────────┐
│ CategoriaTree.tsx                                          │
├─────────────────────────────────────────────────────────────┤
│ Props:                                                      │
│   - categorias: CategoriaTree[] (del endpoint /tree)        │
│   - onEdit: (categoria: Categoria) => void                  │
│                                                             │
│ Internal state:                                             │
│   - expandedIds: Set<number> (qué nodos están expandidos)  │
│                                                             │
│ Render:                                                     │
│   - CategoriaTreeNode recursivo                             │
│     └── CategoriaNode                                       │
│         ├── ExpandToggle (si tiene hijos)                   │
│         ├── IndentLines (líneas de conexión visuales)       │
│         ├── Icon (📁 o 📄 según tenga hijos)               │
│         ├── Name                                            │
│         └── Badge (estado)                                  │
└─────────────────────────────────────────────────────────────┘
```

## Open Questions

1. **¿Las raíces sin padre deberían agruparse?** Hoy están todas al mismo nivel. Podríamos agregar un label "Categorías principales" si hay más de una raíz.

2. **¿Expandir por defecto?** ¿Todos los nodos expandidos o solo los primeros 2 niveles? Mi recomendación: expandir primero 2 niveles por defecto, el resto collapsed.

3. **¿Agregar contador de productos por categoría?** Sería útil para ver cuál es la categoría más usada. Pero esto requiere modificar el endpoint o hacer otra запрос - por ahora queda fuera.

4. **¿Botón "Crear subcategoría" en cada nodo?** Simplificaría crear categorías anidadas. Pero requiere pasar `parent_id` al modal - implementable en el futuro.