import { create } from 'zustand'

interface UiState {
  cartOpen: boolean

  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
}

/** Store de estado de la interfaz (UI); controla si el drawer del carrito está abierto o cerrado. */
export const useUiStore = create<UiState>((set) => ({
  cartOpen: false,

  /** Establece cartOpen en true para mostrar el drawer del carrito. */
  openCart:   () => set({ cartOpen: true }),

  /** Establece cartOpen en false para ocultar el drawer del carrito. */
  closeCart:  () => set({ cartOpen: false }),

  /** Invierte el estado actual de cartOpen (abre si estaba cerrado, cierra si estaba abierto). */
  toggleCart: () => set((s) => ({ cartOpen: !s.cartOpen })),
}))
