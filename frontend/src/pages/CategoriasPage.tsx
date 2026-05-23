// ─── pages/CategoriasPage.tsx ────────────────────────────────────────────────
// Página de gestión de Categorías. Solo accesible con rol ADMIN.
// Permite: ver, filtrar, paginar, crear, editar y dar de baja categorías.

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchCategoriasAll, fetchCategoriasTree, deleteCategoria, activateCategoria } from '../api/categorias'
import { useAuthStore } from '../stores/authStore'
import CategoriaTreeModal from '../components/CategoriaTreeModal'
import CategoriaModal from '../components/CategoriaModal'
import ConfirmDialog from '../components/ConfirmDialog'
import type { Categoria, CategoriaTree } from '../types'

// Filtros para categorías (solo nombre)
interface FiltrosCategorias {
  nombre: string
  page: number
  page_size: number
}

const DEFAULT_FILTROS: FiltrosCategorias = {
  nombre: '',
  page: 1,
  page_size: 10,
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export default function CategoriasPage() {
  const isAdmin = useAuthStore((s) => s.isAdmin())
  const qc = useQueryClient()

  const [filtros, setFiltros] = useState<FiltrosCategorias>(DEFAULT_FILTROS)
  const [filtrosDraft, setFiltrosDraft] = useState<FiltrosCategorias>(DEFAULT_FILTROS)

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Categoria | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Categoria | null>(null)
  const [treeModalOpen, setTreeModalOpen] = useState(false)
  const [selectedCategoria, setSelectedCategoria] = useState<CategoriaTree | null>(null)

  // Fetch categorias - including deleted ones for admin management
  const { data: allCategorias = [], isLoading, isError } = useQuery({
    queryKey: ['categorias-all'],
    queryFn: () => fetchCategoriasAll(),
  })

  // Fetch tree data for the tree modal
  const { data: treeData = [] } = useQuery({
    queryKey: ['categorias-tree'],
    queryFn: () => fetchCategoriasTree(),
  })

  // Filter locally
  const filteredCategorias = allCategorias.filter(cat => {
    if (filtros.nombre && !cat.nombre.toLowerCase().includes(filtros.nombre.toLowerCase())) {
      return false
    }
    return true
  })

  // Ordenar: activos primero, inactivos al final
  const sortedCategorias = [...filteredCategorias].sort((a, b) => {
    if (a.deleted_at && !b.deleted_at) return 1
    if (!a.deleted_at && b.deleted_at) return -1
    return a.id - b.id
  })

  // Pagination
  const total = sortedCategorias.length
  const totalPages = Math.ceil(total / filtros.page_size)
  const start = (filtros.page - 1) * filtros.page_size
  const end = start + filtros.page_size
  const paginatedCategorias = sortedCategorias.slice(start, end)

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCategoria(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categorias-all'] })
      qc.invalidateQueries({ queryKey: ['categorias-tree'] })
      setDeleteTarget(null)
    },
  })

  // Activate mutation
  const activateMutation = useMutation({
    mutationFn: (id: number) => activateCategoria(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categorias-all'] })
      qc.invalidateQueries({ queryKey: ['categorias-tree'] })
    },
  })

  function handleSearch() {
    setFiltros({ ...filtrosDraft, page: 1 })
  }

  function handleReset() {
    setFiltrosDraft(DEFAULT_FILTROS)
    setFiltros(DEFAULT_FILTROS)
  }

  function handlePage(p: number) {
    setFiltros((prev) => ({ ...prev, page: p }))
  }

  function handleEdit(cat: Categoria) {
    setEditTarget(cat)
    setModalOpen(true)
  }

  function handleNew() {
    setEditTarget(null)
    setModalOpen(true)
  }

  function handleModalClose() {
    setModalOpen(false)
    setEditTarget(null)
  }

  function handleOpenTreeModal(cat: Categoria) {
    // Encontrar la categoría en treeData para pasarla con sus hijos
    const treeNode = findInTree(treeData, cat.id)
    // Solo abrir si tiene relaciones (ya validado antes con hasTreeRelations)
    if (treeNode) {
      setSelectedCategoria(treeNode)
      setTreeModalOpen(true)
    }
  }

  function handleCloseTreeModal() {
    setTreeModalOpen(false)
    setSelectedCategoria(null)
  }

  // Función para encontrar un nodo en el árbol
  function findInTree(nodes: CategoriaTree[], id: number): CategoriaTree | null {
    for (const node of nodes) {
      if (node.id === id) return node
      if (node.hijos && node.hijos.length > 0) {
        const found = findInTree(node.hijos, id)
        if (found) return found
      }
    }
    return null
  }

  // Verificar si una categoría tiene relaciones (padre o hijos)
  function hasTreeRelations(cat: Categoria): boolean {
    // Tiene padre
    if (cat.parent_id) return true
    
    // Tiene hijos (buscar en treeData O en allCategorias)
    const treeNode = findInTree(treeData, cat.id)
    if (treeNode && treeNode.hijos && treeNode.hijos.length > 0) return true
    
    // Verificar si alguna categoría tiene a esta como padre (usando lista plana)
    return allCategorias.some(c => c.parent_id === cat.id)
  }

  function renderPageButtons() {
    const buttons: React.ReactNode[] = []
    const range = 2
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= filtros.page - range && i <= filtros.page + range)) {
        buttons.push(
          <button key={i} className={`page-btn${i === filtros.page ? ' active' : ''}`} onClick={() => handlePage(i)}>
            {i}
          </button>
        )
      } else if (i === filtros.page - range - 1 || i === filtros.page + range + 1) {
        buttons.push(<span key={`ellipsis-${i}`} style={{ padding: '0 4px', color: 'var(--text-muted)' }}>…</span>)
      }
    }
    return buttons
  }

  const inicio = total > 0 ? start + 1 : 0
  const fin = Math.min(end, total)

  // Build parent map for display
  const parentMap = new Map<number | null, string>()
  parentMap.set(null, '—')
  allCategorias.forEach(cat => parentMap.set(cat.id, cat.nombre))

  return (
    <>
      <header className="topbar">
        <span className="topbar-title">Gestión de Categorías</span>
      </header>

      <div className="page-wrapper">
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              Categorías registradas
              {total > 0 && (
                <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 400, color: 'var(--text-muted)' }}>
                  ({total} total)
                </span>
              )}
            </span>
            {isAdmin && (
              <button className="btn btn-primary" onClick={handleNew}>
                Nueva categoría
              </button>
            )}
          </div>

          <div className="filtros-bar">
            <div className="filtro-group">
              <label className="filtro-label">Nombre</label>
              <input
                className="filtro-input"
                type="text"
                placeholder="Buscar por nombre..."
                value={filtrosDraft.nombre}
                onChange={(e) => setFiltrosDraft({ ...filtrosDraft, nombre: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            <div className="filtro-group">
              <label className="filtro-label">Resultados / pág.</label>
              <select
                className="filtro-select"
                style={{ minWidth: 80 }}
                value={filtrosDraft.page_size}
                onChange={(e) => setFiltrosDraft({ ...filtrosDraft, page_size: Number(e.target.value) })}
              >
                {[5, 10, 25, 50].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <button className="btn btn-primary" onClick={handleSearch}>Buscar</button>
              <button className="btn btn-ghost" onClick={handleReset}>Limpiar</button>
            </div>
          </div>

          {/* Tabla de categorías */}
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 60 }}>ID</th>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th style={{ width: 150 }}>Árbol de categorías</th>
                  <th style={{ width: 100 }}>Estado</th>
                  <th style={{ width: 80 }}>En uso</th>
                  <th style={{ width: 110 }}>Alta</th>
                  {isAdmin && <th style={{ width: 130 }}>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr className="loading-row">
                    <td colSpan={isAdmin ? 8 : 7}>
                      <span className="spinner spinner-dark" /> Cargando...
                    </td>
                  </tr>
                )}
                {isError && (
                  <tr>
                    <td colSpan={isAdmin ? 8 : 7} style={{ textAlign: 'center', padding: 24, color: 'var(--danger)' }}>
                      Error al cargar los datos. Intentá de nuevo.
                    </td>
                  </tr>
                )}
                {!isLoading && !isError && paginatedCategorias.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 8 : 7}>
                      <div className="empty-state">
                        <h3>Sin resultados</h3>
                        <p>No se encontraron categorías con los filtros aplicados.</p>
                      </div>
                    </td>
                  </tr>
                )}
                {!isLoading && !isError && paginatedCategorias.map((cat) => (
                  <tr 
                    key={cat.id} 
                    style={{ 
                      backgroundColor: cat.deleted_at ? 'rgba(220, 53, 69, 0.1)' : undefined,
                      opacity: cat.deleted_at ? 0.6 : 1,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <td className="col-id">#{cat.id}</td>
                    <td><strong>{cat.nombre}</strong></td>
                    <td className="col-desc" title={cat.descripcion ?? ''}>
                      {cat.descripcion || <span style={{ color: 'var(--border)' }}>—</span>}
                    </td>
                    <td>
                      {hasTreeRelations(cat) && (
                        <button 
                          className="btn btn-ghost btn-sm tree-view-btn"
                          onClick={() => handleOpenTreeModal(cat)}
                        >
                          Ver arbol
                        </button>
                      )}
                    </td>
                    <td>
                      {cat.deleted_at ? (
                        <span className="badge badge-danger">Inactivo</span>
                      ) : (
                        <span className="badge badge-success">Activo</span>
                      )}
                    </td>
                    <td>
                      {cat.in_use && (
                        <span className="badge badge-warning">En uso</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {formatFecha(cat.created_at)}
                    </td>
                    {isAdmin && (
                      <td>
                        <div className="td-actions">
                          {cat.deleted_at ? (
                            <button className="btn btn-success btn-sm" onClick={() => activateMutation.mutate(cat.id)}>Activar</button>
                          ) : cat.in_use ? (
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Bloqueado</span>
                          ) : (
                            <>
                              <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(cat)}>Editar</button>
                              <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(cat)}>Baja</button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {total > 0 && (
            <div className="pagination">
              <span className="pagination-info">
                Mostrando {inicio}–{fin} de {total} categorías
              </span>
              <div className="pagination-controls">
                <button className="page-btn" disabled={filtros.page === 1} onClick={() => handlePage(1)} title="Primera página">«</button>
                <button className="page-btn" disabled={filtros.page === 1} onClick={() => handlePage(filtros.page - 1)} title="Anterior">‹</button>
                {renderPageButtons()}
                <button className="page-btn" disabled={filtros.page === totalPages} onClick={() => handlePage(filtros.page + 1)} title="Siguiente">›</button>
                <button className="page-btn" disabled={filtros.page === totalPages} onClick={() => handlePage(totalPages)} title="Última página">»</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {modalOpen && <CategoriaModal categoria={editTarget} onClose={handleModalClose} />}

      {treeModalOpen && selectedCategoria && (
        <CategoriaTreeModal 
          categoria={selectedCategoria} 
          allCategorias={treeData} 
          onClose={handleCloseTreeModal} 
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
        .tree-view-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          font-size: 11px;
          font-weight: 500;
          background: transparent;
          border: 1px solid #e5e7eb;
          color: #4b5563;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s;
        }
        
        .tree-view-btn:hover {
          background: #f3f4f6;
          border-color: #d1d5db;
          color: #1f2937;
        }
      `}</style>
    </>
  )
}