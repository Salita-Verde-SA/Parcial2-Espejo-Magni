import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  token: string | null
  userId: number | null
  email: string | null
  nombre: string | null
  roles: string[]

  setAuth: (token: string, userId: number, email: string, nombre: string, roles: string[]) => void
  logout: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      userId: null,
      email: null,
      nombre: null,
      roles: [],

      setAuth: (token, userId, email, nombre, roles) =>
        set({ token, userId, email, nombre, roles }),

      logout: () =>
        set({ token: null, userId: null, email: null, nombre: null, roles: [] }),

      isAuthenticated: () => get().token !== null,
    }),
    { name: 'store-auth-storage' }
  )
)
