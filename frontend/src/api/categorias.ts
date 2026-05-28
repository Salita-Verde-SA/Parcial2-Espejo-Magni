import { apiClient } from './client'
import type { Categoria, CategoriaCreate, CategoriaTree } from '../types'

/** Obtiene la lista paginada de categorías activas desde GET /api/v1/categorias/ y retorna el array de items. */
export async function fetchCategorias(): Promise<Categoria[]> {
  const res = await apiClient.get<{items: Categoria[]}>('/api/v1/categorias/?page_size=100')
  return res.data.items
}

/** Obtiene todas las categorías (activas e inactivas) desde GET /api/v1/categorias/all. */
export async function fetchCategoriasAll(): Promise<Categoria[]> {
  const res = await apiClient.get<Categoria[]>('/api/v1/categorias/all')
  return res.data
}

/** Obtiene el árbol jerárquico completo de categorías desde GET /api/v1/categorias/tree. */
export async function fetchCategoriasTree(): Promise<CategoriaTree[]> {
  const res = await apiClient.get<CategoriaTree[]>('/api/v1/categorias/tree')
  return res.data
}

/** Crea una nueva categoría llamando a POST /api/v1/categorias/ y retorna la categoría creada. */
export async function createCategoria(data: CategoriaCreate): Promise<Categoria> {
  const res = await apiClient.post<Categoria>('/api/v1/categorias/', data)
  return res.data
}

/** Actualiza una categoría existente llamando a PUT /api/v1/categorias/{id} y retorna la categoría actualizada. */
export async function updateCategoria(id: number, data: CategoriaCreate): Promise<Categoria> {
  const res = await apiClient.put<Categoria>(`/api/v1/categorias/${id}`, data)
  return res.data
}

/** Realiza la baja lógica de una categoría llamando a DELETE /api/v1/categorias/{id}. */
export async function deleteCategoria(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/categorias/${id}`)
}

/** Reactiva una categoría dada de baja llamando a POST /api/v1/categorias/{id}/activate y retorna la categoría activada. */
export async function activateCategoria(id: number): Promise<Categoria> {
  const res = await apiClient.post<Categoria>(`/api/v1/categorias/${id}/activate`)
  return res.data
}
