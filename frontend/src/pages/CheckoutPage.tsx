import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { fetchDirecciones, createDireccion } from '../api/direcciones'
import { createPedido } from '../api/pedidos'
import { useCartStore } from '../stores/cartStore'
import type { DireccionCreate, DireccionPublic } from '../types'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { items, total, clearCart } = useCartStore()
  
  const [selectedDirId, setSelectedDirId] = useState<number | null>(null)
  const [formaPago, setFormaPago] = useState<string>('EFECTIVO')
  const [errorMsg, setErrorMsg] = useState<string>('')

  // Formulario de nueva dirección
  const [showNewDirForm, setShowNewDirForm] = useState(false)
  const [newDir, setNewDir] = useState<DireccionCreate>({
    calle: '',
    numero: '',
    piso: '',
    departamento: '',
    ciudad: '',
    alias: 'Casa',
    principal: false,
  })

  // Obtener direcciones del usuario
  const { data: direcciones, isLoading: loadingDirs } = useQuery<DireccionPublic[]>({
    queryKey: ['direcciones'],
    queryFn: fetchDirecciones,
  })

  useEffect(() => {
    if (direcciones) {
      const principal = direcciones.find((d) => d.principal)
      if (principal) {
        setSelectedDirId(principal.id)
      } else if (direcciones.length > 0 && selectedDirId === null) {
        setSelectedDirId(direcciones[0].id)
      }
    }
  }, [direcciones, selectedDirId])

  // Mutación para crear dirección
  const createDirMutation = useMutation({
    mutationFn: createDireccion,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['direcciones'] })
      setSelectedDirId(data.id)
      setShowNewDirForm(false)
      setNewDir({
        calle: '',
        numero: '',
        piso: '',
        departamento: '',
        ciudad: '',
        alias: 'Casa',
        principal: false,
      })
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.detail || 'Error al crear la dirección')
    },
  })

  // Mutación para crear pedido
  const createPedidoMutation = useMutation({
    mutationFn: createPedido,
    onSuccess: () => {
      clearCart()
      navigate('/mis-pedidos')
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.detail || 'Error al procesar el pedido')
    },
  })

  function handleCreateDireccion(e: React.FormEvent) {
    e.preventDefault()
    if (!newDir.calle || !newDir.numero || !newDir.ciudad) {
      setErrorMsg('Por favor completa los campos requeridos de la dirección')
      return
    }
    createDirMutation.mutate(newDir)
  }

  function handleConfirmarPedido() {
    if (items.length === 0) {
      setErrorMsg('El carrito está vacío')
      return
    }
    if (!selectedDirId) {
      setErrorMsg('Por favor selecciona una dirección de entrega')
      return
    }
    setErrorMsg('')

    const orderData = {
      forma_pago_codigo: formaPago,
      direccion_id: selectedDirId,
      items: items.map((i) => ({
        producto_id: i.producto.id,
        cantidad: i.cantidad,
      })),
    }

    createPedidoMutation.mutate(orderData)
  }

  const formatPrecio = (n: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(n)

  if (items.length === 0) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 16px' }}>
        <h3>Tu carrito está vacío</h3>
        <p style={{ color: 'var(--text-muted)' }}>Agrega productos del catálogo para continuar.</p>
        <button className="btn btn-primary" onClick={() => navigate('/catalogo')} style={{ marginTop: 16 }}>
          Ir al Catálogo
        </button>
      </div>
    )
  }

  return (
    <>
      <header className="topbar">
        <span className="topbar-title">Finalizar Pedido</span>
      </header>

      <div className="page-wrapper" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' }}>
        
        {/* Lado Izquierdo: Direcciones y Pago */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Mensaje de Error */}
          {errorMsg && (
            <div className="badge badge-danger" style={{ padding: 12, borderRadius: 8, fontSize: 13, display: 'block', textAlign: 'left' }}>
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Sección 1: Dirección de Entrega */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>📍 Dirección de Entrega</h3>
              {!showNewDirForm && (
                <button className="btn btn-ghost btn-sm" onClick={() => setShowNewDirForm(true)}>
                  + Nueva Dirección
                </button>
              )}
            </div>

            {loadingDirs ? (
              <div>Cargando direcciones...</div>
            ) : showNewDirForm ? (
              <form onSubmit={handleCreateDireccion} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Calle *</label>
                    <input
                      type="text"
                      className="filtro-input"
                      style={{ width: '100%', marginTop: 4 }}
                      value={newDir.calle}
                      onChange={(e) => setNewDir({ ...newDir, calle: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Número *</label>
                    <input
                      type="text"
                      className="filtro-input"
                      style={{ width: '100%', marginTop: 4 }}
                      value={newDir.numero}
                      onChange={(e) => setNewDir({ ...newDir, numero: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Piso (Opcional)</label>
                    <input
                      type="text"
                      className="filtro-input"
                      style={{ width: '100%', marginTop: 4 }}
                      value={newDir.piso}
                      onChange={(e) => setNewDir({ ...newDir, piso: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Depto (Opcional)</label>
                    <input
                      type="text"
                      className="filtro-input"
                      style={{ width: '100%', marginTop: 4 }}
                      value={newDir.departamento}
                      onChange={(e) => setNewDir({ ...newDir, departamento: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Ciudad *</label>
                    <input
                      type="text"
                      className="filtro-input"
                      style={{ width: '100%', marginTop: 4 }}
                      value={newDir.ciudad}
                      onChange={(e) => setNewDir({ ...newDir, ciudad: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Alias (Ej: Casa)</label>
                    <input
                      type="text"
                      className="filtro-input"
                      style={{ width: '100%', marginTop: 4 }}
                      value={newDir.alias}
                      onChange={(e) => setNewDir({ ...newDir, alias: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <input
                    type="checkbox"
                    id="chkPrincipal"
                    checked={newDir.principal}
                    onChange={(e) => setNewDir({ ...newDir, principal: e.target.checked })}
                  />
                  <label htmlFor="chkPrincipal" style={{ fontSize: 13, cursor: 'pointer' }}>Marcar como dirección principal</label>
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowNewDirForm(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={createDirMutation.isPending}>
                    {createDirMutation.isPending ? 'Guardando...' : 'Guardar Dirección'}
                  </button>
                </div>
              </form>
            ) : direcciones && direcciones.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {direcciones.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => setSelectedDirId(d.id)}
                    style={{
                      padding: 16,
                      border: `2px solid ${selectedDirId === d.id ? 'var(--primary)' : 'var(--border)'}`,
                      borderRadius: 12,
                      cursor: 'pointer',
                      background: selectedDirId === d.id ? 'rgba(var(--primary-rgb), 0.05)' : 'var(--surface)',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <strong style={{ fontSize: 14 }}>{d.alias}</strong>
                        {d.principal && (
                          <span className="badge badge-primary" style={{ fontSize: 9 }}>Principal</span>
                        )}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                        {d.calle} {d.numero}
                        {d.piso && `, Piso ${d.piso}`}
                        {d.departamento && `, Depto ${d.departamento}`}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{d.ciudad}</div>
                    </div>
                    <div style={{
                      width: 20, height: 20,
                      borderRadius: '50%',
                      border: `2px solid ${selectedDirId === d.id ? 'var(--primary)' : 'var(--text-muted)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {selectedDirId === d.id && (
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--primary)' }} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                No tienes direcciones guardadas. Por favor crea una nueva para proceder.
              </div>
            )}
          </div>

          {/* Sección 2: Forma de Pago */}
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 18 }}>💵 Forma de Pago</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              
              <div
                onClick={() => setFormaPago('EFECTIVO')}
                style={{
                  padding: 16,
                  border: `2px solid ${formaPago === 'EFECTIVO' ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: 12,
                  cursor: 'pointer',
                  background: formaPago === 'EFECTIVO' ? 'rgba(var(--primary-rgb), 0.05)' : 'var(--surface)',
                  display: 'flex', alignItems: 'center', justifyItems: 'center', gap: 12,
                }}
              >
                <div style={{ fontSize: 20 }}>💵</div>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: 14, display: 'block' }}>Efectivo</strong>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Pago en efectivo al recibir tu pedido</span>
                </div>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  border: `2px solid ${formaPago === 'EFECTIVO' ? 'var(--primary)' : 'var(--text-muted)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {formaPago === 'EFECTIVO' && (
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--primary)' }} />
                  )}
                </div>
              </div>

              <div
                onClick={() => setFormaPago('MERCADOPAGO')}
                style={{
                  padding: 16,
                  border: `2px solid ${formaPago === 'MERCADOPAGO' ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: 12,
                  cursor: 'pointer',
                  background: formaPago === 'MERCADOPAGO' ? 'rgba(var(--primary-rgb), 0.05)' : 'var(--surface)',
                  display: 'flex', alignItems: 'center', justifyItems: 'center', gap: 12,
                }}
              >
                <div style={{ fontSize: 20 }}>💳</div>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: 14, display: 'block' }}>MercadoPago</strong>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Pago rápido y seguro con tarjeta o saldo de MP</span>
                </div>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  border: `2px solid ${formaPago === 'MERCADOPAGO' ? 'var(--primary)' : 'var(--text-muted)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {formaPago === 'MERCADOPAGO' && (
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--primary)' }} />
                  )}
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Lado Derecho: Resumen del Carrito */}
        <div className="card" style={{ padding: 24, position: 'sticky', top: 24 }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 18 }}>🛒 Resumen del Pedido</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 200, overflowY: 'auto', marginBottom: 16, paddingRight: 4 }}>
            {items.map((item) => (
              <div key={item.producto.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {item.producto.nombre}
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>{item.cantidad} x {formatPrecio(parseFloat(item.producto.precio_base))}</div>
                </div>
                <strong style={{ marginLeft: 8 }}>{formatPrecio(parseFloat(item.producto.precio_base) * item.cantidad)}</strong>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)' }}>
              <span>Subtotal</span>
              <span>{formatPrecio(total())}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)' }}>
              <span>Envío</span>
              <span style={{ color: 'var(--success)', fontWeight: 600 }}>Gratis</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, marginTop: 8 }}>
              <span>Total</span>
              <span style={{ color: 'var(--primary)' }}>{formatPrecio(total())}</span>
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleConfirmarPedido}
            disabled={createPedidoMutation.isPending || !selectedDirId}
            style={{ width: '100%', marginTop: 24, padding: 12, fontSize: 15 }}
          >
            {createPedidoMutation.isPending ? 'Procesando...' : 'Confirmar Pedido'}
          </button>
        </div>

      </div>
    </>
  )
}
