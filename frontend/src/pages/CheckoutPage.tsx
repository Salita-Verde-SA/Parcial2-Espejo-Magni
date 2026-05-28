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

  const [showNewDirForm, setShowNewDirForm] = useState(false)
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
      if (principal) {
        setSelectedDirId(principal.id)
      } else if (direcciones.length > 0 && selectedDirId === null) {
        setSelectedDirId(direcciones[0].id)
      }
    }
  }, [direcciones, selectedDirId])

  const createDirMutation = useMutation({
    mutationFn: createDireccion,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['direcciones'] })
      setSelectedDirId(data.id)
      setShowNewDirForm(false)
      setNewDir({ calle: '', numero: '', piso: '', departamento: '', ciudad: '', alias: 'Casa', principal: false })
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.detail || 'Error al crear la dirección')
    },
  })

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
      setErrorMsg('Completá los campos obligatorios de la dirección')
      return
    }
    createDirMutation.mutate(newDir)
  }

  function handleConfirmarPedido() {
    if (items.length === 0) { setErrorMsg('El carrito está vacío'); return }
    if (!selectedDirId) { setErrorMsg('Seleccioná una dirección de entrega'); return }
    setErrorMsg('')
    createPedidoMutation.mutate({
      forma_pago_codigo: formaPago,
      direccion_id: selectedDirId,
      items: items.map((i) => ({ producto_id: i.producto.id, cantidad: i.cantidad })),
    })
  }

  const formatPrecio = (n: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

  if (items.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 16px', gap: 16 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--bg)', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 28, color: 'var(--text-subtle)' }}>0</span>
        </div>
        <h3 style={{ margin: 0, color: 'var(--text)' }}>Carrito vacío</h3>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>Agregá productos desde el catálogo para continuar.</p>
        <button className="btn btn-primary" onClick={() => navigate('/catalogo')}>Ir al catálogo</button>
      </div>
    )
  }

  return (
    <>
      <header className="topbar">
        <span className="topbar-title">Finalizar pedido</span>
      </header>

      <div className="page-wrapper" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'start' }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

          {/* Dirección */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Dirección de entrega</span>
              {!showNewDirForm && (
                <button className="btn btn-ghost btn-sm" onClick={() => setShowNewDirForm(true)}>
                  Nueva dirección
                </button>
              )}
            </div>

            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {loadingDirs ? (
                <div style={{ textAlign: 'center', padding: 24 }}>
                  <span className="spinner spinner-dark" />
                </div>
              ) : showNewDirForm ? (
                <form onSubmit={handleCreateDireccion} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Calle *</label>
                      <input className="form-input" type="text" value={newDir.calle}
                        onChange={(e) => setNewDir({ ...newDir, calle: e.target.value })} required style={{ width: '100%' }} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Número *</label>
                      <input className="form-input" type="text" value={newDir.numero}
                        onChange={(e) => setNewDir({ ...newDir, numero: e.target.value })} required style={{ width: '100%' }} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Piso</label>
                      <input className="form-input" type="text" value={newDir.piso}
                        onChange={(e) => setNewDir({ ...newDir, piso: e.target.value })} style={{ width: '100%' }} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Departamento</label>
                      <input className="form-input" type="text" value={newDir.departamento}
                        onChange={(e) => setNewDir({ ...newDir, departamento: e.target.value })} style={{ width: '100%' }} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Ciudad *</label>
                      <input className="form-input" type="text" value={newDir.ciudad}
                        onChange={(e) => setNewDir({ ...newDir, ciudad: e.target.value })} required style={{ width: '100%' }} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Alias</label>
                      <input className="form-input" type="text" value={newDir.alias}
                        onChange={(e) => setNewDir({ ...newDir, alias: e.target.value })} style={{ width: '100%' }} />
                    </div>
                  </div>
                  <label className="checkbox-row">
                    <input type="checkbox" checked={newDir.principal}
                      onChange={(e) => setNewDir({ ...newDir, principal: e.target.checked })} />
                    Marcar como dirección principal
                  </label>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button type="button" className="btn btn-ghost" onClick={() => setShowNewDirForm(false)}>Cancelar</button>
                    <button type="submit" className="btn btn-primary" disabled={createDirMutation.isPending}>
                      {createDirMutation.isPending ? 'Guardando...' : 'Guardar dirección'}
                    </button>
                  </div>
                </form>
              ) : direcciones && direcciones.length > 0 ? (
                direcciones.map((d) => (
                  <div
                    key={d.id}
                    className={`seleccion-card ${selectedDirId === d.id ? 'selected' : ''}`}
                    onClick={() => setSelectedDirId(d.id)}
                  >
                    <div className="seleccion-card-radio">
                      {selectedDirId === d.id && <div className="seleccion-card-radio-dot" />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <strong style={{ fontSize: 14 }}>{d.alias}</strong>
                        {d.principal && <span className="badge badge-primary" style={{ fontSize: 9 }}>Principal</span>}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        {d.calle} {d.numero}
                        {d.piso && `, Piso ${d.piso}`}
                        {d.departamento && `, Depto ${d.departamento}`}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-subtle)' }}>{d.ciudad}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                  No tenés direcciones guardadas. Creá una nueva para continuar.
                </div>
              )}
            </div>
          </div>

          {/* Forma de pago */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Forma de pago</span>
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { codigo: 'EFECTIVO', label: 'Efectivo', desc: 'Pago en efectivo al recibir el pedido' },
                { codigo: 'MERCADOPAGO', label: 'MercadoPago', desc: 'Pago con tarjeta o saldo de MercadoPago' },
              ].map((op) => (
                <div
                  key={op.codigo}
                  className={`seleccion-card ${formaPago === op.codigo ? 'selected' : ''}`}
                  onClick={() => setFormaPago(op.codigo)}
                >
                  <div className="seleccion-card-radio">
                    {formaPago === op.codigo && <div className="seleccion-card-radio-dot" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: 14, display: 'block' }}>{op.label}</strong>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{op.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Resumen */}
        <div className="card" style={{ position: 'sticky', top: 24 }}>
          <div className="card-header">
            <span className="card-title">Resumen del pedido</span>
          </div>

          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 240, overflowY: 'auto' }}>
            {items.map((item) => (
              <div key={item.producto.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.producto.nombre}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                    {item.cantidad} unidad{item.cantidad !== 1 ? 'es' : ''}
                  </div>
                </div>
                <strong style={{ marginLeft: 8, flexShrink: 0 }}>
                  {formatPrecio(parseFloat(item.producto.precio_base) * item.cantidad)}
                </strong>
              </div>
            ))}
          </div>

          <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)' }}>
              <span>Subtotal</span>
              <span>{formatPrecio(total())}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-muted)' }}>Envío</span>
              <span style={{ color: 'var(--success)', fontWeight: 600 }}>Gratis</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 800, paddingTop: 8, borderTop: '1px solid var(--border)', marginTop: 4 }}>
              <span>Total</span>
              <span style={{ color: 'var(--brand)' }}>{formatPrecio(total())}</span>
            </div>

            <button
              className="btn btn-primary"
              onClick={handleConfirmarPedido}
              disabled={createPedidoMutation.isPending || !selectedDirId}
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15, marginTop: 8 }}
            >
              {createPedidoMutation.isPending
                ? <><span className="spinner" /> Procesando...</>
                : 'Confirmar pedido'}
            </button>
          </div>
        </div>

      </div>
    </>
  )
}
