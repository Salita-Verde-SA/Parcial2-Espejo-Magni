import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchProductosAll,
  deleteProducto,
  exportProductosExcel,
  fetchProducto,
  activateProducto,
} from '../api/productos'
import { fetchCategorias } from '../api/categorias'
import { useAuthStore } from '../stores/authStore'
import ProductoModal from '../components/ProductoModal'
import ProductoStockModal from '../components/ProductoStockModal'
import ConfirmDialog from '../components/ConfirmDialog'
import type { Producto, FiltrosProducto } from '../types'

const DEFAULT_FILTROS: FiltrosProducto = {
  nombre: '',
  categoria_id: null,
  disponible: '',
  page: 1,
  page_size: 10,
}

function formatCurrency(precio: string, unidadSimbolo?: string) {
  const num = parseFloat(precio)
  const formatted = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(num)
  if (unidadSimbolo) {
    return `${formatted} / ${unidadSimbolo}`
  }
  return formatted
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export default function ProductosPage() {
  const isAdmin = useAuthStore((s) => s.isAdmin())
  const isStock = useAuthStore((s) => s.hasRole('STOCK'))
  const qc = useQueryClient()

  const [filtros, setFiltros] = useState<FiltrosProducto>(DEFAULT_FILTROS)
  const [filtrosDraft, setFiltrosDraft] = useState<FiltrosProducto>(DEFAULT_FILTROS)

  const [modalOpen, setModalOpen] = useState(false)
  const [stockModalOpen, setStockModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Producto | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Producto | null>(null)
  const [exporting, setExporting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['productos-all'],
    queryFn: () => fetchProductosAll(),
  })

  const { data: categoriasData } = useQuery({
    queryKey: ['categorias-all'],
    queryFn: () => fetchCategorias(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteProducto(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['productos-all'] })
      qc.invalidateQueries({ queryKey: ['productos'] })
      setDeleteTarget(null)
    },
  })

  const activateMutation = useMutation({
    mutationFn: async (id: number) => {
      try {
        return await activateProducto(id)
      } catch (error: any) {
        const message = error?.response?.data?.detail || 'Error al activar el producto'
        throw new Error(message)
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['productos-all'] })
      qc.invalidateQueries({ queryKey: ['productos'] })
    },
    onError: (error: Error) => {
      setErrorMessage(error.message)
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

  function handleEdit(prod: Producto) {
    fetchProducto(prod.id).then(fullProducto => {
      setEditTarget(fullProducto)
      setModalOpen(true)
    })
  }

  function handleStockEdit(prod: Producto) {
    setEditTarget(prod)
    setStockModalOpen(true)
  }

  function handleNew() {
    setEditTarget(null)
    setModalOpen(true)
  }

  function handleModalClose() {
    setModalOpen(false)
    setEditTarget(null)
  }

  function handleStockModalClose() {
    setStockModalOpen(false)
    setEditTarget(null)
  }

  async function handleExport() {
    setExporting(true)
    try {
      await exportProductosExcel()
    } finally {
      setExporting(false)
    }
  }

  const totalPages = data?.pages ?? 1
  const currentPage = filtros.page

  const filteredItems = data?.items
    ? data.items.filter((prod) => {
        if (filtros.nombre && !prod.nombre.toLowerCase().includes(filtros.nombre.toLowerCase())) {
          return false
        }
        if (filtros.categoria_id && !prod.categorias.includes(filtros.categoria_id)) {
          return false
        }
        if (filtros.disponible !== '' && prod.disponible !== (filtros.disponible === 'true')) {
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

  function renderPageButtons() {
    const buttons: React.ReactNode[] = []
    const range = 2
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - range && i <= currentPage + range)) {
        buttons.push(
          <button key={i} className={`page-btn${i === currentPage ? ' active' : ''}`} onClick={() => handlePage(i)}>
            {i}
          </button>
        )
      } else if (i === currentPage - range - 1 || i === currentPage + range + 1) {
        buttons.push(<span key={`ellipsis-${i}`} style={{ padding: '0 4px', color: 'var(--text-muted)' }}>…</span>)
      }
    }
    return buttons
  }

  const totalItems = sortedItems.length
  const inicio = totalItems > 0 ? (filtros.page - 1) * filtros.page_size + 1 : 0
  const fin = Math.min(filtros.page * filtros.page_size, totalItems)
  
  const start = (filtros.page - 1) * filtros.page_size
  const end = start + filtros.page_size
  const paginatedItems = sortedItems.slice(start, end)

  const categorias = categoriasData ?? []

  return (
    <>
      <header className="topbar">
        <span className="topbar-title">Gestión de Productos</span>
      </header>

      <div className="page-wrapper">
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              Productos registrados
              {data && (
                <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 400, color: 'var(--text-muted)' }}>
                  ({data.total} total)
                </span>
              )}
            </span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-success" onClick={handleExport} disabled={exporting}>
                {exporting ? <span className="spinner" /> : null} Exportar Excel
              </button>
              {isAdmin && (
                <button className="btn btn-primary" onClick={handleNew}>
                  Nuevo producto
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
                onChange={(e) => setFiltrosDraft({ ...filtrosDraft, nombre: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            <div className="filtro-group">
              <label className="filtro-label">Categoría</label>
              <select
                className="filtro-select"
                value={filtrosDraft.categoria_id ?? ''}
                onChange={(e) =>
                  setFiltrosDraft({ ...filtrosDraft, categoria_id: e.target.value ? Number(e.target.value) : null })
                }
              >
                <option value="">Todas</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                ))}
              </select>
            </div>

            <div className="filtro-group">
              <label className="filtro-label">Disponible</label>
              <select
                className="filtro-select"
                value={filtrosDraft.disponible}
                onChange={(e) => setFiltrosDraft({ ...filtrosDraft, disponible: e.target.value })}
              >
                <option value="">Todos</option>
                <option value="true">Solo disponibles</option>
                <option value="false">No disponibles</option>
              </select>
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

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 60 }}>ID</th>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th style={{ width: 100 }}>Precio</th>
                  <th style={{ width: 80 }}>Stock</th>
                  <th style={{ width: 100 }}>Disponible</th>
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
                    <td colSpan={(isAdmin || isStock) ? 8 : 7} style={{ textAlign: 'center', padding: 24, color: 'var(--danger)' }}>
                      Error al cargar los datos. Intentá de nuevo.
                    </td>
                  </tr>
                )}
                {!isLoading && !isError && data?.items.length === 0 && (
                  <tr>
                    <td colSpan={(isAdmin || isStock) ? 8 : 7}>
                      <div className="empty-state">
                        <h3>Sin resultados</h3>
                        <p>No se encontraron productos con los filtros aplicados.</p>
                      </div>
                    </td>
                  </tr>
                )}
                {!isLoading && paginatedItems.map((prod) => (
                  <tr 
                    key={prod.id} 
                    style={{ 
                      backgroundColor: prod.deleted_at ? 'rgba(220, 53, 69, 0.1)' : undefined,
                      opacity: prod.deleted_at ? 0.6 : 1,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <td className="col-id">#{prod.id}</td>
                    <td><strong>{prod.nombre}</strong></td>
                    <td className="col-desc" title={prod.descripcion ?? ''}>
                      {prod.descripcion || <span style={{ color: 'var(--border)' }}>—</span>}
                    </td>
                    <td>{formatCurrency(prod.precio_base, prod.unidad_venta_id ? (prod as any).unidad_venta?.simbolo : undefined)}</td>
                    <td>{prod.stock_cantidad}</td>
                    <td>
                      {prod.disponible ? (
                        <span className="badge badge-success">Disponible</span>
                      ) : (
                        <span className="badge badge-danger">No disponible</span>
                      )}
                    </td>
                    <td>
                      {prod.deleted_at ? (
                        <span className="badge badge-danger">Inactivo</span>
                      ) : (
                        <span className="badge badge-success">Activo</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {formatFecha(prod.created_at)}
                    </td>
                    {(isAdmin || isStock) && (
                      <td>
                        <div className="td-actions">
                          {isAdmin ? (
                            prod.deleted_at ? (
                              <button className="btn btn-success btn-sm" onClick={() => activateMutation.mutate(prod.id)}>Activar</button>
                            ) : (
                              <>
                                <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(prod)}>Editar</button>
                                <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(prod)}>Baja</button>
                              </>
                            )
                          ) : (
                            !prod.deleted_at && (
                              <button className="btn btn-primary btn-sm" onClick={() => handleStockEdit(prod)}>Stock/Disp.</button>
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

          {data && data.total > 0 && (
            <div className="pagination">
              <span className="pagination-info">
                Mostrando {inicio}–{fin} de {data.total} productos
              </span>
              <div className="pagination-controls">
                <button className="page-btn" disabled={currentPage === 1} onClick={() => handlePage(1)} title="Primera página">«</button>
                <button className="page-btn" disabled={currentPage === 1} onClick={() => handlePage(currentPage - 1)} title="Anterior">‹</button>
                {renderPageButtons()}
                <button className="page-btn" disabled={currentPage === totalPages} onClick={() => handlePage(currentPage + 1)} title="Siguiente">›</button>
                <button className="page-btn" disabled={currentPage === totalPages} onClick={() => handlePage(totalPages)} title="Última página">»</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {modalOpen && <ProductoModal producto={editTarget} onClose={handleModalClose} />}

      {stockModalOpen && editTarget && (
        <ProductoStockModal producto={editTarget} onClose={handleStockModalClose} />
      )}

      {deleteTarget && (
        <ConfirmDialog
          message={
            <>
              ¿Confirmás la baja lógica del producto <strong>"{deleteTarget.nombre}"</strong>?
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

      {errorMessage && (
        <ConfirmDialog
          message={<>{errorMessage}</>}
          confirmLabel="Aceptar"
          loading={false}
          onConfirm={() => setErrorMessage(null)}
          onCancel={() => setErrorMessage(null)}
        />
      )}
    </>
  )
}