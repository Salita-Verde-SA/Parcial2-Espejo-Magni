import { apiClient } from './client'
import type { DireccionPublic, DireccionCreate } from '../types'

export async function fetchDirecciones(): Promise<DireccionPublic[]> {
  const res = await apiClient.get<DireccionPublic[]>('/api/v1/direcciones/')
  return res.data
}

export async function createDireccion(data: DireccionCreate): Promise<DireccionPublic> {
  const res = await apiClient.post<DireccionPublic>('/api/v1/direcciones/', data)
  return res.data
}

export async function setPrincipal(id: number): Promise<DireccionPublic> {
  const res = await apiClient.patch<DireccionPublic>(`/api/v1/direcciones/${id}/principal`)
  return res.data
}
