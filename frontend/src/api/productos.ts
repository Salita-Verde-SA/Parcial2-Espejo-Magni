// ─── api/productos.ts ─────────────────────────────────────────────────────────
// Funciones que consumen el módulo /api/v1/productos/ del backend.
// Cada función corresponde a un endpoint (GET, POST, PUT, PATCH, DELETE).
// El tipo de retorno está tipado con las interfaces de types.ts.

import { apiClient } from './client'
import type {
  Producto,
  ProductoCreate,
  ProductoUpdate,
  PaginatedProductos,
  FiltrosProducto,
} from '../types'

// ─── fetchProductos ───────────────────────────────────────────────────────────
// GET /api/v1/productos/ con filtros y paginación.
// Convierte el objeto FiltrosProducto en query params de la URL.
// Ejemplo de URL generada: /api/v1/productos/?page=1&page_size=12&nombre=burger
export async function fetchProductos(filtros: FiltrosProducto): Promise<PaginatedProductos> {
  // Se construye el objeto params dinámicamente: solo agrega los filtros
  // que tienen valor (evita pasar ?nombre= vacío al backend)
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

// ─── fetchProductosAll ─────────────────────────────────────────────────────────
// GET /api/v1/productos/all → devuelve TODOS los productos incluyendo eliminados (para admin)
export async function fetchProductosAll(): Promise<PaginatedProductos> {
  const res = await apiClient.get<PaginatedProductos>('/api/v1/productos/all')
  return res.data
}

// ─── fetchProducto ────────────────────────────────────────────────────────────
// GET /api/v1/productos/{id} → devuelve un producto por su ID
export async function fetchProducto(id: number): Promise<Producto> {
  const res = await apiClient.get<Producto>(`/api/v1/productos/${id}`)
  return res.data
}

// ─── createProducto ───────────────────────────────────────────────────────────
// POST /api/v1/productos/ → crea un producto nuevo, devuelve el creado con su ID
export async function createProducto(data: ProductoCreate): Promise<Producto> {
  const res = await apiClient.post<Producto>('/api/v1/productos/', data)
  return res.data
}

// ─── updateProducto ───────────────────────────────────────────────────────────
// PUT /api/v1/productos/{id} → actualización completa del producto
export async function updateProducto(id: number, data: ProductoUpdate): Promise<Producto> {
  const res = await apiClient.put<Producto>(`/api/v1/productos/${id}`, data)
  return res.data
}

// ─── updateStock ──────────────────────────────────────────────────────────────
// PATCH /api/v1/productos/{id}/stock → actualización parcial solo del stock.
// Solo pueden llamar este endpoint los usuarios con rol STOCK o ADMIN.
export async function updateStock(
  id: number,
  data: { stock_cantidad: number; disponible: boolean }
): Promise<Producto> {
  const res = await apiClient.patch<Producto>(`/api/v1/productos/${id}/stock`, data)
  return res.data
}

// ─── updateDisponibilidad ───────────────────────────────────────────────────
export async function updateDisponibilidad(
  id: number,
  data: { disponible: boolean }
): Promise<Producto> {
  const res = await apiClient.patch<Producto>(`/api/v1/productos/${id}/disponibilidad`, data)
  return res.data
}

// ─── deleteProducto ───────────────────────────────────────────────────────────
// DELETE /api/v1/productos/{id} → baja lógica (marca deleted_at en la BD)
// No devuelve nada (status 204 No Content)
export async function deleteProducto(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/productos/${id}`)
}

// ─── exportProductosExcel ─────────────────────────────────────────────────────
// GET /api/v1/productos/export → descarga el listado como archivo .xlsx.
// responseType: 'blob' le dice a Axios que la respuesta es un archivo binario,
// no JSON. Luego se crea un link temporal y se simula un click para descargarlo.
export async function exportProductosExcel(): Promise<void> {
  const res = await apiClient.get('/api/v1/productos/export', { responseType: 'blob' })
  const url = window.URL.createObjectURL(new Blob([res.data]))
  const a = document.createElement('a')
  a.href = url
  a.setAttribute('download', 'productos.xlsx')
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)   // libera la memoria del objeto URL
}

// ─── activateProducto ───────────────────────────────────────────────────────────
// POST /api/v1/productos/{id}/activate → reactiva un producto desactivado
export async function activateProducto(id: number): Promise<Producto> {
  const res = await apiClient.post<Producto>(`/api/v1/productos/${id}/activate`)
  return res.data
}
