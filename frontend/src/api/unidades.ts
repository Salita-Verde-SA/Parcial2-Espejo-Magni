// ─── api/unidades.ts ─────────────────────────────────────────────────────────
// Funciones para el módulo /api/v1/unidades/ del backend.
// CRUD completo para gestión de unidades de medida.

import { apiClient } from './client'
import type {
  UnidadMedida,
  UnidadMedidaCreate,
  UnidadMedidaUpdate,
} from '../types'

// ─── fetchUnidades ─────────────────────────────────────────────────────────────
// GET /api/v1/unidades/ → lista todas las unidades
export async function fetchUnidades(): Promise<UnidadMedida[]> {
  const response = await apiClient.get<UnidadMedida[]>('/api/v1/unidades/')
  return response.data
}

// ─── fetchUnidad ───────────────────────────────────────────────────────────────
// GET /api/v1/unidades/{id} → obtiene una unidad por ID
export async function fetchUnidad(id: number): Promise<UnidadMedida> {
  const response = await apiClient.get<UnidadMedida>(`/api/v1/unidades/${id}`)
  return response.data
}

// ─── createUnidad ──────────────────────────────────────────────────────────────
// POST /api/v1/unidades/ → crea una unidad nueva (admin)
export async function createUnidad(data: UnidadMedidaCreate): Promise<UnidadMedida> {
  const response = await apiClient.post<UnidadMedida>('/api/v1/unidades/', data)
  return response.data
}

// ─── updateUnidad ──────────────────────────────────────────────────────────────
// PUT /api/v1/unidades/{id} → actualiza una unidad (admin)
export async function updateUnidad(
  id: number,
  data: UnidadMedidaUpdate
): Promise<UnidadMedida> {
  const response = await apiClient.put<UnidadMedida>(`/api/v1/unidades/${id}`, data)
  return response.data
}

// ─── deleteUnidad ─────────────────────────────────────────────────────────────
// DELETE /api/v1/unidades/{id} → elimina una unidad (admin, solo si no está en uso)
export async function deleteUnidad(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/unidades/${id}`)
}