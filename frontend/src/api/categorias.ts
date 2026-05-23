import { apiClient } from './client'
import type { Categoria, CategoriaCreate, CategoriaTree } from '../types'

export async function fetchCategorias(): Promise<Categoria[]> {
  const res = await apiClient.get<{items: Categoria[]}>('/api/v1/categorias/?page_size=100')
  return res.data.items
}

export async function fetchCategoriasAll(): Promise<Categoria[]> {
  const res = await apiClient.get<Categoria[]>('/api/v1/categorias/all')
  return res.data
}

export async function fetchCategoriasTree(): Promise<CategoriaTree[]> {
  const res = await apiClient.get<CategoriaTree[]>('/api/v1/categorias/tree')
  return res.data
}

export async function createCategoria(data: CategoriaCreate): Promise<Categoria> {
  const res = await apiClient.post<Categoria>('/api/v1/categorias/', data)
  return res.data
}

export async function updateCategoria(id: number, data: CategoriaCreate): Promise<Categoria> {
  const res = await apiClient.put<Categoria>(`/api/v1/categorias/${id}`, data)
  return res.data
}

export async function deleteCategoria(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/categorias/${id}`)
}

export async function activateCategoria(id: number): Promise<Categoria> {
  const res = await apiClient.post<Categoria>(`/api/v1/categorias/${id}/activate`)
  return res.data
}
