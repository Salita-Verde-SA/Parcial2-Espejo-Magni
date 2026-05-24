import { apiClient } from './client'
import type { UserPublic } from '../types'

interface PaginatedUsuarios {
  items: UserPublic[]
  total: number
  page: number
  page_size: number
  pages: number
}

export async function fetchUsuarios(): Promise<UserPublic[]> {
  const res = await apiClient.get<PaginatedUsuarios>('/api/v1/admin/usuarios?page_size=100')
  return res.data.items
}

export async function assignRole(userId: number, role: string): Promise<void> {
  await apiClient.post(`/api/v1/admin/usuarios/${userId}/roles/${role}`)
}

export async function removeRole(userId: number, role: string): Promise<void> {
  await apiClient.delete(`/api/v1/admin/usuarios/${userId}/roles/${role}`)
}
