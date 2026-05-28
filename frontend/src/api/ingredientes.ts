import { apiClient } from './client'
import type {
  Ingrediente,
  IngredienteCreate,
  IngredienteUpdate,
  PaginatedIngredientes,
  FiltrosIngrediente,
} from '../types'

/** Obtiene la lista paginada de ingredientes desde GET /api/v1/ingredientes/ aplicando los filtros recibidos; retorna la respuesta paginada. */
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

/** Obtiene todos los ingredientes sin paginar desde GET /api/v1/ingredientes/all; retorna la respuesta paginada completa. */
export async function fetchIngredientesAll(): Promise<PaginatedIngredientes> {
  const response = await apiClient.get<PaginatedIngredientes>('/api/v1/ingredientes/all')
  return response.data
}

/** Crea un nuevo ingrediente llamando a POST /api/v1/ingredientes/ y retorna el ingrediente creado. */
export async function createIngrediente(
  data: IngredienteCreate
): Promise<Ingrediente> {
  const response = await apiClient.post<Ingrediente>('/api/v1/ingredientes/', data)
  return response.data
}

/** Actualiza parcialmente un ingrediente existente llamando a PATCH /api/v1/ingredientes/{id} y retorna el ingrediente actualizado. */
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

/** Realiza la baja lógica de un ingrediente llamando a DELETE /api/v1/ingredientes/{id}. */
export async function deleteIngrediente(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/ingredientes/${id}`)
}

/** Construye y retorna la URL directa al endpoint de exportación Excel, incluyendo el token en el query string si está disponible. */
export function getExcelUrl(): string {
  const token = localStorage.getItem('auth-storage')
    ? JSON.parse(localStorage.getItem('auth-storage')!).state?.token
    : null
  return token
    ? `/api/v1/ingredientes/export?_token=${encodeURIComponent(token)}`
    : '/api/v1/ingredientes/export'
}

/** Llama a GET /api/v1/ingredientes/export, descarga el archivo Excel de ingredientes y lo guarda automáticamente en el navegador. */
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

/** Reactiva un ingrediente dado de baja llamando a POST /api/v1/ingredientes/{id}/activate y retorna el ingrediente activado. */
export async function activateIngrediente(id: number): Promise<Ingrediente> {
  const res = await apiClient.post<Ingrediente>(`/api/v1/ingredientes/${id}/activate`)
  return res.data
}
