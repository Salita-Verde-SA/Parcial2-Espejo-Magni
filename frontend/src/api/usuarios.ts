import { apiClient } from './client'
import type { UserPublic } from '../types'

export async function fetchUsuarios(): Promise<UserPublic[]> {
  const res = await apiClient.get<UserPublic[]>('/api/v1/usuarios/')
  return res.data
}

export async function assignRole(userId: number, role: string): Promise<void> {
  await apiClient.post(`/api/v1/usuarios/${userId}/roles/${role}`)
}

export async function removeRole(userId: number, role: string): Promise<void> {
  await apiClient.delete(`/api/v1/usuarios/${userId}/roles/${role}`)
}
