import { apiClient } from './client'
import type {
  UnidadMedida,
  UnidadMedidaCreate,
  UnidadMedidaUpdate,
} from '../types'

/** Obtiene todas las unidades de medida desde GET /api/v1/unidades/ y retorna el array completo. */
export async function fetchUnidades(): Promise<UnidadMedida[]> {
  const response = await apiClient.get<UnidadMedida[]>('/api/v1/unidades/')
  return response.data
}

/** Obtiene el detalle de una unidad de medida específica desde GET /api/v1/unidades/{id}. */
export async function fetchUnidad(id: number): Promise<UnidadMedida> {
  const response = await apiClient.get<UnidadMedida>(`/api/v1/unidades/${id}`)
  return response.data
}

/** Crea una nueva unidad de medida llamando a POST /api/v1/unidades/ y retorna la unidad creada. */
export async function createUnidad(data: UnidadMedidaCreate): Promise<UnidadMedida> {
  const response = await apiClient.post<UnidadMedida>('/api/v1/unidades/', data)
  return response.data
}

/** Actualiza una unidad de medida existente llamando a PUT /api/v1/unidades/{id} y retorna la unidad actualizada. */
export async function updateUnidad(
  id: number,
  data: UnidadMedidaUpdate
): Promise<UnidadMedida> {
  const response = await apiClient.put<UnidadMedida>(`/api/v1/unidades/${id}`, data)
  return response.data
}

/** Elimina una unidad de medida llamando a DELETE /api/v1/unidades/{id}. */
export async function deleteUnidad(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/unidades/${id}`)
}
