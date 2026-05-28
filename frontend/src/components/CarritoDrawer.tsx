import { useNavigate } from 'react-router-dom'
import { useCartStore } from '../stores/cartStore'
import { useUiStore } from '../stores/uiStore'

/** Formatea un número como precio en pesos argentinos; si se indica un símbolo de unidad, lo agrega al final separado por '/'. */
function formatPrecio(n: number, unidadSimbolo?: string) {
  const formatted = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(n)
  if (unidadSimbolo) {
    return `${formatted} / ${unidadSimbolo}`
  }
  return formatted
}

/** Componente drawer lateral derecho que muestra los productos en el carrito con controles de cantidad, precio total y botones para ir al checkout o vaciar el carrito. */
export default function CarritoDrawer() {
  const navigate = useNavigate()
  const { items, removeItem, updateCantidad, clearCart, total } = useCartStore()
  const closeCart = useUiStore((s) => s.closeCart)

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={closeCart}
    >
      <div
        style={{
          width: 400,
          maxWidth: '100vw',
          background: 'var(--surface)',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >

        <div className="modal-header">
          <span className="modal-title">Carrito</span>
          <button className="modal-close" onClick={closeCart}>×</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {items.length === 0 ? (
            <div className="empty-state">
              <h3>Carrito vacío</h3>
              <p>Agregá productos desde el catálogo.</p>
            </div>
          ) : (
            <>
              {items.map((item) => (
                <div
                  key={item.producto.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 0',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div style={{
                    width: 42, height: 42,
                    background: 'linear-gradient(135deg, var(--brand-light), var(--brand))',
                    borderRadius: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 800, fontSize: 16,
                    flexShrink: 0,
                  }}>
                    {item.producto.nombre[0].toUpperCase()}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{item.producto.nombre}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {formatPrecio(parseFloat(item.producto.precio_base), (item.producto as any).unidad_venta?.simbolo)} c/u
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button
                      className="page-btn"
                      style={{ padding: '2px 8px', minWidth: 28 }}
                      onClick={() => updateCantidad(item.producto.id, item.cantidad - 1)}
                    >−</button>
                    <span style={{ minWidth: 24, textAlign: 'center', fontSize: 14, fontWeight: 600 }}>
                      {item.cantidad}
                    </span>
                    <button
                      className="page-btn"
                      style={{ padding: '2px 8px', minWidth: 28 }}
                      onClick={() => updateCantidad(item.producto.id, item.cantidad + 1)}
                    >+</button>
                  </div>

                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => removeItem(item.producto.id)}
                    title="Eliminar"
                  >×</button>
                </div>
              ))}
            </>
          )}
        </div>

        {items.length > 0 && (
          <div className="modal-footer" style={{ flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700 }}>
              <span>Total:</span>
              <span style={{ color: 'var(--primary)' }}>{formatPrecio(total())}</span>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => {
                closeCart()
                navigate('/checkout')
              }}
              style={{ width: '100%', padding: '10px 0', fontSize: 15 }}
            >
              Comprar / Realizar Pedido
            </button>
            <button className="btn btn-ghost" onClick={() => clearCart()} style={{ width: '100%' }}>
              Vaciar carrito
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
