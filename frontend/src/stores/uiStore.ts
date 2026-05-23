import { create } from 'zustand'

interface UiState {
  cartOpen: boolean

  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
}

export const useUiStore = create<UiState>((set) => ({
  cartOpen: false,

  openCart:   () => set({ cartOpen: true }),
  closeCart:  () => set({ cartOpen: false }),

  toggleCart: () => set((s) => ({ cartOpen: !s.cartOpen })),
}))
