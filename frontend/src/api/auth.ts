// ─── api/auth.ts ──────────────────────────────────────────────────────────────
// Funciones para autenticar al usuario.
// login(): llama al backend, obtiene los tokens y llena el store.
// logout(): avisa al backend e invalida la sesión local.

import { apiClient, saveRefreshToken, clearRefreshToken } from './client'
import { useAuthStore } from '../stores/authStore'
import type { LoginResponse, UserPublic } from '../types'

// ─── login ────────────────────────────────────────────────────────────────────
// Proceso completo de autenticación en 3 pasos:
//   1. POST /auth/login → recibe access_token y refresh_token
//   2. Decodifica el JWT para extraer userId y roles (sin librería extra)
//   3. GET /auth/me → obtiene nombre y email del usuario
export async function login(email: string, password: string): Promise<void> {
  // Paso 1: obtiene los tokens
  const res = await apiClient.post<LoginResponse>('/api/v1/auth/login', {
    email,
    password,
  })
  const { access_token, refresh_token } = res.data

  // Paso 2: decodifica el payload del JWT manualmente.
  // Un JWT tiene 3 partes separadas por ".": header.payload.signature
  // El payload está en Base64 → atob() lo decodifica → JSON.parse() lo convierte
  // Ejemplo de payload: { "sub": "42", "roles": ["CLIENT"], "exp": 1234567890 }
  const payload = JSON.parse(atob(access_token.split('.')[1]))

  // Paso 3: pide los datos del perfil usando el nuevo token (aún no está en el store)
  const me = await apiClient.get<UserPublic>('/api/v1/auth/me', {
    headers: { Authorization: `Bearer ${access_token}` },
  })

  // Guarda todo en el store de Zustand (persiste en localStorage)
  useAuthStore
    .getState()
    .setAuth(access_token, Number(payload.sub), me.data.email, me.data.nombre, payload.roles ?? [])

  // Guarda el refresh token en sessionStorage (se borra al cerrar el navegador)
  saveRefreshToken(refresh_token)
}

// ─── logout ───────────────────────────────────────────────────────────────────
// Cierra la sesión:
//   1. Avisa al backend para invalidar el refresh token en la BD
//   2. Limpia el estado local (store + sessionStorage)
export async function logout(): Promise<void> {
  const rt = sessionStorage.getItem('rt')
  if (rt) {
    try {
      // Intenta hacer logout en el servidor para invalidar el token
      await apiClient.post('/api/v1/auth/logout', { refresh_token: rt })
    } catch {
      // Si falla (ej: sin conexión), igual limpiamos el estado local
    }
  }
  // Limpia el store (borra token, roles, etc.)
  useAuthStore.getState().logout()
  // Elimina el refresh token del sessionStorage
  clearRefreshToken()
}
