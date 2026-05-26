import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { fetchDirecciones, createDireccion } from '../api/direcciones'
import { createPedido } from '../api/pedidos'
import { useCartStore } from '../stores/cartStore'
import type { DireccionCreate, DireccionPublic } from '../types'

function formatPrecio(n: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
  }).format(n)
}

const FORMAS_PAGO = [
  { codigo: 'EFECTIVO', label: 'Efectivo', desc: 'Pagás al recibir tu pedido', icon: '💵' },
  { codigo: 'MERCADOPAGO', label: 'MercadoPago', desc: 'Pago rápido con tarjeta o saldo', icon: '💳' },
  { codigo: 'TARJETA', label: 'Tarjeta', desc: 'Crédito o débito al recibir', icon: '🏧' },
]

export default function CheckoutPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { items, total, clearCart } = useCartStore()

  const [selectedDirId, setSelectedDirId] = useState<number | null>(null)
  const [formaPago, setFormaPago] = useState('EFECTIVO')
  const [errorMsg, setErrorMsg] = useState('')
  const [showNewDir, setShowNewDir] = useState(false)
  const [newDir, setNewDir] = useState<DireccionCreate>({
    calle: '', numero: '', piso: '', departamento: '',
    ciudad: '', alias: 'Casa', principal: false,
  })

  const { data: direcciones, isLoading: loadingDirs } = useQuery<DireccionPublic[]>({
    queryKey: ['direcciones'],
    queryFn: fetchDirecciones,
  })

  useEffect(() => {
    if (direcciones) {
      const principal = direcciones.find((d) => d.principal)
      if (principal) setSelectedDirId(principal.id)
      else if (direcciones.length > 0 && selectedDirId === null) setSelectedDirId(direcciones[0].id)
    }
  }, [direcciones, selectedDirId])

  const createDirMutation = useMutation({
    mutationFn: createDireccion,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['direcciones'] })
      setSelectedDirId(data.id)
      setShowNewDir(false)
      setNewDir({ calle: '', numero: '', piso: '', departamento: '', ciudad: '', alias: 'Casa', principal: false })
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { detail?: string } } }
      setErrorMsg(e.response?.data?.detail ?? 'Error al guardar la dirección')
    },
  })

  const createPedidoMutation = useMutation({
    mutationFn: createPedido,
    onSuccess: () => {
      clearCart()
      queryClient.invalidateQueries({ queryKey: ['pedidos'] })
      navigate('/mis-pedidos')
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { detail?: string } } }
      setErrorMsg(e.response?.data?.detail ?? 'Error al procesar el pedido')
    },
  })

  function handleConfirmar() {
    if (items.length === 0) return setErrorMsg('El carrito está vacío')
    if (!selectedDirId) return setErrorMsg('Seleccioná una dirección de entrega')
    setErrorMsg('')
    createPedidoMutation.mutate({
      forma_pago_codigo: formaPago,
      direccion_id: selectedDirId,
      items: items.map((i) => ({ producto_id: i.producto.id, cantidad: i.cantidad })),
    })
  }

  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 16px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div>
        <h3>Tu carrito está vacío</h3>
        <p style={{ color: '#6b7280' }}>Agregá productos desde el catálogo.</p>
        <button
          onClick={() => navigate('/catalogo')}
          style={{
            background: '#E53E3E', color: '#fff', border: 'none',
            borderRadius: 8, padding: '10px 24px', fontWeight: 700,
            cursor: 'pointer', marginTop: 16,
          }}
        >
          Ir al Catálogo
        </button>
      </div>
    )
  }

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20, color: '#111827' }}>
        Finalizar Pedido
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'start' }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Sección dirección */}
          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 17 }}>📍 Dirección de Entrega</h3>
              {!showNewDir && (
                <button
                  onClick={() => setShowNewDir(true)}
                  style={{
                    background: 'none', color: '#E53E3E',
                    border: '1px solid #E53E3E', borderRadius: 6,
                    padding: '4px 12px', fontSize: 13, cursor: 'pointer',
                  }}
                >
                  + Nueva
                </button>
              )}
            </div>

            {loadingDirs ? (
              <p style={{ color: '#6b7280' }}>Cargando direcciones...</p>
            ) : showNewDir ? (
              <form
                onSubmit={(e) => { e.preventDefault(); createDirMutation.mutate(newDir) }}
                style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Calle *</label>
                    <input required value={newDir.calle} onChange={(e) => setNewDir({ ...newDir, calle: e.target.value })}
                      style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Número *</label>
                    <input required value={newDir.numero} onChange={(e) => setNewDir({ ...newDir, numero: e.target.value })}
                      style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14 }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Piso</label>
                    <input value={newDir.piso} onChange={(e) => setNewDir({ ...newDir, piso: e.target.value })}
                      style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Depto</label>
                    <input value={newDir.departamento} onChange={(e) => setNewDir({ ...newDir, departamento: e.target.value })}
                      style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Ciudad *</label>
                    <input required value={newDir.ciudad} onChange={(e) => setNewDir({ ...newDir, ciudad: e.target.value })}
                      style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14 }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Alias (ej: Casa, Trabajo)</label>
                  <input value={newDir.alias} onChange={(e) => setNewDir({ ...newDir, alias: e.target.value })}
                    style={{ display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 4, padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14 }} />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={newDir.principal} onChange={(e) => setNewDir({ ...newDir, principal: e.target.checked })} />
                  Marcar como dirección principal
                </label>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setShowNewDir(false)}
                    style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>
                    Cancelar
                  </button>
                  <button type="submit" disabled={createDirMutation.isPending}
                    style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#E53E3E', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                    {createDirMutation.isPending ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </form>
            ) : direcciones && direcciones.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {direcciones.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => setSelectedDirId(d.id)}
                    style={{
                      padding: 14, borderRadius: 10, cursor: 'pointer',
                      border: `2px solid ${selectedDirId === d.id ? '#E53E3E' : '#e5e7eb'}`,
                      background: selectedDirId === d.id ? '#fef2f2' : '#fff',
                      display: 'flex', alignItems: 'center', gap: 12,
                    }}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%',
                      border: `2px solid ${selectedDirId === d.id ? '#E53E3E' : '#d1d5db'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      {selectedDirId === d.id && (
                        <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#E53E3E' }} />
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>
                        {d.alias}
                        {d.principal && (
                          <span style={{ marginLeft: 6, fontSize: 10, background: '#dbeafe', color: '#1d4ed8', borderRadius: 4, padding: '1px 6px' }}>
                            Principal
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>
                        {d.calle} {d.numero}{d.piso ? `, Piso ${d.piso}` : ''} — {d.ciudad}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#6b7280', textAlign: 'center', padding: '16px 0' }}>
                No tenés direcciones guardadas. Agregá una nueva.
              </p>
            )}
          </div>

          {/* Forma de pago */}
          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', padding: 24 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 17 }}>💵 Forma de Pago</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {FORMAS_PAGO.map((fp) => (
                <div
                  key={fp.codigo}
                  onClick={() => setFormaPago(fp.codigo)}
                  style={{
                    padding: 14, borderRadius: 10, cursor: 'pointer',
                    border: `2px solid ${formaPago === fp.codigo ? '#E53E3E' : '#e5e7eb'}`,
                    background: formaPago === fp.codigo ? '#fef2f2' : '#fff',
                    display: 'flex', alignItems: 'center', gap: 14,
                  }}
                >
                  <span style={{ fontSize: 22 }}>{fp.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{fp.label}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{fp.desc}</div>
                  </div>
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%',
                    border: `2px solid ${formaPago === fp.codigo ? '#E53E3E' : '#d1d5db'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {formaPago === fp.codigo && (
                      <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#E53E3E' }} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Resumen */}
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', padding: 24, position: 'sticky', top: 84 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 17 }}>🛒 Resumen</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 220, overflowY: 'auto', marginBottom: 16 }}>
            {items.map((item) => (
              <div key={item.producto.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{item.producto.nombre}</div>
                  <div style={{ color: '#6b7280' }}>{item.cantidad} × {formatPrecio(parseFloat(item.producto.precio_base))}</div>
                </div>
                <strong>{formatPrecio(parseFloat(item.producto.precio_base) * item.cantidad)}</strong>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b7280', marginBottom: 6 }}>
              <span>Subtotal</span><span>{formatPrecio(total())}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b7280', marginBottom: 14 }}>
              <span>Envío</span>
              <span style={{ color: '#065f46', fontWeight: 600 }}>Gratis</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, fontWeight: 800 }}>
              <span>Total</span>
              <span style={{ color: '#E53E3E' }}>{formatPrecio(total())}</span>
            </div>
          </div>

          <button
            onClick={handleConfirmar}
            disabled={createPedidoMutation.isPending || !selectedDirId}
            style={{
              width: '100%', marginTop: 20, padding: '14px 0',
              background: createPedidoMutation.isPending || !selectedDirId ? '#fc8181' : '#E53E3E',
              color: '#fff', border: 'none', borderRadius: 10,
              fontWeight: 700, fontSize: 16,
              cursor: createPedidoMutation.isPending || !selectedDirId ? 'not-allowed' : 'pointer',
            }}
          >
            {createPedidoMutation.isPending ? 'Procesando...' : 'Confirmar Pedido →'}
          </button>
        </div>
      </div>
    </div>
  )
}
