// ─── stores/uiStore.ts ────────────────────────────────────────────────────────
// Store global para el estado de la interfaz de usuario.
// Guarda qué elementos de la UI están abiertos/cerrados.
// No persiste en localStorage (es estado efímero de pantalla).

import { create } from 'zustand'

// Forma del estado
interface UiState {
  cartOpen: boolean      // true = el drawer del carrito está visible

  openCart: () => void   // abre el carrito
  closeCart: () => void  // cierra el carrito
  toggleCart: () => void // alterna abierto/cerrado (usado por el botón de navbar)
}

// create sin persist → el estado se resetea al recargar la página
export const useUiStore = create<UiState>((set) => ({
  cartOpen: false,

  openCart:   () => set({ cartOpen: true }),
  closeCart:  () => set({ cartOpen: false }),

  // toggleCart usa la forma funcional de set:
  // recibe el estado actual (s) y devuelve el nuevo estado
  // → invierte el valor booleano de cartOpen
  toggleCart: () => set((s) => ({ cartOpen: !s.cartOpen })),
}))
