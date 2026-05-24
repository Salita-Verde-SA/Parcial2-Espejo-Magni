import { apiClient } from './client'
import type { PaginatedProductos, FiltrosProducto } from '../types'

export async function fetchProductos(filtros: FiltrosProducto): Promise<PaginatedProductos> {
  const params: Record<string, string | number> = {
    page: filtros.page,
    page_size: filtros.page_size,
  }
  if (filtros.nombre) params.nombre = filtros.nombre
  if (filtros.categoria_id) params.categoria_id = filtros.categoria_id
  if (filtros.disponible !== '') params.disponible = filtros.disponible

  const res = await apiClient.get<PaginatedProductos>('/api/v1/productos/', { params })
  return res.data
}
