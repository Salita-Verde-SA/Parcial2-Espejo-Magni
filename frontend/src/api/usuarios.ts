import { apiClient } from './client'
import type { UserPublic } from '../types'

interface PaginatedUsuarios {
  items: UserPublic[]
  total: number
  page: number
  page_size: number
  pages: number
}

/** Obtiene la lista de todos los usuarios desde GET /api/v1/admin/usuarios (requiere rol ADMIN) y retorna el array de usuarios. */
export async function fetchUsuarios(): Promise<UserPublic[]> {
  const res = await apiClient.get<PaginatedUsuarios>('/api/v1/admin/usuarios?page_size=100')
  return res.data.items
}

/** Asigna un rol a un usuario llamando a POST /api/v1/admin/usuarios/{userId}/roles/{role}. */
export async function assignRole(userId: number, role: string): Promise<void> {
  await apiClient.post(`/api/v1/admin/usuarios/${userId}/roles/${role}`)
}

/** Elimina un rol de un usuario llamando a DELETE /api/v1/admin/usuarios/{userId}/roles/{role}. */
export async function removeRole(userId: number, role: string): Promise<void> {
  await apiClient.delete(`/api/v1/admin/usuarios/${userId}/roles/${role}`)
}
