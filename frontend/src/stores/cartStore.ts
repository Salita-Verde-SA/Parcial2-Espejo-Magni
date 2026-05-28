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

/** Store del carrito de compras que persiste en localStorage; mantiene la lista de productos seleccionados con sus cantidades. */
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      /** Agrega un producto al carrito; si ya existe, incrementa su cantidad en lugar de duplicarlo. */
      addItem: (producto, cantidad, personalizacion) => {
        const existing = get().items.find((i) => i.producto.id === producto.id)
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.producto.id === producto.id
                ? { ...i, cantidad: i.cantidad + cantidad }
                : i
            ),
          })
        } else {
          set({ items: [...get().items, { producto, cantidad, personalizacion }] })
        }
      },

      /** Elimina del carrito el item correspondiente al productoId indicado. */
      removeItem: (productoId) =>
        set({ items: get().items.filter((i) => i.producto.id !== productoId) }),

      /** Actualiza la cantidad de un item; si la nueva cantidad es 0 o menor, lo elimina del carrito. */
      updateCantidad: (productoId, cantidad) => {
        if (cantidad <= 0) {
          get().removeItem(productoId)
          return
        }
        set({
          items: get().items.map((i) =>
            i.producto.id === productoId ? { ...i, cantidad } : i
          ),
        })
      },

      /** Vacía completamente el carrito eliminando todos los items. */
      clearCart: () => set({ items: [] }),

      /** Calcula y retorna el precio total del carrito sumando precio_base * cantidad de cada item. */
      total: () =>
        get().items.reduce(
          (sum, i) => sum + parseFloat(i.producto.precio_base) * i.cantidad,
          0
        ),

      /** Retorna la cantidad total de unidades en el carrito (suma de cantidades de todos los items). */
      itemCount: () => get().items.reduce((sum, i) => sum + i.cantidad, 0),
    }),

    { name: 'cart-storage' }
  )
)
