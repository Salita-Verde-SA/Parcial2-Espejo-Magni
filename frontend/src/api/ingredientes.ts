import { apiClient } from './client'
import type {
  Ingrediente,
  IngredienteCreate,
  IngredienteUpdate,
  PaginatedIngredientes,
  FiltrosIngrediente,
} from '../types'

export async function fetchIngredientes(
  filtros: FiltrosIngrediente
): Promise<PaginatedIngredientes> {
  const params: Record<string, string | number> = {
    page: filtros.page,
    page_size: filtros.page_size,
  }
  if (filtros.nombre) params.nombre = filtros.nombre
  if (filtros.es_alergeno !== '') params.es_alergeno = filtros.es_alergeno

  const response = await apiClient.get<PaginatedIngredientes>(
    '/api/v1/ingredientes/',
    { params }
  )
  return response.data
}

export async function fetchIngredientesAll(): Promise<PaginatedIngredientes> {
  const response = await apiClient.get<PaginatedIngredientes>('/api/v1/ingredientes/all')
  return response.data
}

export async function createIngrediente(
  data: IngredienteCreate
): Promise<Ingrediente> {
  const response = await apiClient.post<Ingrediente>('/api/v1/ingredientes/', data)
  return response.data
}

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

export async function deleteIngrediente(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/ingredientes/${id}`)
}

export function getExcelUrl(): string {
  const token = localStorage.getItem('auth-storage')
    ? JSON.parse(localStorage.getItem('auth-storage')!).state?.token
    : null
  return token
    ? `/api/v1/ingredientes/export?_token=${encodeURIComponent(token)}`
    : '/api/v1/ingredientes/export'
}

export async function exportExcel(): Promise<void> {
  const response = await apiClient.get('/api/v1/ingredientes/export', {
    responseType: 'blob',
  })
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', 'ingredientes.xlsx')
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export async function activateIngrediente(id: number): Promise<Ingrediente> {
  const res = await apiClient.post<Ingrediente>(`/api/v1/ingredientes/${id}/activate`)
  return res.data
}
