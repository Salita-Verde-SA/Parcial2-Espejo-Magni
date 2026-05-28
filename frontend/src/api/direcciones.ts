import { apiClient } from './client'
import type { DireccionPublic, DireccionCreate, DireccionUpdate } from '../types'

/** Obtiene todas las direcciones del usuario autenticado desde GET /api/v1/direcciones/. */
export async function fetchDirecciones(): Promise<DireccionPublic[]> {
  const res = await apiClient.get<DireccionPublic[]>('/api/v1/direcciones/')
  return res.data
}

/** Crea una nueva dirección para el usuario autenticado llamando a POST /api/v1/direcciones/ y retorna la dirección creada. */
export async function createDireccion(data: DireccionCreate): Promise<DireccionPublic> {
  const res = await apiClient.post<DireccionPublic>('/api/v1/direcciones/', data)
  return res.data
}

/** Actualiza una dirección existente llamando a PUT /api/v1/direcciones/{id} y retorna la dirección actualizada. */
export async function updateDireccion(id: number, data: DireccionUpdate): Promise<DireccionPublic> {
  const res = await apiClient.put<DireccionPublic>(`/api/v1/direcciones/${id}`, data)
  return res.data
}

/** Elimina una dirección llamando a DELETE /api/v1/direcciones/{id}. */
export async function deleteDireccion(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/direcciones/${id}`)
}
