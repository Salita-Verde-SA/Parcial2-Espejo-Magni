import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchPedidos, patchPedidoEstado } from '../api/pedidos'
import { usePedidosWebSocket } from '../hooks/usePedidosWebSocket'
import type { PedidoPublic, PaginatedPedidos } from '../types'

export default function AdminPedidosPage() {
  const queryClient = useQueryClient()
  usePedidosWebSocket()
  
  const [page, setPage] = useState(1)
  const [estadoFiltro, setEstadoFiltro] = useState('')
  const [selectedPedido, setSelectedPedido] = useState<PedidoPublic | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const { data: response, isLoading } = useQuery<PaginatedPedidos>({
    queryKey: ['admin-pedidos', estadoFiltro, page],
    queryFn: () => fetchPedidos(estadoFiltro, page, 8),
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

  const stateMutation = useMutation({
    mutationFn: ({ id, nuevoEstado }: { id: number; nuevoEstado: string }) =>
      patchPedidoEstado(id, nuevoEstado),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin-pedidos'] })
      setSelectedPedido(updated)
      setErrorMsg('')
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.detail || 'Error al actualizar el estado del pedido')
    },
  })

  function handleTransition(id: number, nuevoEstado: string) {
    if (confirm(`¿Estás seguro de que deseas pasar el pedido a estado: ${nuevoEstado}?`)) {
      stateMutation.mutate({ id, nuevoEstado })
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

  const renderBotonesFsm = (p: PedidoPublic) => {
    switch (p.estado_codigo) {
      case 'PENDIENTE':
        return (
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button
              className="btn btn-primary"
              style={{ flex: 1 }}
              onClick={() => handleTransition(p.id, 'CONFIRMADO')}
            >
              ✓ Confirmar Pedido
            </button>
            <button
              className="btn btn-danger"
              style={{ flex: 1 }}
              onClick={() => handleTransition(p.id, 'CANCELADO')}
            >
              ✕ Cancelar
            </button>
          </div>
        )
      case 'CONFIRMADO':
        return (
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button
              className="btn btn-warning"
              style={{ flex: 1, color: '#fff' }}
              onClick={() => handleTransition(p.id, 'EN_PREP')}
            >
              👨‍🍳 Iniciar Preparación
            </button>
            <button
              className="btn btn-danger"
              style={{ flex: 1 }}
              onClick={() => handleTransition(p.id, 'CANCELADO')}
            >
              ✕ Cancelar
            </button>
          </div>
        )
      case 'EN_PREP':
        return (
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button
              className="btn btn-info"
              style={{ flex: 1 }}
              onClick={() => handleTransition(p.id, 'EN_CAMINO')}
            >
              🛵 Despachar / Enviar
            </button>
            <button
              className="btn btn-danger"
              style={{ flex: 1 }}
              onClick={() => handleTransition(p.id, 'CANCELADO')}
            >
              ✕ Cancelar
            </button>
          </div>
        )
      case 'EN_CAMINO':
        return (
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button
              className="btn btn-success"
              style={{ flex: 1 }}
              onClick={() => handleTransition(p.id, 'ENTREGADO')}
            >
              🎁 Marcar como Entregado
            </button>
            <button
              className="btn btn-danger"
              style={{ flex: 1 }}
              onClick={() => handleTransition(p.id, 'CANCELADO')}
            >
              ✕ Cancelar
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

      <div className="page-wrapper" style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 24, alignItems: 'start' }}>
        
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 18 }}>Pedidos del Sistema</h3>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 600 }}>Filtrar Estado:</label>
              <select
                className="filtro-select"
                style={{ width: 150, padding: '4px 8px' }}
                value={estadoFiltro}
                onChange={(e) => { setEstadoFiltro(e.target.value); setPage(1) }}
              >
                <option value="">Todos</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="CONFIRMADO">Confirmado</option>
                <option value="EN_PREP">En Preparación</option>
                <option value="EN_CAMINO">En Camino</option>
                <option value="ENTREGADO">Entregado</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>
          </div>

          {errorMsg && (
            <div className="badge badge-danger" style={{ padding: 12, borderRadius: 8, fontSize: 13, display: 'block', textAlign: 'left', marginBottom: 16 }}>
              ⚠️ {errorMsg}
            </div>
          )}

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: 24 }}>
              <span className="spinner spinner-dark" /> Cargando pedidos...
            </div>
          ) : !response || response.items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
              No hay pedidos en el sistema para este estado.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: 12 }}>ID</th>
                    <th style={{ padding: 12 }}>Cliente</th>
                    <th style={{ padding: 12 }}>Fecha</th>
                    <th style={{ padding: 12 }}>Estado</th>
                    <th style={{ padding: 12 }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {response.items.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedPedido(p)}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        cursor: 'pointer',
                        background: selectedPedido?.id === p.id ? 'rgba(var(--primary-rgb), 0.03)' : 'transparent',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => { if (selectedPedido?.id !== p.id) e.currentTarget.style.background = 'var(--bg-muted)' }}
                      onMouseLeave={(e) => { if (selectedPedido?.id !== p.id) e.currentTarget.style.background = 'transparent' }}
                    >
                      <td style={{ padding: 12, fontWeight: 700 }}>#{p.id}</td>
                      <td style={{ padding: 12 }}>{p.usuario_nombre}</td>
                      <td style={{ padding: 12 }}>{formatFecha(p.fecha)}</td>
                      <td style={{ padding: 12 }}>
                        <span className={`badge ${getBadgeClass(p.estado_codigo)}`} style={{ fontSize: 10 }}>
                          {p.estado_codigo}
                        </span>
                      </td>
                      <td style={{ padding: 12, fontWeight: 600 }}>{formatPrecio(p.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

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
                <h3 style={{ margin: 0, fontSize: 18 }}>Pedido #{selectedPedido.id}</h3>
                <span className={`badge ${getBadgeClass(selectedPedido.estado_codigo)}`}>
                  {selectedPedido.estado_codigo}
                </span>
              </div>

              <div>
                <strong style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>CLIENTE</strong>
                <div style={{ fontSize: 14 }}>{selectedPedido.usuario_nombre}</div>
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
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{selectedPedido.direccion.ciudad} ({selectedPedido.direccion.alias})</div>
                </div>
              )}

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Forma de Pago</span>
                  <strong>{selectedPedido.forma_pago_codigo}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700 }}>
                  <span>Total Pedido</span>
                  <span style={{ color: 'var(--primary)' }}>{formatPrecio(selectedPedido.total)}</span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <strong style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>AUDIT TRAIL / HISTORIAL</strong>
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

              {renderBotonesFsm(selectedPedido) && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                  <strong style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>AVANZAR ESTADO</strong>
                  {renderBotonesFsm(selectedPedido)}
                </div>
              )}

            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
              Selecciona un pedido de la tabla para ver el detalle completo, auditoría y poder cambiar su estado.
            </div>
          )}
        </div>

      </div>
    </>
  )
}
