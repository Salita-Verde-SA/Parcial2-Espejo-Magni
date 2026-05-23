// ─── pages/IngredientesPage.tsx ───────────────────────────────────────────────
// Página de gestión de Insumos (ingredientes). Solo accesible con rol ADMIN.
// Permite: ver, filtrar, paginar, crear, editar y dar de baja insumos.
// Exportar la lista a Excel.
//
// Estructura visual:
//   Topbar → Card [ CardHeader (acciones) → FiltrosBar → Tabla → Paginación ]
//   + Modal crear/editar (condicional)
//   + Dialog de confirmación de baja (condicional)

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchIngredientesAll,
  deleteIngrediente,
  exportExcel,
  activateIngrediente,
} from '../api/ingredientes'
import { useAuthStore } from '../stores/authStore'
import IngredienteModal from '../components/IngredienteModal'
import ConfirmDialog from '../components/ConfirmDialog'
import type { Ingrediente, FiltrosIngrediente } from '../types'

// Estado inicial de los filtros: todos los ingredientes, página 1
const DEFAULT_FILTROS: FiltrosIngrediente = {
  nombre: '',
  es_alergeno: '',
  page: 1,
  page_size: 10,
}

// ─── formatFecha ──────────────────────────────────────────────────────────────
// Convierte una fecha ISO 8601 a formato legible en español argentino.
// Ej: "2025-03-15T10:30:00Z" → "15/03/2025"
function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// ─── IngredientesPage ─────────────────────────────────────────────────────────
export default function IngredientesPage() {
  const isAdmin = useAuthStore((s) => s.isAdmin())
  const isStock = useAuthStore((s) => s.hasRole('STOCK'))
  const qc = useQueryClient()

  // ── Estado de filtros (mismo patrón draft/confirmado que CatalogoPage) ──────
  const [filtros, setFiltros]             = useState<FiltrosIngrediente>(DEFAULT_FILTROS)
  const [filtrosDraft, setFiltrosDraft]   = useState<FiltrosIngrediente>(DEFAULT_FILTROS)

  // ── Estado de modales ────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen]         = useState(false)           // modal crear/editar
  const [editTarget, setEditTarget]       = useState<Ingrediente | null>(null)  // ingrediente a editar
  const [deleteTarget, setDeleteTarget]   = useState<Ingrediente | null>(null)  // ingrediente a eliminar
  const [exporting, setExporting]         = useState(false)           // spinner del botón Exportar

// ── useQuery: carga la lista de ingredientes (todos, incluyendo eliminados) ─────
  const { data, isLoading, isError } = useQuery({
    queryKey: ['ingredientes', 'all'],
    queryFn: () => fetchIngredientesAll(),
  })

  // ── useMutation: baja lógica de un ingrediente ───────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteIngrediente(id),
    onSuccess: () => {
      // Invalida el caché de ingredientes → la tabla se recarga automáticamente
      qc.invalidateQueries({ queryKey: ['ingredientes'] })
      setDeleteTarget(null)   // cierra el diálogo de confirmación
    },
  })

  // ── useMutation: activar ingrediente ─────────────────────────────────────────
  const activateMutation = useMutation({
    mutationFn: (id: number) => activateIngrediente(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ingredientes'] })
    },
  })

  // ── Handlers ─────────────────────────────────────────────────────────────────

  // Aplica los filtros del draft y vuelve a la primera página
  function handleSearch() {
    setFiltros({ ...filtrosDraft, page: 1 })
  }

  // Resetea tanto el draft como los filtros aplicados
  function handleReset() {
    setFiltrosDraft(DEFAULT_FILTROS)
    setFiltros(DEFAULT_FILTROS)
  }

  // Cambia a la página indicada manteniendo los filtros actuales
  function handlePage(p: number) {
    setFiltros((prev) => ({ ...prev, page: p }))
  }

  // Abre el modal en modo edición con los datos del ingrediente seleccionado
  function handleEdit(ing: Ingrediente) {
    setEditTarget(ing)
    setModalOpen(true)
  }

  // Abre el modal en modo creación (sin datos previos)
  function handleNew() {
    setEditTarget(null)
    setModalOpen(true)
  }

  // Cierra el modal y limpia el ingrediente en edición
  function handleModalClose() {
    setModalOpen(false)
    setEditTarget(null)
  }

  // Lanza la descarga del Excel y maneja el estado de carga del botón
  async function handleExport() {
    setExporting(true)
    try {
      await exportExcel()
    } finally {
      setExporting(false)
    }
  }

  // ── Cálculos de paginación ────────────────────────────────────────────────
  // Los datos vienen del endpoint "all" que devuelve todos los registros
  // Por lo tanto calculamos las páginas basado en los datos locales filtrados
  const currentPage = filtros.page

  // Filtrar localmente
  const filteredItems = data?.items
    ? data.items.filter((ing) => {
        // Filtro por nombre
        if (filtros.nombre && !ing.nombre.toLowerCase().includes(filtros.nombre.toLowerCase())) {
          return false
        }
        return true
      })
    : []

  // Ordenar: activos primero, inactivos al final
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (a.deleted_at && !b.deleted_at) return 1
    if (!a.deleted_at && b.deleted_at) return -1
    return a.id - b.id
  })

  // Calcular totalPages ANTES de renderPageButtons
  const totalItems = sortedItems.length
  const totalPages = Math.ceil(totalItems / filtros.page_size) || 1

  // ─── renderPageButtons ──────────────────────────────────────────────────────
  // Genera los botones numéricos de paginación con elipsis ("…") para
  // no mostrar todas las páginas cuando hay muchas.
  // Muestra: primera, última, y las páginas cercanas a la actual (±2).
  function renderPageButtons() {
    const buttons: React.ReactNode[] = []
    const range = 2   // cuántas páginas mostrar a cada lado de la actual

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||          // siempre muestra la primera
        i === totalPages || // siempre muestra la última
        (i >= currentPage - range && i <= currentPage + range)  // páginas cercanas
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
        // Si el gap es exactamente 1, agrega el "…" una sola vez
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

  // Rango de registros visibles en la tabla (para el texto "Mostrando X–Y de Z")
  const inicio = totalItems > 0 ? (filtros.page - 1) * filtros.page_size + 1 : 0
  const fin = Math.min(filtros.page * filtros.page_size, totalItems)

  // Items de la página actual
  const start = (filtros.page - 1) * filtros.page_size
  const end = start + filtros.page_size
  const paginatedItems = sortedItems.slice(start, end)

  return (
    <>
      {/* Barra de título de la página */}
      <header className="topbar">
        <span className="topbar-title">Gestión de Insumos</span>
      </header>

      <div className="page-wrapper">
        {/* Todo el contenido de la página dentro de una card */}
        <div className="card">

          {/* ── Encabezado de la card: título + botones de acción ─────────── */}
          <div className="card-header">
            <span className="card-title">
              Insumos registrados
              {/* Muestra el total entre paréntesis cuando los datos cargaron */}
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
              {/* Solo el ADMIN puede crear nuevos insumos */}
              {isAdmin && (
                <button className="btn btn-primary" onClick={handleNew}>
                  Nuevo insumo
                </button>
              )}
            </div>
          </div>

          {/* ── Barra de filtros ──────────────────────────────────────────── */}
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

            {/* Selector de cantidad de resultados por página */}
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

          {/* ── Tabla de insumos ──────────────────────────────────────────── */}
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 60 }}>ID</th>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th style={{ width: 80 }}>Stock</th>
                  <th style={{ width: 110 }}>Alérgeno</th>
                  <th style={{ width: 100 }}>Estado</th>
                  <th style={{ width: 110 }}>Alta</th>
                  {/* La columna Acciones existe para admins y stock */}
                  {(isAdmin || isStock) && <th style={{ width: 130 }}>Acciones</th>}
                </tr>
              </thead>
              <tbody>

                {/* Estado: cargando */}
                {isLoading && (
                  <tr className="loading-row">
                    <td colSpan={(isAdmin || isStock) ? 8 : 7}>
                      <span className="spinner spinner-dark" /> Cargando...
                    </td>
                  </tr>
                )}

                {/* Estado: error de red o del servidor */}
                {isError && (
                  <tr>
                    <td colSpan={(isAdmin || isStock) ? 8 : 7}
                      style={{ textAlign: 'center', padding: 24, color: 'var(--danger)' }}>
                      Error al cargar los datos. Intentá de nuevo.
                    </td>
                  </tr>
                )}

                {/* Estado: sin resultados con los filtros aplicados */}
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

                {/* Estado: datos cargados → renderiza una fila por ingrediente */}
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
                      {/* col-desc: trunca con "..." si el texto es muy largo */}
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
                        {/* Badge verde/rojo según si es o no alérgeno */}
                        {ing.es_alergeno ? (
                          <span className="badge badge-danger">Alérgeno</span>
                        ) : (
                          <span className="badge badge-success">Seguro</span>
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
                      {/* Columna de acciones: para admins y stock */}
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

          {/* ── Paginación completa (solo cuando hay datos y hay más de una página) ───────────────── */}
          {data && totalItems > 0 && (
            <div className="pagination">
              <span className="pagination-info">
                Mostrando {inicio}–{fin} de {totalItems} insumos
              </span>
              <div className="pagination-controls">
                {/* Primera página */}
                <button 
                  className="page-btn" 
                  disabled={currentPage === 1}
                  onClick={() => { console.log('First page clicked'); handlePage(1); }}
                  title="Primera página">
                  «
                </button>
                {/* Página anterior */}
                <button 
                  className="page-btn" 
                  disabled={currentPage === 1}
                  onClick={() => { console.log('Prev clicked'); handlePage(currentPage - 1); }}
                  title="Anterior">
                  ‹
                </button>

                {/* Botones numéricos con elipsis */}
                {renderPageButtons()}

                {/* Página siguiente */}
                <button 
                  className="page-btn" 
                  disabled={currentPage === totalPages}
                  onClick={() => { console.log('Next clicked, current:', currentPage, 'total:', totalPages); handlePage(currentPage + 1); }}
                  title="Siguiente">
                  ›
                </button>
                {/* Última página */}
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

      {/* ── Modal crear/editar (se monta solo cuando modalOpen=true) ──────── */}
      {modalOpen && (
        <IngredienteModal
          ingrediente={editTarget}
          onClose={handleModalClose}
        />
      )}

      {/* ── Diálogo de confirmación de baja (se monta cuando hay deleteTarget) */}
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
