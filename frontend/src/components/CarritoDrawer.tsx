// ─── components/CarritoDrawer.tsx ────────────────────────────────────────────
// Panel lateral deslizante (drawer) que muestra el carrito de compras.
// Se monta cuando cartOpen=true y se desmonta cuando cartOpen=false.
//
// Patrón "backdrop + panel":
//   - El div exterior ocupa toda la pantalla → clic cierra el carrito
//   - El panel blanco está a la derecha → clic dentro NO lo cierra (stopPropagation)

import { useNavigate } from 'react-router-dom'
import { useCartStore } from '../stores/cartStore'
import { useUiStore } from '../stores/uiStore'

// Formatea número a moneda argentina. Ej: 1500 → "$ 1.500 / kg"
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

export default function CarritoDrawer() {
  const navigate = useNavigate()
  // Extrae acciones y datos del store del carrito
  const { items, removeItem, updateCantidad, clearCart, total } = useCartStore()
  const closeCart = useUiStore((s) => s.closeCart)

  return (
    // Backdrop (fondo semitransparente): cubre toda la pantalla, clic cierra el drawer
    <div
      style={{
        position: 'fixed',
        inset: 0,       // equivale a top:0, right:0, bottom:0, left:0
        zIndex: 200,
        display: 'flex',
        justifyContent: 'flex-end',  // el panel se ubica a la derecha
      }}
      onClick={closeCart}
    >
      {/* Panel blanco del carrito (lado derecho) */}
      <div
        style={{
          width: 400,
          maxWidth: '100vw',    // en pantallas chicas no desborda
          background: 'var(--surface)',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
          overflow: 'hidden',
        }}
        // stopPropagation: evita que el clic dentro del panel llegue al backdrop
        // y cierre el drawer involuntariamente
        onClick={(e) => e.stopPropagation()}
      >

        {/* Encabezado del panel */}
        <div className="modal-header">
          <span className="modal-title">Carrito</span>
          <button className="modal-close" onClick={closeCart}>×</button>
        </div>

        {/* Área scrolleable con los ítems */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {items.length === 0 ? (
            // Estado vacío: sin productos en el carrito
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
                  {/* Avatar: cuadrado con gradiente rojo y la inicial del producto */}
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

                  {/* Nombre y precio unitario */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{item.producto.nombre}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {formatPrecio(parseFloat(item.producto.precio_base), (item.producto as any).unidad_venta?.simbolo)} c/u
                    </div>
                  </div>

                  {/* Controles de cantidad: botón − | número | botón + */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button
                      className="page-btn"
                      style={{ padding: '2px 8px', minWidth: 28 }}
                      // Si la cantidad llega a 0, updateCantidad lo elimina automáticamente
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

                  {/* Botón para eliminar el ítem completo del carrito */}
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

        {/* Footer: total + botón vaciar (solo visible cuando hay ítems) */}
        {items.length > 0 && (
          <div className="modal-footer" style={{ flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700 }}>
              <span>Total:</span>
              {/* total() calcula la suma en tiempo real desde el store */}
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
