import axios from 'axios'
import { useAuthStore } from '../stores/authStore'


export const apiClient = axios.create({
  baseURL: '/',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshing = false
let waitQueue: Array<(token: string) => void> = []

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true

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
        const res = await axios.post('/api/v1/auth/refresh', {}, { withCredentials: true })
        const { access_token } = res.data

        const state = useAuthStore.getState()
        state.setAuth(access_token, state.userId!, state.email!, state.nombre!, state.roles)

        waitQueue.forEach((cb) => cb(access_token))
        waitQueue = []

        original.headers.Authorization = `Bearer ${access_token}`
        return apiClient(original)

      } catch {
        useAuthStore.getState().logout()
        window.location.href = '/login'
        return Promise.reject(error)
      } finally {
        refreshing = false
      }
    }

    return Promise.reject(error)
  }
)
