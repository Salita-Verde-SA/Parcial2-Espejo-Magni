import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchCategoriasAll, deleteCategoria, activateCategoria } from '../api/categorias'
import { useAuthStore } from '../stores/authStore'
import CategoriaModal from '../features/admin/components/CategoriaModal'
import ConfirmDialog from '../features/ui/components/ConfirmDialog'
import type { Categoria, CategoriaTree } from '../types'

export default function CategoriasPage() {
  const isAdmin = useAuthStore((s) => s.isAdmin())
  const qc = useQueryClient()

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Categoria | null>(null)
  const [initialParentId, setInitialParentId] = useState<number | null>(null)
  
  const [deleteTarget, setDeleteTarget] = useState<Categoria | null>(null)
  
  // Guardamos qué ramas están expandidas
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())

  const { data: allCategorias = [], isLoading, isError } = useQuery({
    queryKey: ['categorias-all'],
    queryFn: fetchCategoriasAll,
  })

  const treeData = useMemo(() => {
    const map = new Map<number, CategoriaTree>()
    const roots: CategoriaTree[] = []

    // Asegurar ordenamiento consistente (ej. por ID)
    const sorted = [...allCategorias].sort((a, b) => a.id - b.id)

    sorted.forEach(cat => {
      map.set(cat.id, { ...cat, hijos: [] })
    })

    sorted.forEach(cat => {
      if (cat.parent_id !== null) {
        const parent = map.get(cat.parent_id)
        if (parent) {
          parent.hijos.push(map.get(cat.id)!)
        } else {
          roots.push(map.get(cat.id)!)
        }
      } else {
        roots.push(map.get(cat.id)!)
      }
    })

    return roots
  }, [allCategorias])

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCategoria(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categorias-all'] })
      qc.invalidateQueries({ queryKey: ['categorias-tree'] })
      setDeleteTarget(null)
    },
  })

  const activateMutation = useMutation({
    mutationFn: (id: number) => activateCategoria(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categorias-all'] })
      qc.invalidateQueries({ queryKey: ['categorias-tree'] })
    },
  })

  function handleEdit(cat: Categoria) {
    setEditTarget(cat)
    setInitialParentId(null)
    setModalOpen(true)
  }

  function handleNew(parentId: number | null = null) {
    setEditTarget(null)
    setInitialParentId(parentId)
    setModalOpen(true)
    
    // Si agregamos un hijo, auto-expandimos al padre
    if (parentId !== null) {
      setExpandedIds(prev => {
        const next = new Set(prev)
        next.add(parentId)
        return next
      })
    }
  }

  function handleModalClose() {
    setModalOpen(false)
    setEditTarget(null)
    setInitialParentId(null)
  }

  function toggleExpand(id: number) {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function expandAll() {
    const allIds = new Set(allCategorias.filter(c => c.parent_id === null || allCategorias.some(p => p.parent_id === c.id)).map(c => c.id))
    setExpandedIds(allIds)
  }

  function collapseAll() {
    setExpandedIds(new Set())
  }

  // Render recursivo del árbol
  function renderTree(nodes: CategoriaTree[], depth = 0) {
    return nodes.map(node => {
      const hasChildren = node.hijos && node.hijos.length > 0
      const isExpanded = expandedIds.has(node.id)
      const isInactive = !!node.deleted_at

      return (
        <div key={node.id}>
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              padding: '12px 16px',
              borderBottom: '1px solid var(--border)',
              backgroundColor: isInactive ? 'rgba(220, 53, 69, 0.04)' : 'transparent',
              opacity: isInactive ? 0.8 : 1,
              paddingLeft: `${16 + depth * 40}px`,
              transition: 'all 0.2s ease',
            }}
            className="tree-row hover:bg-gray-50"
          >
            {/* Toggle Arrow */}
            <div style={{ width: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {hasChildren ? (
                <button 
                  onClick={() => toggleExpand(node.id)}
                  style={{ 
                    background: 'none', border: 'none', cursor: 'pointer', padding: 4, 
                    display: 'flex', alignItems: 'center', color: 'var(--text-muted)',
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              ) : (
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--border)', display: 'inline-block' }} />
              )}
            </div>

            {/* Icono de Carpeta / Archivo (opcional para estilo premium) */}
            <div style={{ marginRight: 12, color: hasChildren ? '#fbbf24' : '#9ca3af', display: 'flex', alignItems: 'center' }}>
              {hasChildren ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              )}
            </div>

            {/* Name and Info */}
            <div style={{ flex: 1, minWidth: 0, paddingRight: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <strong style={{ fontSize: depth === 0 ? 15 : 14, color: '#111827', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {node.nombre}
                </strong>
                {isInactive && <span className="badge badge-danger">Inactivo</span>}
                {node.in_use && <span className="badge badge-warning">En uso</span>}
              </div>
              {node.descripcion && (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {node.descripcion}
                </div>
              )}
            </div>

            {/* Actions */}
            {isAdmin && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button 
                  className="btn btn-ghost btn-sm" 
                  onClick={() => handleNew(node.id)}
                  title="Añadir subcategoría"
                  style={{ padding: '6px 12px', fontSize: 12, fontWeight: 600 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4, display: 'inline' }}>
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Hija
                </button>
                {isInactive ? (
                  <button className="btn btn-success btn-sm" onClick={() => activateMutation.mutate(node.id)}>Activar</button>
                ) : node.in_use ? (
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', padding: '6px 12px', fontWeight: 500 }}>Bloqueado</span>
                ) : (
                  <>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(node)}>Editar</button>
                    <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(node)}>Baja</button>
                  </>
                )}
              </div>
            )}
          </div>
          
          {/* Render Children if expanded */}
          {hasChildren && isExpanded && (
            <div style={{ animation: 'slideDown 0.2s ease-out' }}>
              {renderTree(node.hijos, depth + 1)}
            </div>
          )}
        </div>
      )
    })
  }

  return (
    <>
      <header className="topbar">
        <span className="topbar-title">Gestión de Categorías</span>
      </header>

      <div className="page-wrapper" style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span className="card-title" style={{ margin: 0 }}>Estructura de Categorías</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost btn-sm" onClick={expandAll} style={{ fontSize: 12 }}>Expandir Todo</button>
                <button className="btn btn-ghost btn-sm" onClick={collapseAll} style={{ fontSize: 12 }}>Colapsar Todo</button>
              </div>
            </div>
            {isAdmin && (
              <button className="btn btn-primary" onClick={() => handleNew(null)}>
                + Nueva Categoría Raíz
              </button>
            )}
          </div>

          <div style={{ borderTop: '1px solid var(--border)', background: 'white', borderRadius: '0 0 12px 12px', overflow: 'hidden' }}>
            {isLoading ? (
              <div style={{ padding: 48, textAlign: 'center' }}>
                <span className="spinner spinner-dark" /> Cargando árbol...
              </div>
            ) : isError ? (
              <div style={{ padding: 48, textAlign: 'center', color: 'var(--danger)' }}>
                Error al cargar los datos. Intentá de nuevo.
              </div>
            ) : treeData.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                No hay categorías registradas.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {renderTree(treeData)}
              </div>
            )}
          </div>
        </div>
      </div>

      {modalOpen && (
        <CategoriaModal 
          categoria={editTarget} 
          initialParentId={initialParentId} 
          onClose={handleModalClose} 
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          message={
            <>
              ¿Confirmás la baja lógica de la categoría <strong>"{deleteTarget.nombre}"</strong>?
              <br />
              <span style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
                El registro quedará oculto pero no se eliminará de la base de datos.
              </span>
            </>
          }
          confirmLabel="Dar de baja"
          loading={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .tree-row:hover {
          background-color: #f9fafb !important;
        }
      `}</style>
    </>
  )
}