import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchPedidos, cancelarPedido } from '../api/pedidos'
import { usePedidosWebSocket } from '../hooks/usePedidosWebSocket'
import type { PedidoPublic, PaginatedPedidos } from '../types'

function formatPrecio(n: number | string) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
  }).format(Number(n))
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const ESTADO_COLORS: Record<string, { bg: string; color: string }> = {
  PENDIENTE:  { bg: '#f3f4f6', color: '#374151' },
  CONFIRMADO: { bg: '#dbeafe', color: '#1d4ed8' },
  EN_PREP:    { bg: '#fef3c7', color: '#d97706' },
  EN_CAMINO:  { bg: '#e0f2fe', color: '#0369a1' },
  ENTREGADO:  { bg: '#d1fae5', color: '#065f46' },
  CANCELADO:  { bg: '#fee2e2', color: '#b91c1c' },
}

function EstadoBadge({ estado }: { estado: string }) {
  const c = ESTADO_COLORS[estado] ?? { bg: '#f3f4f6', color: '#374151' }
  return (
    <span style={{
      background: c.bg, color: c.color,
      borderRadius: 6, padding: '2px 10px', fontSize: 11, fontWeight: 700,
    }}>
      {estado}
    </span>
  )
}

export default function MisPedidosPage() {
  const queryClient = useQueryClient()
  usePedidosWebSocket()

  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<PedidoPublic | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const { data: response, isLoading } = useQuery<PaginatedPedidos>({
    queryKey: ['pedidos', page],
    queryFn: () => fetchPedidos(page, 5),
    placeholderData: (prev) => prev,
  })

  const cancelMutation = useMutation({
    mutationFn: cancelarPedido,
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] })
      setSelected(updated)
      setErrorMsg('')
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { detail?: string } } }
      setErrorMsg(e.response?.data?.detail ?? 'Error al cancelar el pedido')
    },
  })

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20, color: '#111827' }}>
        Mis Pedidos
      </h2>

      {errorMsg && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca',
          borderRadius: 8, padding: '10px 14px', color: '#b91c1c',
          fontSize: 13, marginBottom: 16,
        }}>
          {errorMsg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' }}>

        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 17 }}>Historial de pedidos</h3>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: 32, color: '#6b7280' }}>Cargando...</div>
          ) : !response || response.items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>
              No realizaste ningún pedido todavía.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {response.items.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelected(p)}
                  style={{
                    padding: 16, borderRadius: 10,
                    border: `2px solid ${selected?.id === p.id ? '#E53E3E' : '#e5e7eb'}`,
                    cursor: 'pointer',
                    background: selected?.id === p.id ? '#fef2f2' : '#fff',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    transition: 'all 0.15s',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <strong>Pedido #{p.id}</strong>
                      <EstadoBadge estado={p.estado_codigo} />
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{formatFecha(p.fecha)}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#E53E3E', marginTop: 4 }}>
                      {formatPrecio(p.total)}
                    </div>
                  </div>
                  <span style={{ color: '#9ca3af', fontSize: 18 }}>›</span>
                </div>
              ))}

              {response.total > response.page_size && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 8 }}>
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #d1d5db', cursor: 'pointer' }}
                  >‹</button>
                  <span style={{ fontSize: 13, color: '#6b7280', padding: '6px 0' }}>
                    {page} / {response.pages}
                  </span>
                  <button
                    disabled={page === response.pages}
                    onClick={() => setPage(page + 1)}
                    style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #d1d5db', cursor: 'pointer' }}
                  >›</button>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', padding: 24, position: 'sticky', top: 84 }}>
          {selected ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid #e5e7eb' }}>
                <h3 style={{ margin: 0, fontSize: 17 }}>Pedido #{selected.id}</h3>
                <EstadoBadge estado={selected.estado_codigo} />
              </div>

              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', margin: '0 0 8px' }}>PRODUCTOS</p>
                {selected.items.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                    <span>{item.cantidad}x {item.producto_nombre}</span>
                    <strong>{formatPrecio(parseFloat(item.precio_unitario) * item.cantidad)}</strong>
                  </div>
                ))}
              </div>

              {selected.direccion && (
                <div style={{ paddingTop: 12, borderTop: '1px solid #e5e7eb' }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', margin: '0 0 4px' }}>DIRECCIÓN DE ENTREGA</p>
                  <p style={{ fontSize: 13, margin: 0 }}>
                    {selected.direccion.calle} {selected.direccion.numero}
                    {selected.direccion.piso && `, Piso ${selected.direccion.piso}`}
                    , {selected.direccion.ciudad}
                  </p>
                </div>
              )}

              <div style={{ paddingTop: 12, borderTop: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700 }}>
                  <span>Total pagado</span>
                  <span style={{ color: '#E53E3E' }}>{formatPrecio(selected.total)}</span>
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                  Forma de pago: {selected.forma_pago_codigo}
                </div>
              </div>

              <div style={{ paddingTop: 12, borderTop: '1px solid #e5e7eb' }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', margin: '0 0 8px' }}>HISTORIAL DE ESTADOS</p>
                {selected.historial.map((h) => (
                  <div key={h.id} style={{ paddingLeft: 10, borderLeft: '2px solid #e5e7eb', marginBottom: 8 }}>
                    <div style={{ fontWeight: 600, fontSize: 12 }}>{h.estado_nuevo_codigo}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>
                      {formatFecha(h.fecha)} — {h.usuario_nombre ?? 'Sistema'}
                    </div>
                  </div>
                ))}
              </div>

              {['PENDIENTE', 'CONFIRMADO'].includes(selected.estado_codigo) && (
                <button
                  disabled={cancelMutation.isPending}
                  onClick={() => {
                    if (confirm('¿Cancelar este pedido?')) cancelMutation.mutate(selected.id)
                  }}
                  style={{
                    background: cancelMutation.isPending ? '#fca5a5' : '#ef4444',
                    color: '#fff', border: 'none', borderRadius: 8,
                    padding: '10px 0', fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  {cancelMutation.isPending ? 'Cancelando...' : 'Cancelar Pedido'}
                </button>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '48px 16px', color: '#9ca3af' }}>
              Seleccioná un pedido para ver el detalle e historial.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
