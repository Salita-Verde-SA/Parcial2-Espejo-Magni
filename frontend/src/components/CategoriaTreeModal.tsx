// ─── components/CategoriaTreeModal.tsx ───────────────────────────────────
// Modal que muestra el árbol jerárquico completo de categorías.
// Diseño horizontal profesional con colores de la app.

import { useState, useEffect, useCallback } from 'react'
import type { CategoriaTree } from '../types'

interface Props {
  categoria: CategoriaTree | null
  allCategorias: CategoriaTree[]
  onClose: () => void
}

// ─── Tipos para el árbol procesado ────────────────────────────────────────
interface ProcessedNode {
  id: number
  nombre: string
  isSelected: boolean
  children: ProcessedNode[]
}

interface TreeNodeProps {
  node: ProcessedNode
  selectedId: number
  expandedIds: Set<number>
  onToggle: (id: number) => void
}

/** Busca recursivamente un nodo por id dentro del árbol de categorías y lo retorna, o null si no existe. */
function findNode(nodes: CategoriaTree[], id: number): CategoriaTree | null {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.hijos?.length) {
      const found = findNode(node.hijos, id)
      if (found) return found
    }
  }
  return null
}

/** Recorre el árbol hacia arriba desde el nodo targetId hasta encontrar la raíz absoluta (nodo sin parent_id), con protección contra ciclos. */
function findAbsoluteRoot(nodes: CategoriaTree[], targetId: number): CategoriaTree | null {
  const target = findNode(nodes, targetId)
  if (!target) return null

  const visited = new Set<number>()

  let current: CategoriaTree | null = target
  while (current?.parent_id) {
    if (visited.has(current.id)) break
    visited.add(current.id)

    const parent = findNode(nodes, current.parent_id)
    if (parent) {
      current = parent
    } else {
      break
    }
  }
  return current
}

/** Transforma recursivamente un nodo CategoriaTree en un ProcessedNode marcando el nodo seleccionado. */
function processTree(node: CategoriaTree, selectedId: number): ProcessedNode {
  return {
    id: node.id,
    nombre: node.nombre,
    isSelected: node.id === selectedId,
    children: (node.hijos || []).map(child => processTree(child, selectedId)),
  }
}

/** Componente de nodo individual del árbol; renderiza el nombre de la categoría con botón de expandir/colapsar si tiene hijos y líneas conectoras visuales. */
function TreeNode({ node, selectedId, expandedIds, onToggle }: TreeNodeProps) {
  const hasChildren = node.children.length > 0
  const isExpanded = expandedIds.has(node.id)
  const isSelected = node.id === selectedId

  return (
    <div className="tree-node-group">
      {/* Nodo actual */}
      <div
        className={`tree-node ${isSelected ? 'tree-node--active' : ''} ${hasChildren ? 'tree-node--has-children' : ''}`}
      >
        {/* Botón expandir/colapsar */}
        {hasChildren && (
          <button
            className={`tree-toggle ${isExpanded ? 'tree-toggle--open' : ''}`}
            onClick={() => onToggle(node.id)}
            title={isExpanded ? 'Colapsar' : 'Expandir'}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d={isExpanded ? "M2 4L5 7L8 4" : "M4 2L7 5L4 8"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}

        {/* Indicador de estado (solo para nodos sin toggle) */}
        {!hasChildren && <span className="tree-dot"></span>}

        {/* Nombre */}
        <span className="tree-node-label">{node.nombre}</span>
      </div>

      {/* Hijos hacia la derecha con líneas individuales */}
      {hasChildren && isExpanded && (
        <div className="tree-children-wrapper">
          {/* Línea vertical desde el nodo padre */}
          <div className="tree-vertical-line"></div>

          {/* Contenedor de hijos en column */}
          <div className="tree-children">
            {node.children.map((child) => (
              <div key={child.id} className="tree-child-row">
                {/* Línea horizontal hacia el hijo */}
                <div className="tree-horizontal-line"></div>
                {/* Nodo hijo */}
                <TreeNode
                  node={child}
                  selectedId={selectedId}
                  expandedIds={expandedIds}
                  onToggle={onToggle}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/** Modal que muestra el árbol jerárquico completo de categorías partiendo desde la raíz absoluta de la categoría seleccionada, con nodos expandibles y la categoría activa resaltada. */
export default function CategoriaTreeModal({ categoria, allCategorias, onClose }: Props) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())

  /** Retorna el nodo raíz absoluto de la categoría actualmente seleccionada. */
  const getRootNode = useCallback((): CategoriaTree | null => {
    if (!categoria) return null
    return findAbsoluteRoot(allCategorias, categoria.id)
  }, [categoria, allCategorias])

  /** Agrega o quita el id del nodo del conjunto de ids expandidos al hacer clic en el botón de toggle. */
  const handleToggle = useCallback((id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  /** Al cambiar la categoría seleccionada, expande automáticamente todos los nodos en el camino desde la raíz hasta ella. */
  useEffect(() => {
    if (!categoria) return

    const idsToExpand = new Set<number>()
    const visited = new Set<number>()

    function collectPathToNode(node: CategoriaTree, targetId: number): boolean {
      if (visited.has(node.id)) return false
      visited.add(node.id)

      if (node.id === targetId) return true
      if (node.hijos) {
        for (const child of node.hijos) {
          if (collectPathToNode(child, targetId)) {
            idsToExpand.add(node.id)
            return true
          }
        }
      }
      return false
    }

    const rootNode = getRootNode()
    if (rootNode) {
      collectPathToNode(rootNode, categoria.id)
    }

    setExpandedIds(idsToExpand)
  }, [categoria, getRootNode])

  if (!categoria) return null

  const rootNode = getRootNode()
  if (!rootNode) {
    return (
      <div className="tree-modal-overlay" onClick={onClose}>
        <div className="tree-modal" onClick={e => e.stopPropagation()}>
          <div className="tree-modal-header">
            <h2>Error</h2>
            <p>No se encontró la estructura de categorías</p>
          </div>
          <div className="tree-modal-footer">
            <button className="btn btn-ghost" onClick={onClose}>Cerrar</button>
          </div>
        </div>
      </div>
    )
  }

  const processedRoot = processTree(rootNode, categoria.id)

  return (
    <div className="tree-modal-overlay" onClick={onClose}>
      <div className="tree-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="tree-modal-header">
          <div className="tree-header-info">
            <div className="tree-header-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v18M5 8l7-5 7 5M5 16l7 5 7-5"/>
              </svg>
            </div>
            <div>
              <h2>Jerarquia de Categorias</h2>
              <p>Vista completa del arbol</p>
            </div>
          </div>
          <button className="tree-close-btn" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Leyenda */}
        <div className="tree-legend">
          <span className="tree-legend-item">
            <span className="tree-legend-dot tree-legend-dot--active"></span>
            Categoria seleccionada
          </span>
          <span className="tree-legend-sep">|</span>
          <span className="tree-legend-item">Click en el icono para expandir</span>
        </div>

        {/* Árbol */}
        <div className="tree-body">
          <div className="tree-container">
            <TreeNode
              node={processedRoot}
              selectedId={categoria.id}
              expandedIds={expandedIds}
              onToggle={handleToggle}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="tree-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cerrar</button>
        </div>
      </div>

      <style>{`
        /* ─── Animaciones ─── */
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        @keyframes nodeSlideIn {
          from { opacity: 0; transform: translateX(-12px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes connectorGrow {
          from { width: 0; opacity: 0; }
          to { width: 28px; opacity: 1; }
        }

        /* ─── Overlay ─── */
        .tree-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 24px;
          animation: modalFadeIn 0.2s ease-out;
        }

        /* ─── Modal ─── */
        .tree-modal {
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
          width: 100%;
          max-width: 900px;
          max-height: 75vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        /* ─── Header ─── */
        .tree-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid #e5e7eb;
          background: #fafafa;
        }

        .tree-header-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .tree-header-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #4b5563;
        }

        .tree-modal-header h2 {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
          line-height: 1.3;
        }

        .tree-modal-header p {
          font-size: 12px;
          color: #6b7280;
          margin: 2px 0 0;
        }

        .tree-close-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          background: transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9ca3af;
          transition: all 0.15s;
        }

        .tree-close-btn:hover {
          background: #fee2e2;
          color: #dc2626;
        }

        /* ─── Leyenda ─── */
        .tree-legend {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: #f9fafb;
          font-size: 11px;
          color: #6b7280;
          border-bottom: 1px solid #e5e7eb;
        }

        .tree-legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .tree-legend-sep {
          color: #d1d5db;
        }

        .tree-legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #d1d5db;
        }

        .tree-legend-dot--active {
          background: #10b981;
        }

        /* ─── Body ─── */
        .tree-body {
          flex: 1;
          overflow: auto;
          padding: 24px;
          background: #fafafa;
        }

        .tree-container {
          display: flex;
          align-items: center;
        }

        /* ─── Grupo de nodo ─── */
        .tree-node-group {
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }

        /* ─── Nodo ─── */
        .tree-node {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          transition: all 0.15s ease;
          animation: nodeSlideIn 0.2s ease-out;
          flex-shrink: 0;
        }

        .tree-node:hover {
          border-color: #d1d5db;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .tree-node--active {
          background: #ecfdf5;
          border-color: #10b981;
        }

        .tree-node--active:hover {
          border-color: #059669;
        }

        /* ─── Toggle ─── */
        .tree-toggle {
          width: 18px;
          height: 18px;
          border-radius: 4px;
          border: 1px solid #d1d5db;
          background: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
          color: #6b7280;
          padding: 0;
          flex-shrink: 0;
        }

        .tree-toggle:hover {
          border-color: #10b981;
          color: #10b981;
          background: #ecfdf5;
        }

        .tree-toggle--open {
          background: #ecfdf5;
          border-color: #10b981;
          color: #10b981;
        }

        /* ─── Dot para hojas ─── */
        .tree-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #d1d5db;
          flex-shrink: 0;
        }

        /* ─── Label ─── */
        .tree-node-label {
          font-size: 12px;
          font-weight: 500;
          color: #374151;
          white-space: nowrap;
        }

        .tree-node--active .tree-node-label {
          color: #065f46;
          font-weight: 600;
        }

        /* ─── Wrapper de hijos ─── */
        .tree-children-wrapper {
          display: flex;
          align-items: flex-start;
          padding-left: 4px;
        }

        /* ─── Línea vertical desde el nodo padre ─── */
        .tree-vertical-line {
          width: 2px;
          height: 20px;
          background: #d1d5db;
          margin-top: -10px;
        }

        /* ─── Hijos en columna ─── */
        .tree-children {
          display: flex;
          flex-direction: column;
          gap: 0;
          margin-left: -1px;
        }

        /* ─── Fila de cada hijo ─── */
        .tree-child-row {
          display: flex;
          align-items: center;
          height: 100%;
        }

        /* ─── Línea horizontal hacia el hijo ─── */
        .tree-horizontal-line {
          width: 24px;
          height: 2px;
          background: #d1d5db;
          flex-shrink: 0;
        }

        /* ─── Footer ─── */
        .tree-footer {
          padding: 14px 20px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          justify-content: flex-end;
          background: #fafafa;
        }

        /* ─── Responsive ─── */
        @media (max-width: 700px) {
          .tree-modal {
            max-width: 95vw;
          }

          .tree-body {
            padding: 16px 12px;
          }

          .tree-node {
            padding: 6px 10px;
          }

          .tree-node-label {
            font-size: 11px;
            max-width: 80px;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .tree-horizontal-line {
            width: 14px;
          }
        }
      `}</style>
    </div>
  )
}
