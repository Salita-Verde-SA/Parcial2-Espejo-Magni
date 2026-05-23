// ─── api/categorias.ts ────────────────────────────────────────────────────────
// Funciones para el módulo /api/v1/categorias/ del backend.
// Las categorías forman un árbol recursivo (una categoría puede tener hijos).

import { apiClient } from './client'
import type { Categoria, CategoriaCreate, CategoriaTree } from '../types'

// ─── fetchCategorias ──────────────────────────────────────────────────────────
// GET /api/v1/categorias/ → lista plana de todas las categorías activas.
// Se usa para poblar el <select> de filtros en el Catálogo.
export async function fetchCategorias(): Promise<Categoria[]> {
  // The backend returns a paginated response, so we need to return the items array.
  // We pass a large page_size to get all categories for the filter dropdown.
  const res = await apiClient.get<{items: Categoria[]}>('/api/v1/categorias/?page_size=100')
  return res.data.items
}

// ─── fetchCategoriasAll ─────────────────────────────────────────────────────────
// GET /api/v1/categorias/all → lista de TODAS las categorías incluyendo eliminadas (para admin)
export async function fetchCategoriasAll(): Promise<Categoria[]> {
  const res = await apiClient.get<Categoria[]>('/api/v1/categorias/all')
  return res.data
}

// ─── fetchCategoriasTree ──────────────────────────────────────────────────────
// GET /api/v1/categorias/tree → árbol jerárquico de categorías.
// El backend usa una consulta WITH RECURSIVE (CTE) para construirlo.
// Útil si se quiere mostrar categorías anidadas (padre → hijos → nietos).
export async function fetchCategoriasTree(): Promise<CategoriaTree[]> {
  const res = await apiClient.get<CategoriaTree[]>('/api/v1/categorias/tree')
  return res.data
}

// ─── createCategoria ──────────────────────────────────────────────────────────
// POST /api/v1/categorias/ → crea una nueva categoría
export async function createCategoria(data: CategoriaCreate): Promise<Categoria> {
  const res = await apiClient.post<Categoria>('/api/v1/categorias/', data)
  return res.data
}

// ─── updateCategoria ──────────────────────────────────────────────────────────
// PUT /api/v1/categorias/{id} → reemplaza los datos de una categoría
export async function updateCategoria(id: number, data: CategoriaCreate): Promise<Categoria> {
  const res = await apiClient.put<Categoria>(`/api/v1/categorias/${id}`, data)
  return res.data
}

// ─── deleteCategoria ──────────────────────────────────────────────────────────
// DELETE /api/v1/categorias/{id} → baja lógica.
// Si la categoría tiene productos activos el backend devuelve 409 Conflict.
export async function deleteCategoria(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/categorias/${id}`)
}

// ─── activateCategoria ──────────────────────────────────────────────────────────
// POST /api/v1/categorias/{id}/activate → reactiva una categoría desactivada
export async function activateCategoria(id: number): Promise<Categoria> {
  const res = await apiClient.post<Categoria>(`/api/v1/categorias/${id}/activate`)
  return res.data
}
