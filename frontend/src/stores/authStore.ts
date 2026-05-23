// ─── stores/authStore.ts ──────────────────────────────────────────────────────
// Store global de autenticación usando Zustand.
//
// Zustand es una librería de manejo de estado global simplificada.
// A diferencia de Redux, no necesita reducers ni actions; el estado
// y las funciones que lo modifican se definen juntos en un solo objeto.
//
// El middleware "persist" guarda automáticamente el estado en localStorage,
// por eso al recargar la página el usuario sigue logueado.

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Definición de la "forma" del estado del store (TypeScript interface)
interface AuthState {
  // ─── Datos del usuario logueado ───
  token: string | null       // access token JWT (null = no logueado)
  userId: number | null
  email: string | null
  nombre: string | null
  roles: string[]            // ej: ["ADMIN"] o ["CLIENT"]

  // ─── Acciones (funciones que modifican el estado) ───
  setAuth: (token: string, userId: number, email: string, nombre: string, roles: string[]) => void
  logout: () => void

  // ─── Selectores (funciones derivadas del estado) ───
  isAuthenticated: () => boolean
  isAdmin: () => boolean
  hasRole: (role: string) => boolean
}

// create<AuthState>() → crea el hook useAuthStore con el tipo correcto
// persist(...) → envuelve el store para que persista en localStorage
export const useAuthStore = create<AuthState>()(
  persist(
    // (set, get) → funciones de Zustand:
    //   set: actualiza el estado (como setState en React)
    //   get: lee el estado actual (necesario dentro de funciones del store)
    (set, get) => ({
      // Estado inicial: sin usuario logueado
      token: null,
      userId: null,
      email: null,
      nombre: null,
      roles: [],

      // setAuth: se llama tras un login exitoso para guardar todos los datos
      setAuth: (token, userId, email, nombre, roles) =>
        set({ token, userId, email, nombre, roles }),

      // logout: limpia todo el estado (equivale al estado inicial)
      logout: () =>
        set({ token: null, userId: null, email: null, nombre: null, roles: [] }),

      // isAuthenticated: devuelve true si hay un token guardado
      isAuthenticated: () => get().token !== null,

      // isAdmin: verifica si el array de roles incluye "ADMIN"
      isAdmin: () => get().roles.includes('ADMIN'),

      // hasRole: verificación genérica para cualquier rol
      hasRole: (role) => get().roles.includes(role),
    }),

    // Opciones del middleware persist:
    // name: clave usada en localStorage para guardar este store
    { name: 'auth-storage' }
  )
)
