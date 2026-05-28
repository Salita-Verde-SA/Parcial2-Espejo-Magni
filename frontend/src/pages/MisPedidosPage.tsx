import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchPedidos, cancelarPedido } from '../api/pedidos'
import { usePedidosWebSocket } from '../hooks/usePedidosWebSocket'
import type { PedidoPublic, PaginatedPedidos } from '../types'

export default function MisPedidosPage() {
  const queryClient = useQueryClient()
  usePedidosWebSocket()

  const [page, setPage] = useState(1)
  const [selectedPedido, setSelectedPedido] = useState<PedidoPublic | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const { data: response, isLoading } = useQuery<PaginatedPedidos>({
    queryKey: ['pedidos', page],
    queryFn: () => fetchPedidos('', page, 5),
    placeholderData: (prev) => prev,
  })

  useEffect(() => {
    if (response && selectedPedido) {
      const updated = response.items.find((p) => p.id === selectedPedido.id)
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedPedido)) {
        setSelectedPedido(updated)
      }
    }
  }, [response, selectedPedido])

  const cancelMutation = useMutation({
    mutationFn: cancelarPedido,
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] })
      setSelectedPedido(updated)
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.detail || 'Error al cancelar el pedido')
    },
  })

  function handleCancelar(id: number) {
    if (confirm('¿Confirmas la cancelación del pedido?')) {
      cancelMutation.mutate(id)
    }
  }

  const formatPrecio = (n: number | string) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(Number(n))

  const formatFecha = (iso: string) =>
    new Date(iso).toLocaleString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
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

  return (
    <>
      <header className="topbar">
        <span className="topbar-title">Mis Pedidos</span>
      </header>

      <div className="page-wrapper" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' }}>

        {/* Lista de pedidos */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Historial de compras</span>
            {response && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {response.total} pedido{response.total !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

            {isLoading ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <span className="spinner spinner-dark" />
                <p style={{ marginTop: 10, color: 'var(--text-muted)' }}>Cargando pedidos...</p>
              </div>
            ) : !response || response.items.length === 0 ? (
              <div className="empty-state">
                <h3>Sin pedidos</h3>
                <p>Todavía no realizaste ningún pedido.</p>
              </div>
            ) : (
              <>
                {response.items.map((p) => (
                  <div
                    key={p.id}
                    className={`pedido-item ${selectedPedido?.id === p.id ? 'selected' : ''}`}
                    onClick={() => setSelectedPedido(p)}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <strong style={{ fontSize: 14 }}>Pedido #{p.id}</strong>
                        <span className={`badge ${getBadgeClass(p.estado_codigo)}`}>
                          {getEstadoLabel(p.estado_codigo)}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatFecha(p.fecha)}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--brand)' }}>
                        {formatPrecio(p.total)}
                      </div>
                    </div>
                  </div>
                ))}

                {response.total > response.page_size && (
                  <div className="pagination" style={{ border: 'none', paddingBottom: 0 }}>
                    <span className="pagination-info">Página {page} de {response.pages}</span>
                    <div className="pagination-controls">
                      <button className="page-btn" disabled={page === 1} onClick={() => setPage(page - 1)}>‹</button>
                      <button className="page-btn" disabled={page === response.pages} onClick={() => setPage(page + 1)}>›</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
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
                      {selectedPedido.direccion.ciudad}
                    </div>
                  </div>
                )}

                <div className="detail-section">
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Forma de pago</span>
                    <strong>{selectedPedido.forma_pago_codigo}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, fontWeight: 800 }}>
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
                          <div style={{ fontSize: 12, fontWeight: 600 }}>{getEstadoLabel(h.estado_nuevo_codigo)}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {formatFecha(h.fecha)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {['PENDIENTE', 'CONFIRMADO'].includes(selectedPedido.estado_codigo) && (
                  <div className="detail-section">
                    <button
                      className="btn btn-danger"
                      style={{ width: '100%', justifyContent: 'center' }}
                      disabled={cancelMutation.isPending}
                      onClick={() => handleCancelar(selectedPedido.id)}
                    >
                      {cancelMutation.isPending ? 'Cancelando...' : 'Cancelar pedido'}
                    </button>
                  </div>
                )}

              </div>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '56px 24px' }}>
              <h3>Sin selección</h3>
              <p>Seleccioná un pedido para ver el detalle y el historial de estados.</p>
            </div>
          )}
        </div>

      </div>
    </>
  )
}
