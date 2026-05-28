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
  isAdmin: () => boolean
  hasRole: (role: string) => boolean
}

/** Store de autenticación que persiste en localStorage; almacena el token JWT, datos del usuario y sus roles. */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      userId: null,
      email: null,
      nombre: null,
      roles: [],

      /** Guarda el token, userId, email, nombre y roles en el estado al iniciar sesión. */
      setAuth: (token, userId, email, nombre, roles) =>
        set({ token, userId, email, nombre, roles }),

      /** Limpia todos los datos de autenticación del estado al cerrar sesión. */
      logout: () =>
        set({ token: null, userId: null, email: null, nombre: null, roles: [] }),

      /** Retorna true si hay un token activo en el estado. */
      isAuthenticated: () => get().token !== null,

      /** Retorna true si el usuario tiene el rol ADMIN. */
      isAdmin: () => get().roles.includes('ADMIN'),

      /** Retorna true si el usuario posee el rol indicado como argumento. */
      hasRole: (role) => get().roles.includes(role),
    }),

    { name: 'auth-storage' }
  )
)
