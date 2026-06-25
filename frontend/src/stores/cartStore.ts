import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, Producto } from '../types'

interface CartState {
  items: CartItem[]

  addItem: (producto: Producto, cantidad: number, personalizacion: number[]) => void
  removeItem: (productoId: number) => void
  updateCantidad: (productoId: number, cantidad: number) => void
  clearCart: () => void

  total: () => number
  itemCount: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (producto, cantidad, personalizacion) => {
        const maxStock = producto.stock_cantidad
        if (maxStock <= 0) return
        const existing = get().items.find((i) => i.producto.id === producto.id)
        if (existing) {
          const nuevaCant = Math.min(existing.cantidad + cantidad, maxStock)
          set({
            items: get().items.map((i) =>
              i.producto.id === producto.id
                ? { ...i, cantidad: nuevaCant }
                : i
            ),
          })
        } else {
          set({
            items: [
              ...get().items,
              { producto, cantidad: Math.min(cantidad, maxStock), personalizacion },
            ],
          })
        }
      },

      removeItem: (productoId) =>
        set({ items: get().items.filter((i) => i.producto.id !== productoId) }),

      updateCantidad: (productoId, cantidad) => {
        if (cantidad <= 0) {
          get().removeItem(productoId)
          return
        }
        set({
          items: get().items.map((i) =>
            i.producto.id === productoId
              ? { ...i, cantidad: Math.min(cantidad, i.producto.stock_cantidad) }
              : i
          ),
        })
      },

      clearCart: () => set({ items: [] }),

      total: () =>
        get().items.reduce(
          (sum, i) => sum + parseFloat(i.producto.precio_base) * i.cantidad,
          0
        ),

      itemCount: () => get().items.reduce((sum, i) => sum + i.cantidad, 0),
    }),

    { name: 'cart-storage' }
  )
)
