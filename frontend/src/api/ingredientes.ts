// ─── api/ingredientes.ts ──────────────────────────────────────────────────────
// Funciones para el módulo /api/v1/ingredientes/ del backend.
// CRUD completo + exportación a Excel.

import { apiClient } from './client'
import type {
  Ingrediente,
  IngredienteCreate,
  IngredienteUpdate,
  PaginatedIngredientes,
  FiltrosIngrediente,
} from '../types'

// ─── fetchIngredientes ────────────────────────────────────────────────────────
// GET /api/v1/ingredientes/ con paginación y filtros opcionales.
// Solo agrega a los params los campos que tienen valor definido.
export async function fetchIngredientes(
  filtros: FiltrosIngrediente
): Promise<PaginatedIngredientes> {
  const params: Record<string, string | number> = {
    page: filtros.page,
    page_size: filtros.page_size,
  }
  if (filtros.nombre) params.nombre = filtros.nombre
  // es_alergeno es "" (todos), "true" o "false"
  if (filtros.es_alergeno !== '') params.es_alergeno = filtros.es_alergeno

  const response = await apiClient.get<PaginatedIngredientes>(
    '/api/v1/ingredientes/',
    { params }
  )
  return response.data
}

// ─── fetchIngredientesAll ──────────────────────────────────────────────────────
// GET /api/v1/ingredientes/all → devuelve TODOS los ingredientes incluyendo eliminados (para admin)
export async function fetchIngredientesAll(): Promise<PaginatedIngredientes> {
  const response = await apiClient.get<PaginatedIngredientes>('/api/v1/ingredientes/all')
  return response.data
}

// ─── createIngrediente ────────────────────────────────────────────────────────
// POST /api/v1/ingredientes/ → crea un insumo nuevo
export async function createIngrediente(
  data: IngredienteCreate
): Promise<Ingrediente> {
  const response = await apiClient.post<Ingrediente>('/api/v1/ingredientes/', data)
  return response.data
}

// ─── updateIngrediente ────────────────────────────────────────────────────────
// PATCH /api/v1/ingredientes/{id} → actualización parcial (solo campos enviados)
export async function updateIngrediente(
  id: number,
  data: IngredienteUpdate
): Promise<Ingrediente> {
  const response = await apiClient.patch<Ingrediente>(
    `/api/v1/ingredientes/${id}`,
    data
  )
  return response.data
}

// ─── deleteIngrediente ────────────────────────────────────────────────────────
// DELETE /api/v1/ingredientes/{id} → baja lógica (soft delete)
export async function deleteIngrediente(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/ingredientes/${id}`)
}

// ─── getExcelUrl ──────────────────────────────────────────────────────────────
// Construye la URL de descarga del Excel incluyendo el token en la query string.
// Se usa cuando no se puede enviar el header Authorization (ej: <a href>).
// Lee el token directamente de localStorage porque el store de Zustand
// persiste allí con la clave 'auth-storage'.
export function getExcelUrl(): string {
  const token = localStorage.getItem('auth-storage')
    ? JSON.parse(localStorage.getItem('auth-storage')!).state?.token
    : null
  return token
    ? `/api/v1/ingredientes/export?_token=${encodeURIComponent(token)}`
    : '/api/v1/ingredientes/export'
}

// ─── exportExcel ─────────────────────────────────────────────────────────────
// GET /api/v1/ingredientes/export → descarga el archivo .xlsx.
// Misma técnica que productos: blob → URL temporal → click automático.
export async function exportExcel(): Promise<void> {
  const response = await apiClient.get('/api/v1/ingredientes/export', {
    responseType: 'blob',   // indica que la respuesta es binaria (no JSON)
  })
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', 'ingredientes.xlsx')
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)   // libera la URL temporal de memoria
}

// ─── activateIngrediente ─────────────────────────────────────────────────────
// POST /api/v1/ingredientes/{id}/activate → reactiva un ingrediente desactivado
export async function activateIngrediente(id: number): Promise<Ingrediente> {
  const res = await apiClient.post<Ingrediente>(`/api/v1/ingredientes/${id}/activate`)
  return res.data
}
