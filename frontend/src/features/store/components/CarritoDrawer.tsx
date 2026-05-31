import { useNavigate } from 'react-router-dom'
import { useCartStore } from '../../../stores/cartStore'
import { useUiStore } from '../../../stores/uiStore'
import { useEffect, useState } from 'react'

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
  const { items, removeItem, updateCantidad, clearCart, total } = useCartStore()
  const closeCart = useUiStore((s) => s.closeCart)
  const [isOpen, setIsOpen] = useState(false)

  // Para la animación de entrada
  useEffect(() => {
    setIsOpen(true)
    return () => setIsOpen(false)
  }, [])

  const handleClose = () => {
    setIsOpen(false)
    setTimeout(closeCart, 300) // Esperar animación
  }

  return (
    <div
      className={`fixed inset-0 z-[200] flex justify-end transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      onClick={handleClose}
    >
      {/* Overlay oscuro */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300" />

      {/* Panel del carrito */}
      <div
        className={`relative w-full max-w-[420px] h-full bg-[#08080A]/80 backdrop-blur-2xl border-l border-white/10 shadow-2xl flex flex-col transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center shadow-lg shadow-red-500/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Tu Carrito</h2>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Lista de Items */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-70">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-1">El carrito está vacío</h3>
              <p className="text-sm text-neutral-400">Agrega productos para comenzar tu pedido.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.producto.id}
                  className="group bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl p-3 flex items-center gap-4 transition-colors"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-neutral-800 to-black rounded-xl flex items-center justify-center text-white/50 font-black text-xl flex-shrink-0 shadow-inner overflow-hidden">
                    {item.producto.imagen_url ? (
                      <img src={item.producto.imagen_url} alt={item.producto.nombre} className="w-full h-full object-cover" />
                    ) : (
                      item.producto.nombre[0].toUpperCase()
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white text-sm truncate">{item.producto.nombre}</h4>
                    <div className="text-xs text-neutral-400 font-medium mt-0.5">
                      {formatPrecio(parseFloat(item.producto.precio_base), (item.producto as any).unidad_venta?.simbolo)} c/u
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center bg-black/50 rounded-lg p-1 border border-white/5">
                      <button
                        className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                        onClick={() => updateCantidad(item.producto.id, item.cantidad - 1)}
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>
                      </button>
                      <span className="w-6 text-center text-sm font-bold text-white">
                        {item.cantidad}
                      </span>
                      <button
                        className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                        onClick={() => updateCantidad(item.producto.id, item.cantidad + 1)}
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                      </button>
                    </div>
                  </div>

                  <button
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                    onClick={() => removeItem(item.producto.id)}
                    title="Eliminar"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-6 border-t border-white/10 bg-black/40 backdrop-blur-xl">
            <div className="flex justify-between items-end mb-6">
              <span className="text-neutral-400 font-medium">Total a pagar</span>
              <span className="text-3xl font-black text-red-600">
                {formatPrecio(total())}
              </span>
            </div>

            <div className="space-y-3">
              <button
                className="w-full appearance-none border-none bg-red-600 from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold rounded-xl px-4 py-4 shadow-[0_4px_15px_rgba(220,38,38,0.3)] hover:shadow-[0_8px_25px_rgba(220,38,38,0.5)] transition-all duration-300 transform active:scale-95 flex items-center justify-center uppercase tracking-widest text-sm"
                onClick={() => {
                  handleClose()
                  navigate('/checkout')
                }}
              >
                Confirmar Pedido
              </button>
              <button
                className="w-full appearance-none border-none bg-transparent hover:bg-white/5 text-neutral-400 hover:text-white font-bold rounded-xl px-4 py-3 transition-colors uppercase tracking-widest text-xs"
                onClick={() => clearCart()}
              >
                Vaciar carrito
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}
