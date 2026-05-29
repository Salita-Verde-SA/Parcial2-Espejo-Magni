import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchIngredientesAll,
  deleteIngrediente,
  exportExcel,
  activateIngrediente,
} from '../api/ingredientes'
import { useAuthStore } from '../stores/authStore'
import IngredienteModal from '../features/admin/components/IngredienteModal'
import ConfirmDialog from '../features/ui/components/ConfirmDialog'
import type { Ingrediente, FiltrosIngrediente } from '../types'

const DEFAULT_FILTROS: FiltrosIngrediente = {
  nombre: '',
  es_alergeno: '',
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

export default function IngredientesPage() {
  const isAdmin = useAuthStore((s) => s.isAdmin())
  const isStock = useAuthStore((s) => s.hasRole('STOCK'))
  const qc = useQueryClient()

  const [filtros, setFiltros]             = useState<FiltrosIngrediente>(DEFAULT_FILTROS)
  const [filtrosDraft, setFiltrosDraft]   = useState<FiltrosIngrediente>(DEFAULT_FILTROS)

  const [modalOpen, setModalOpen]         = useState(false)
  const [editTarget, setEditTarget]       = useState<Ingrediente | null>(null)
  const [deleteTarget, setDeleteTarget]   = useState<Ingrediente | null>(null)
  const [exporting, setExporting]         = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['ingredientes', 'all'],
    queryFn: () => fetchIngredientesAll(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteIngrediente(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ingredientes'] })
      setDeleteTarget(null)
    },
  })

  const activateMutation = useMutation({
    mutationFn: (id: number) => activateIngrediente(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ingredientes'] })
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

  function handleEdit(ing: Ingrediente) {
    setEditTarget(ing)
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

  async function handleExport() {
    setExporting(true)
    try {
      await exportExcel()
    } finally {
      setExporting(false)
    }
  }

  const currentPage = filtros.page

  const filteredItems = data?.items
    ? data.items.filter((ing) => {
        if (filtros.nombre && !ing.nombre.toLowerCase().includes(filtros.nombre.toLowerCase())) {
          return false
        }
        return true
      })
    : []

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (a.deleted_at && !b.deleted_at) return 1
    if (!a.deleted_at && b.deleted_at) return -1
    return a.id - b.id
  })

  const totalItems = sortedItems.length
  const totalPages = Math.ceil(totalItems / filtros.page_size) || 1

  function renderPageButtons() {
    const buttons: React.ReactNode[] = []
    const range = 2

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - range && i <= currentPage + range)
      ) {
        buttons.push(
          <button
            key={i}
            className={`page-btn${i === currentPage ? ' active' : ''}`}
            onClick={() => handlePage(i)}
          >
            {i}
          </button>
        )
      } else if (
        i === currentPage - range - 1 ||
        i === currentPage + range + 1
      ) {
        buttons.push(
          <span key={`ellipsis-${i}`} style={{ padding: '0 4px', color: 'var(--text-muted)' }}>
            …
          </span>
        )
      }
    }
    return buttons
  }

  const inicio = totalItems > 0 ? (filtros.page - 1) * filtros.page_size + 1 : 0
  const fin = Math.min(filtros.page * filtros.page_size, totalItems)

  const start = (filtros.page - 1) * filtros.page_size
  const end = start + filtros.page_size
  const paginatedItems = sortedItems.slice(start, end)

  return (
    <>
      <header className="topbar">
        <span className="topbar-title">Gestión de Insumos</span>
      </header>

      <div className="page-wrapper">
        <div className="card">

          <div className="card-header">
            <span className="card-title">
              Insumos registrados
              {data && (
                <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 400, color: 'var(--text-muted)' }}>
                  ({data.total} total)
                </span>
              )}
            </span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                className="btn btn-success"
                onClick={handleExport}
                disabled={exporting}
              >
                {exporting ? <span className="spinner" /> : null} Exportar Excel
              </button>
              {isAdmin && (
                <button className="btn btn-primary" onClick={handleNew}>
                  Nuevo insumo
                </button>
              )}
            </div>
          </div>

          <div className="filtros-bar">
            <div className="filtro-group">
              <label className="filtro-label">Nombre</label>
              <input
                className="filtro-input"
                type="text"
                placeholder="Buscar por nombre..."
                value={filtrosDraft.nombre}
                onChange={(e) =>
                  setFiltrosDraft({ ...filtrosDraft, nombre: e.target.value })
                }
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            <div className="filtro-group">
              <label className="filtro-label">Alérgeno</label>
              <select
                className="filtro-select"
                value={filtrosDraft.es_alergeno}
                onChange={(e) =>
                  setFiltrosDraft({ ...filtrosDraft, es_alergeno: e.target.value })
                }
              >
                <option value="">Todos</option>
                <option value="true">Solo alérgenos</option>
                <option value="false">Sin alérgenos</option>
              </select>
            </div>

            <div className="filtro-group">
              <label className="filtro-label">Resultados / pág.</label>
              <select
                className="filtro-select"
                style={{ minWidth: 80 }}
                value={filtrosDraft.page_size}
                onChange={(e) =>
                  setFiltrosDraft({ ...filtrosDraft, page_size: Number(e.target.value) })
                }
              >
                {[5, 10, 25, 50].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <button className="btn btn-primary" onClick={handleSearch}>
                Buscar
              </button>
              <button className="btn btn-ghost" onClick={handleReset}>
                Limpiar
              </button>
            </div>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 60 }}>ID</th>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th style={{ width: 80 }}>Stock</th>
                  <th style={{ width: 90 }}>Costo</th>
                  <th style={{ width: 110 }}>Alérgeno</th>
                  <th style={{ width: 100 }}>Terminado</th>
                  <th style={{ width: 100 }}>Estado</th>
                  <th style={{ width: 110 }}>Alta</th>
                  {(isAdmin || isStock) && <th style={{ width: 130 }}>Acciones</th>}
                </tr>
              </thead>
              <tbody>

                {isLoading && (
                  <tr className="loading-row">
                    <td colSpan={(isAdmin || isStock) ? 8 : 7}>
                      <span className="spinner spinner-dark" /> Cargando...
                    </td>
                  </tr>
                )}

                {isError && (
                  <tr>
                    <td colSpan={(isAdmin || isStock) ? 8 : 7}
                      style={{ textAlign: 'center', padding: 24, color: 'var(--danger)' }}>
                      Error al cargar los datos. Intentá de nuevo.
                    </td>
                  </tr>
                )}

                {!isLoading && !isError && data?.items.length === 0 && (
                  <tr>
                    <td colSpan={(isAdmin || isStock) ? 8 : 7}>
                      <div className="empty-state">
                        <h3>Sin resultados</h3>
                        <p>No se encontraron insumos con los filtros aplicados.</p>
                      </div>
                    </td>
                  </tr>
                )}

                {!isLoading &&
                  paginatedItems.map((ing) => (
                    <tr 
                      key={ing.id} 
                      style={{ 
                        backgroundColor: ing.deleted_at ? 'rgba(220, 53, 69, 0.1)' : undefined,
                        opacity: ing.deleted_at ? 0.6 : 1,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <td className="col-id">#{ing.id}</td>
                      <td><strong>{ing.nombre}</strong></td>
                      <td className="col-desc" title={ing.descripcion ?? ''}>
                        {ing.descripcion || (
                          <span style={{ color: 'var(--border)' }}>—</span>
                        )}
                      </td>
                      <td>
                        <span style={{ 
                          fontWeight: ing.stock_cantidad > 0 ? 500 : 700,
                          color: ing.stock_cantidad === 0 ? 'var(--danger)' : 'var(--text)',
                        }}>
                          {ing.stock_cantidad}
                        </span>
                      </td>
                      <td>
                        <strong>${parseFloat(ing.costo_unitario).toFixed(2)}</strong>
                      </td>
                      <td>
                        {ing.es_alergeno ? (
                          <span className="badge badge-danger">Alérgeno</span>
                        ) : (
                          <span className="badge badge-success">Seguro</span>
                        )}
                      </td>
                      <td>
                        {ing.es_terminado && (
                          <span className="badge badge-primary">Terminado</span>
                        )}
                      </td>
                      <td>
                        {ing.deleted_at ? (
                          <span className="badge badge-danger">Inactivo</span>
                        ) : (
                          <span className="badge badge-success">Activo</span>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                        {formatFecha(ing.created_at)}
                      </td>
                      {(isAdmin || isStock) && (
                        <td>
                          <div className="td-actions">
                            {isAdmin ? (
                              ing.deleted_at ? (
                                <button
                                  className="btn btn-success btn-sm"
                                  onClick={() => activateMutation.mutate(ing.id)}
                                >
                                  Activar
                                </button>
                              ) : (
                                <>
                                  <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => handleEdit(ing)}
                                  >
                                    Editar
                                  </button>
                                  <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => setDeleteTarget(ing)}
                                  >
                                    Baja
                                  </button>
                                </>
                              )
                            ) : (
                              !ing.deleted_at && (
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handleEdit(ing)}
                                >
                                  Stock
                                </button>
                              )
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {data && totalItems > 0 && (
            <div className="pagination">
              <span className="pagination-info">
                Mostrando {inicio}–{fin} de {totalItems} insumos
              </span>
              <div className="pagination-controls">
                <button 
                  className="page-btn" 
                  disabled={currentPage === 1}
                  onClick={() => { console.log('First page clicked'); handlePage(1); }}
                  title="Primera página">
                  «
                </button>
                <button 
                  className="page-btn" 
                  disabled={currentPage === 1}
                  onClick={() => { console.log('Prev clicked'); handlePage(currentPage - 1); }}
                  title="Anterior">
                  ‹
                </button>

                {renderPageButtons()}

                <button 
                  className="page-btn" 
                  disabled={currentPage === totalPages}
                  onClick={() => { console.log('Next clicked, current:', currentPage, 'total:', totalPages); handlePage(currentPage + 1); }}
                  title="Siguiente">
                  ›
                </button>
                <button 
                  className="page-btn" 
                  disabled={currentPage === totalPages}
                  onClick={() => { console.log('Last page clicked'); handlePage(totalPages); }}
                  title="Última página">
                  »
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <IngredienteModal
          ingrediente={editTarget}
          onClose={handleModalClose}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          message={
            <>
              ¿Confirmás la baja lógica del insumo{' '}
              <strong>"{deleteTarget.nombre}"</strong>?
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
    </>
  )
}
