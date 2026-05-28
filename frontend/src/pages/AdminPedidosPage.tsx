import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchPedidos, patchPedidoEstado, fetchPedido } from '../api/pedidos'
import { usePedidosWebSocket } from '../hooks/usePedidosWebSocket'
import type { PedidoPublic, PaginatedPedidos } from '../types'

export default function AdminPedidosPage() {
  const queryClient = useQueryClient()
  usePedidosWebSocket()

  const [page, setPage] = useState(1)
  const [estadoFiltro, setEstadoFiltro] = useState('')
  const [selectedPedidoId, setSelectedPedidoId] = useState<number | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const { data: response, isLoading } = useQuery<PaginatedPedidos>({
    queryKey: ['admin-pedidos', estadoFiltro, page],
    queryFn: () => fetchPedidos(estadoFiltro, page, 8),
    placeholderData: (prev) => prev,
  })

  const { data: selectedPedido } = useQuery<PedidoPublic | null>({
    queryKey: ['pedido-detalle', selectedPedidoId],
    queryFn: () => selectedPedidoId ? fetchPedido(selectedPedidoId) : Promise.resolve(null),
    enabled: !!selectedPedidoId,
    initialData: () => {
      if (!selectedPedidoId || !response) return undefined
      return response.items.find((p) => p.id === selectedPedidoId)
    },
    initialDataUpdatedAt: 0,
  })

  const stateMutation = useMutation({
    mutationFn: ({ id, nuevoEstado }: { id: number; nuevoEstado: string }) =>
      patchPedidoEstado(id, nuevoEstado),
    onSuccess: (updated) => {
      queryClient.setQueryData(['pedido-detalle', updated.id], updated)
      queryClient.invalidateQueries({ queryKey: ['admin-pedidos'] })
      setErrorMsg('')
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.detail || 'Error al actualizar el estado del pedido')
    },
  })

  function handleTransition(id: number, nuevoEstado: string) {
    if (confirm(`Confirmar cambio de estado a: ${nuevoEstado}`)) {
      stateMutation.mutate({ id, nuevoEstado })
    }
  }

  const formatPrecio = (n: number | string) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(Number(n))

  const formatFecha = (iso: string) =>
    new Date(iso).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  const getBadgeClass = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':  return 'badge-neutral'
      case 'CONFIRMADO': return 'badge-primary'
      case 'EN_PREP':    return 'badge-warning'
      case 'EN_CAMINO':  return 'badge-info'
      case 'ENTREGADO':  return 'badge-success'
      case 'CANCELADO':  return 'badge-danger'
      default:           return 'badge-neutral'
    }
  }

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':  return 'Pendiente'
      case 'CONFIRMADO': return 'Confirmado'
      case 'EN_PREP':    return 'En preparación'
      case 'EN_CAMINO':  return 'En camino'
      case 'ENTREGADO':  return 'Entregado'
      case 'CANCELADO':  return 'Cancelado'
      default:           return estado
    }
  }

  const renderBotonesFsm = (p: PedidoPublic) => {
    switch (p.estado_codigo) {
      case 'PENDIENTE':
        return (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => handleTransition(p.id, 'CONFIRMADO')}>
              Confirmar pedido
            </button>
            <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => handleTransition(p.id, 'CANCELADO')}>
              Cancelar
            </button>
          </div>
        )
      case 'CONFIRMADO':
        return (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-warning" style={{ flex: 1 }} onClick={() => handleTransition(p.id, 'EN_PREP')}>
              Iniciar preparación
            </button>
            <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => handleTransition(p.id, 'CANCELADO')}>
              Cancelar
            </button>
          </div>
        )
      case 'EN_PREP':
        return (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-info" style={{ flex: 1 }} onClick={() => handleTransition(p.id, 'EN_CAMINO')}>
              Despachar
            </button>
            <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => handleTransition(p.id, 'CANCELADO')}>
              Cancelar
            </button>
          </div>
        )
      case 'EN_CAMINO':
        return (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-success" style={{ flex: 1 }} onClick={() => handleTransition(p.id, 'ENTREGADO')}>
              Marcar entregado
            </button>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <>
      <header className="topbar">
        <span className="topbar-title">Administración de Pedidos</span>
      </header>

      <div className="page-wrapper" style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 24, alignItems: 'start' }}>

        {/* Lista de pedidos */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Pedidos del sistema</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label className="filtro-label" style={{ marginBottom: 0 }}>Estado</label>
              <select
                className="filtro-select"
                style={{ minWidth: 160 }}
                value={estadoFiltro}
                onChange={(e) => { setEstadoFiltro(e.target.value); setPage(1) }}
              >
                <option value="">Todos</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="CONFIRMADO">Confirmado</option>
                <option value="EN_PREP">En preparación</option>
                <option value="EN_CAMINO">En camino</option>
                <option value="ENTREGADO">Entregado</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>
          </div>

          {errorMsg && (
            <div className="alert alert-danger" style={{ margin: '12px 20px 0' }}>
              {errorMsg}
            </div>
          )}

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 70 }}>ID</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th style={{ width: 130 }}>Estado</th>
                  <th style={{ width: 110 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr className="loading-row">
                    <td colSpan={5}><span className="spinner spinner-dark" /> Cargando...</td>
                  </tr>
                )}
                {!isLoading && (!response || response.items.length === 0) && (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state">
                        <h3>Sin pedidos</h3>
                        <p>No hay pedidos para el estado seleccionado.</p>
                      </div>
                    </td>
                  </tr>
                )}
                {!isLoading && response?.items.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => setSelectedPedidoId(p.id)}
                    style={{
                      cursor: 'pointer',
                      background: selectedPedidoId === p.id ? '#FEF2F2' : undefined,
                      borderLeft: selectedPedidoId === p.id ? '3px solid var(--brand)' : '3px solid transparent',
                    }}
                  >
                    <td className="col-id">#{p.id}</td>
                    <td style={{ fontWeight: 500 }}>{p.usuario_nombre}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatFecha(p.fecha)}</td>
                    <td>
                      <span className={`badge ${getBadgeClass(p.estado_codigo)}`}>
                        {getEstadoLabel(p.estado_codigo)}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>{formatPrecio(p.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {response && response.total > response.page_size && (
            <div className="pagination">
              <span className="pagination-info">Página {page} de {response.pages}</span>
              <div className="pagination-controls">
                <button className="page-btn" disabled={page === 1} onClick={() => setPage(page - 1)}>‹</button>
                <button className="page-btn" disabled={page === response.pages} onClick={() => setPage(page + 1)}>›</button>
              </div>
            </div>
          )}
        </div>

        {/* Panel de detalle */}
        <div className="card" style={{ position: 'sticky', top: 24 }}>
          {selectedPedido ? (
            <div>
              <div className="card-header">
                <span className="card-title">Pedido #{selectedPedido.id}</span>
                <span className={`badge ${getBadgeClass(selectedPedido.estado_codigo)}`}>
                  {getEstadoLabel(selectedPedido.estado_codigo)}
                </span>
              </div>

              <div style={{ padding: '0 20px 20px' }}>

                <div className="detail-section">
                  <div className="detail-label">Cliente</div>
                  <div style={{ fontWeight: 500 }}>{selectedPedido.usuario_nombre}</div>
                </div>

                <div className="detail-section">
                  <div className="detail-label">Productos</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {selectedPedido.items.map((item) => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: 'var(--text-muted)' }}>{item.cantidad}x {item.producto_nombre}</span>
                        <strong>{formatPrecio(parseFloat(item.precio_unitario) * item.cantidad)}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedPedido.direccion && (
                  <div className="detail-section">
                    <div className="detail-label">Dirección de entrega</div>
                    <div style={{ fontSize: 13 }}>
                      {selectedPedido.direccion.calle} {selectedPedido.direccion.numero}
                      {selectedPedido.direccion.piso && `, Piso ${selectedPedido.direccion.piso}`}
                      {selectedPedido.direccion.departamento && `, Depto ${selectedPedido.direccion.departamento}`}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {selectedPedido.direccion.ciudad} · {selectedPedido.direccion.alias}
                    </div>
                  </div>
                )}

                <div className="detail-section">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Forma de pago</span>
                    <strong>{selectedPedido.forma_pago_codigo}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800 }}>
                    <span>Total</span>
                    <span style={{ color: 'var(--brand)' }}>{formatPrecio(selectedPedido.total)}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <div className="detail-label">Historial de estados</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {selectedPedido.historial.map((h) => (
                      <div key={h.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: 'var(--brand)', flexShrink: 0, marginTop: 4,
                        }} />
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>
                            {getEstadoLabel(h.estado_nuevo_codigo)}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {formatFecha(h.fecha)} · {h.usuario_nombre}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {renderBotonesFsm(selectedPedido) && (
                  <div className="detail-section">
                    <div className="detail-label">Avanzar estado</div>
                    {renderBotonesFsm(selectedPedido)}
                  </div>
                )}

              </div>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '56px 24px' }}>
              <h3>Sin selección</h3>
              <p>Seleccioná un pedido para ver el detalle y gestionar su estado.</p>
            </div>
          )}
        </div>

      </div>
    </>
  )
}
