import { useNavigate } from 'react-router-dom'
import { useCartStore } from '../stores/cartStore'
import { useUiStore } from '../stores/uiStore'

function formatPrecio(n: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(n)
}

export default function CarritoDrawer() {
  const navigate = useNavigate()
  const { items, removeItem, updateCantidad, clearCart, total } = useCartStore()
  const closeCart = useUiStore((s) => s.closeCart)

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', justifyContent: 'flex-end' }}
      onClick={closeCart}
    >
      <div
        style={{
          width: 380,
          maxWidth: '100vw',
          background: '#fff',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontWeight: 700, fontSize: 18 }}>Tu Carrito</span>
          <button
            onClick={closeCart}
            style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#6b7280' }}
          >
            ×
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 16px', color: '#6b7280' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🛒</div>
              <p>Tu carrito está vacío</p>
              <p style={{ fontSize: 13 }}>Agregá productos desde el catálogo</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.producto.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 0',
                  borderBottom: '1px solid #f3f4f6',
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 8,
                  background: 'linear-gradient(135deg, #fc8181, #E53E3E)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 800, fontSize: 16, flexShrink: 0,
                }}>
                  {item.producto.nombre[0].toUpperCase()}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.producto.nombre}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>
                    {formatPrecio(parseFloat(item.producto.precio_base))} c/u
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    onClick={() => updateCantidad(item.producto.id, item.cantidad - 1)}
                    style={{
                      width: 26, height: 26, borderRadius: 6,
                      border: '1px solid #d1d5db',
                      background: '#f9fafb', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700,
                    }}
                  >−</button>
                  <span style={{ minWidth: 20, textAlign: 'center', fontWeight: 600 }}>{item.cantidad}</span>
                  <button
                    onClick={() => updateCantidad(item.producto.id, item.cantidad + 1)}
                    style={{
                      width: 26, height: 26, borderRadius: 6,
                      border: '1px solid #d1d5db',
                      background: '#f9fafb', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700,
                    }}
                  >+</button>
                </div>

                <span style={{ fontWeight: 700, fontSize: 13, minWidth: 60, textAlign: 'right' }}>
                  {formatPrecio(parseFloat(item.producto.precio_base) * item.cantidad)}
                </span>

                <button
                  onClick={() => removeItem(item.producto.id)}
                  style={{
                    background: 'none', border: 'none',
                    color: '#ef4444', cursor: 'pointer', fontSize: 16,
                  }}
                >×</button>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div style={{ padding: 16, borderTop: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16 }}>
              <span>Total:</span>
              <span style={{ color: '#E53E3E' }}>{formatPrecio(total())}</span>
            </div>
            <button
              onClick={() => { closeCart(); navigate('/checkout') }}
              style={{
                background: '#E53E3E', color: '#fff',
                border: 'none', borderRadius: 8,
                padding: '12px 0', fontWeight: 700, fontSize: 15,
                cursor: 'pointer', width: '100%',
              }}
            >
              Confirmar Pedido →
            </button>
            <button
              onClick={clearCart}
              style={{
                background: 'none', color: '#6b7280',
                border: '1px solid #d1d5db', borderRadius: 8,
                padding: '8px 0', fontSize: 13, cursor: 'pointer', width: '100%',
              }}
            >
              Vaciar carrito
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
