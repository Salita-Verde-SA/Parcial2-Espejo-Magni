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
    if (confirm('¿Estás seguro de que deseas cancelar este pedido?')) {
      cancelMutation.mutate(id)
    }
  }

  const formatPrecio = (n: number | string) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(Number(n))

  const formatFecha = (iso: string) => {
    return new Date(iso).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getBadgeClass = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE': return 'badge-secondary'
      case 'CONFIRMADO': return 'badge-primary'
      case 'EN_PREP': return 'badge-warning'
      case 'EN_CAMINO': return 'badge-info'
      case 'ENTREGADO': return 'badge-success'
      case 'CANCELADO': return 'badge-danger'
      default: return 'badge-secondary'
    }
  }

  return (
    <>
      <header className="topbar">
        <span className="topbar-title">Mis Pedidos</span>
      </header>

      <div className="page-wrapper" style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 24, alignItems: 'start' }}>
        
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 18 }}>📜 Historial de Compras</h3>

          {errorMsg && (
            <div className="badge badge-danger" style={{ padding: 12, borderRadius: 8, fontSize: 13, display: 'block', textAlign: 'left', marginBottom: 16 }}>
              ⚠️ {errorMsg}
            </div>
          )}

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: 24 }}>
              <span className="spinner spinner-dark" /> Cargando tus pedidos...
            </div>
          ) : !response || response.items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
              No has realizado ningún pedido todavía.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {response.items.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPedido(p)}
                  style={{
                    padding: 16,
                    border: `1px solid ${selectedPedido?.id === p.id ? 'var(--primary)' : 'var(--border)'}`,
                    borderRadius: 12,
                    cursor: 'pointer',
                    background: selectedPedido?.id === p.id ? 'rgba(var(--primary-rgb), 0.02)' : 'var(--surface)',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <strong style={{ fontSize: 15 }}>Pedido #{p.id}</strong>
                      <span className={`badge ${getBadgeClass(p.estado_codigo)}`} style={{ fontSize: 11 }}>
                        {p.estado_codigo}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                      Fecha: {formatFecha(p.fecha)}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)', marginTop: 8 }}>
                      Total: {formatPrecio(p.total)}
                    </div>
                  </div>
                  <div>👉</div>
                </div>
              ))}

              {response.total > response.page_size && (
                <div className="pagination" style={{ marginTop: 16 }}>
                  <button
                    className="page-btn"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >‹</button>
                  <span style={{ padding: '0 12px', fontSize: 13, color: 'var(--text-muted)' }}>
                    Página {page} de {response.pages}
                  </span>
                  <button
                    className="page-btn"
                    disabled={page === response.pages}
                    onClick={() => setPage(page + 1)}
                  >›</button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 24, position: 'sticky', top: 24 }}>
          {selectedPedido ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 18 }}>Detalle del Pedido #{selectedPedido.id}</h3>
                <span className={`badge ${getBadgeClass(selectedPedido.estado_codigo)}`}>
                  {selectedPedido.estado_codigo}
                </span>
              </div>

              <div>
                <strong style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>PRODUCTOS</strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selectedPedido.items.map((item) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span>{item.cantidad} x {item.producto_nombre}</span>
                      <strong>{formatPrecio(parseFloat(item.precio_unitario) * item.cantidad)}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {selectedPedido.direccion && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                  <strong style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>DIRECCIÓN DE ENTREGA</strong>
                  <div style={{ fontSize: 13 }}>
                    {selectedPedido.direccion.calle} {selectedPedido.direccion.numero}
                    {selectedPedido.direccion.piso && `, Piso ${selectedPedido.direccion.piso}`}
                    {selectedPedido.direccion.departamento && `, Depto ${selectedPedido.direccion.departamento}`}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{selectedPedido.direccion.ciudad}</div>
                </div>
              )}

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Forma de Pago</span>
                  <strong>{selectedPedido.forma_pago_codigo}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700 }}>
                  <span>Total Pagado</span>
                  <span style={{ color: 'var(--primary)' }}>{formatPrecio(selectedPedido.total)}</span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <strong style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>HISTORIAL DE ESTADOS</strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                  {selectedPedido.historial.map((h) => (
                    <div key={h.id} style={{ paddingLeft: 8, borderLeft: '2px solid var(--border)' }}>
                      <div style={{ fontWeight: 600 }}>{h.estado_nuevo_codigo}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                        {formatFecha(h.fecha)} por {h.usuario_nombre}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {['PENDIENTE', 'CONFIRMADO'].includes(selectedPedido.estado_codigo) && (
                <button
                  className="btn btn-danger"
                  style={{ width: '100%', marginTop: 8 }}
                  disabled={cancelMutation.isPending}
                  onClick={() => handleCancelar(selectedPedido.id)}
                >
                  {cancelMutation.isPending ? 'Cancelando...' : 'Cancelar Pedido'}
                </button>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
              Selecciona un pedido de la lista para ver su detalle completo e historial.
            </div>
          )}
        </div>

      </div>
    </>
  )
}
