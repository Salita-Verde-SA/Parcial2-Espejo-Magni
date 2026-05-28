import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

const RT_KEY = 'rt'

/** Guarda el refresh token en sessionStorage bajo la clave 'rt'. */
export function saveRefreshToken(rt: string) {
  sessionStorage.setItem(RT_KEY, rt)
}

/** Retorna el refresh token almacenado en sessionStorage, o null si no existe. */
export function getRefreshToken(): string | null {
  return sessionStorage.getItem(RT_KEY)
}

/** Elimina el refresh token de sessionStorage. */
export function clearRefreshToken() {
  sessionStorage.removeItem(RT_KEY)
}

/** Instancia de Axios preconfigurada con la base URL y Content-Type JSON, usada para todas las peticiones HTTP de la app. */
export const apiClient = axios.create({
  baseURL: '/',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

/** Interceptor de request: agrega el Authorization Bearer token del store a cada petición saliente si el usuario está autenticado. */
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshing = false
let waitQueue: Array<(token: string) => void> = []

/** Interceptor de response: si recibe un 401, intenta renovar el access token con el refresh token; si falla, redirige al login. */
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true

      const rt = getRefreshToken()

      if (!rt) {
        useAuthStore.getState().logout()
        clearRefreshToken()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      if (refreshing) {
        return new Promise((resolve) => {
          waitQueue.push((token) => {
            original.headers.Authorization = `Bearer ${token}`
            resolve(apiClient(original))
          })
        })
      }

      refreshing = true
      try {
        const res = await axios.post('/api/v1/auth/refresh', { refresh_token: rt }, { withCredentials: true })
        const { access_token, refresh_token } = res.data

        const state = useAuthStore.getState()
        state.setAuth(access_token, state.userId!, state.email!, state.nombre!, state.roles)
        saveRefreshToken(refresh_token)

        waitQueue.forEach((cb) => cb(access_token))
        waitQueue = []

        original.headers.Authorization = `Bearer ${access_token}`
        return apiClient(original)

      } catch {
        useAuthStore.getState().logout()
        clearRefreshToken()
        window.location.href = '/login'
        return Promise.reject(error)
      } finally {
        refreshing = false
      }
    }

    return Promise.reject(error)
  }
)
