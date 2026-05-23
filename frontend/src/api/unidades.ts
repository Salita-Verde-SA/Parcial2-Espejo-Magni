import { apiClient } from './client'
import type {
  UnidadMedida,
  UnidadMedidaCreate,
  UnidadMedidaUpdate,
} from '../types'

export async function fetchUnidades(): Promise<UnidadMedida[]> {
  const response = await apiClient.get<UnidadMedida[]>('/api/v1/unidades/')
  return response.data
}

export async function fetchUnidad(id: number): Promise<UnidadMedida> {
  const response = await apiClient.get<UnidadMedida>(`/api/v1/unidades/${id}`)
  return response.data
}

export async function createUnidad(data: UnidadMedidaCreate): Promise<UnidadMedida> {
  const response = await apiClient.post<UnidadMedida>('/api/v1/unidades/', data)
  return response.data
}

export async function updateUnidad(
  id: number,
  data: UnidadMedidaUpdate
): Promise<UnidadMedida> {
  const response = await apiClient.put<UnidadMedida>(`/api/v1/unidades/${id}`, data)
  return response.data
}

export async function deleteUnidad(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/unidades/${id}`)
}