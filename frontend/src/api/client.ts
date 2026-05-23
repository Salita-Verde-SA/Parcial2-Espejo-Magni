// ─── api/client.ts ────────────────────────────────────────────────────────────
// Configura el cliente HTTP (Axios) que usan todas las funciones de la API.
// Contiene dos interceptores:
//   1. Request: agrega el Bearer token a cada petición automáticamente.
//   2. Response: si el servidor responde 401 (token expirado), intenta
//      renovarlo con el refresh token antes de reintentar la petición.

import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

// Clave usada en sessionStorage para guardar el refresh token.
// sessionStorage se borra al cerrar la pestaña/navegador (más seguro que localStorage).
const RT_KEY = 'rt'

// ─── Funciones para manejar el refresh token ──────────────────────────────────

// Guarda el refresh token en sessionStorage (nunca en el store de Zustand)
export function saveRefreshToken(rt: string) {
  sessionStorage.setItem(RT_KEY, rt)
}

// Lee el refresh token del sessionStorage (null si no existe)
export function getRefreshToken(): string | null {
  return sessionStorage.getItem(RT_KEY)
}

// Elimina el refresh token (al hacer logout o cuando expira)
export function clearRefreshToken() {
  sessionStorage.removeItem(RT_KEY)
}

// ─── Instancia de Axios ───────────────────────────────────────────────────────
// Se crea UNA sola instancia con la configuración base.
// Todas las funciones de la API la importan y la usan.
export const apiClient = axios.create({
  baseURL: '/',   // las rutas como '/api/v1/...' se resuelven relativas al dominio actual
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// ─── Interceptor de REQUEST ───────────────────────────────────────────────────
// Se ejecuta ANTES de enviar cada petición HTTP.
// Agrega el header "Authorization: Bearer <token>" si el usuario está logueado.
// Así no hay que agregarlo manualmente en cada llamada a la API.
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Variables para el mecanismo de renovación de token ───────────────────────
// Evitan hacer múltiples peticiones de refresh simultáneas (race condition).
let refreshing = false                                 // ¿ya hay un refresh en curso?
let waitQueue: Array<(token: string) => void> = []    // peticiones en espera del nuevo token

// ─── Interceptor de RESPONSE ──────────────────────────────────────────────────
// Se ejecuta DESPUÉS de recibir cada respuesta HTTP.
// El primer callback maneja respuestas exitosas (las deja pasar).
// El segundo callback maneja errores.
apiClient.interceptors.response.use(
  (response) => response,   // respuesta OK → la devuelve sin modificar
  async (error) => {
    const original = error.config   // configuración de la petición que falló

    // Solo actúa si fue un error 401 (no autorizado) y no es un reintento
    // (_retry evita loops infinitos si el refresh también falla con 401)
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true

      const rt = getRefreshToken()

      // Si no hay refresh token, no se puede renovar → logout forzado
      if (!rt) {
        useAuthStore.getState().logout()
        clearRefreshToken()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      // Si ya hay un refresh en curso, encola esta petición para reintentar
      // cuando el nuevo token esté listo (evita llamar /refresh múltiples veces)
      if (refreshing) {
        return new Promise((resolve) => {
          waitQueue.push((token) => {
            original.headers.Authorization = `Bearer ${token}`
            resolve(apiClient(original))   // reintenta con el nuevo token
          })
        })
      }

      // Inicia el proceso de refresh
      refreshing = true
      try {
        // Llama al endpoint de renovación directamente con axios (no apiClient)
        // para evitar que este interceptor se llame a sí mismo recursivamente
        const res = await axios.post('/api/v1/auth/refresh', { refresh_token: rt }, { withCredentials: true })
        const { access_token, refresh_token } = res.data

        // Guarda el nuevo par de tokens
        const state = useAuthStore.getState()
        state.setAuth(access_token, state.userId!, state.email!, state.nombre!, state.roles)
        saveRefreshToken(refresh_token)

        // Desencola y reintenta todas las peticiones que estaban esperando
        waitQueue.forEach((cb) => cb(access_token))
        waitQueue = []

        // Reintenta la petición original que había fallado
        original.headers.Authorization = `Bearer ${access_token}`
        return apiClient(original)

      } catch {
        // El refresh también falló → sesión inválida, logout forzado
        useAuthStore.getState().logout()
        clearRefreshToken()
        window.location.href = '/login'
        return Promise.reject(error)
      } finally {
        refreshing = false   // siempre libera el flag al terminar
      }
    }

    // Para cualquier otro error (400, 404, 500...) lo rechaza normalmente
    return Promise.reject(error)
  }
)
