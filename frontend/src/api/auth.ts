import { apiClient, saveRefreshToken, clearRefreshToken } from './client'
import { useAuthStore } from '../stores/authStore'
import type { LoginResponse, UserPublic } from '../types'

export async function login(email: string, password: string): Promise<void> {
  const res = await apiClient.post<LoginResponse>('/api/v1/auth/login', {
    email,
    password,
  })
  const { access_token, refresh_token } = res.data

  const payload = JSON.parse(atob(access_token.split('.')[1]))

  const me = await apiClient.get<UserPublic>('/api/v1/auth/me', {
    headers: { Authorization: `Bearer ${access_token}` },
  })

  useAuthStore
    .getState()
    .setAuth(access_token, Number(payload.sub), me.data.email, me.data.nombre, payload.roles ?? [])

  saveRefreshToken(refresh_token)
}

export async function logout(): Promise<void> {
  const rt = sessionStorage.getItem('rt')
  if (rt) {
    try {
      await apiClient.post('/api/v1/auth/logout', { refresh_token: rt })
    } catch {
    }
  }
  useAuthStore.getState().logout()
  clearRefreshToken()
}

export async function initUser(): Promise<void> {
  const store = useAuthStore.getState()
  if (!store.token || store.userId) return

  try {
    const payload = JSON.parse(atob(store.token.split('.')[1]))
    const me = await apiClient.get<UserPublic>('/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${store.token}` },
    })
    store.setAuth(store.token, Number(payload.sub), me.data.email, me.data.nombre, payload.roles ?? [])
  } catch {
    logout()
  }
}
