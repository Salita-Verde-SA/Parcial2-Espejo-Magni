import { apiClient } from './client'
import type { Categoria } from '../types'

export async function fetchCategorias(): Promise<Categoria[]> {
  const res = await apiClient.get<{ items: Categoria[] }>('/api/v1/categorias/?page_size=100')
  return res.data.items
}
