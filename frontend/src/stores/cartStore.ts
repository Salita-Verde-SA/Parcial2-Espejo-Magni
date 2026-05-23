// ─── stores/cartStore.ts ──────────────────────────────────────────────────────
// Store global del carrito de compras.
//
// Persiste en localStorage → si el usuario cierra y reabre la pestaña,
// los productos siguen en el carrito.
//
// El carrito vive en el frontend hasta que se confirma el pedido.
// Recién entonces se envía al backend (POST /api/v1/pedidos/).

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, Producto } from '../types'

// Forma del estado del carrito
interface CartState {
  items: CartItem[]   // lista de ítems en el carrito

  // Acciones
  addItem: (producto: Producto, cantidad: number, personalizacion: number[]) => void
  removeItem: (productoId: number) => void
  updateCantidad: (productoId: number, cantidad: number) => void
  clearCart: () => void

  // Selectores calculados
  total: () => number
  itemCount: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      // ─── addItem ────────────────────────────────────────────────────────────
      // Agrega un producto al carrito.
      // Si el producto YA existe, solo suma la cantidad (no lo duplica).
      // Si es nuevo, lo agrega al final del array.
      addItem: (producto, cantidad, personalizacion) => {
        const existing = get().items.find((i) => i.producto.id === producto.id)
        if (existing) {
          // map: recorre todos los items y devuelve uno nuevo modificado
          // solo para el item que coincide con el id
          set({
            items: get().items.map((i) =>
              i.producto.id === producto.id
                ? { ...i, cantidad: i.cantidad + cantidad }  // spread + override
                : i
            ),
          })
        } else {
          // spread del array actual + nuevo item al final
          set({ items: [...get().items, { producto, cantidad, personalizacion }] })
        }
      },

      // ─── removeItem ─────────────────────────────────────────────────────────
      // Elimina un producto del carrito por su ID.
      // filter: devuelve solo los items cuyo id NO sea el eliminado.
      removeItem: (productoId) =>
        set({ items: get().items.filter((i) => i.producto.id !== productoId) }),

      // ─── updateCantidad ──────────────────────────────────────────────────────
      // Cambia la cantidad de un producto.
      // Si la cantidad llega a 0 o menos, lo elimina del carrito.
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

      // ─── clearCart ───────────────────────────────────────────────────────────
      // Vacía el carrito por completo
      clearCart: () => set({ items: [] }),

      // ─── total ───────────────────────────────────────────────────────────────
      // Calcula el precio total sumando precio * cantidad de cada ítem.
      // reduce: itera acumulando (sum es el acumulador, empieza en 0)
      // parseFloat: convierte el precio de string a número decimal
      total: () =>
        get().items.reduce(
          (sum, i) => sum + parseFloat(i.producto.precio_base) * i.cantidad,
          0
        ),

      // ─── itemCount ───────────────────────────────────────────────────────────
      // Cuenta el total de unidades (no tipos de producto).
      // Ej: 2x Burger + 3x Papas = 5 ítems
      itemCount: () => get().items.reduce((sum, i) => sum + i.cantidad, 0),
    }),

    { name: 'cart-storage' }   // clave en localStorage
  )
)
