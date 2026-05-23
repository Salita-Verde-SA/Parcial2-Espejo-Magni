import { apiClient } from './client'
import type { DireccionPublic, DireccionCreate, DireccionUpdate } from '../types'

export async function fetchDirecciones(): Promise<DireccionPublic[]> {
  const res = await apiClient.get<DireccionPublic[]>('/api/v1/direcciones/')
  return res.data
}

export async function createDireccion(data: DireccionCreate): Promise<DireccionPublic> {
  const res = await apiClient.post<DireccionPublic>('/api/v1/direcciones/', data)
  return res.data
}

export async function updateDireccion(id: number, data: DireccionUpdate): Promise<DireccionPublic> {
  const res = await apiClient.put<DireccionPublic>(`/api/v1/direcciones/${id}`, data)
  return res.data
}

export async function deleteDireccion(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/direcciones/${id}`)
}
