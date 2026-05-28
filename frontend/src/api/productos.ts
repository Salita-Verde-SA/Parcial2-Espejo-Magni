import { apiClient } from './client'
import type {
  Producto,
  ProductoCreate,
  ProductoUpdate,
  PaginatedProductos,
  FiltrosProducto,
} from '../types'

/** Obtiene la lista paginada de productos desde GET /api/v1/productos/ aplicando los filtros recibidos. */
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

/** Obtiene todos los productos sin filtros desde GET /api/v1/productos/all y retorna la respuesta paginada completa. */
export async function fetchProductosAll(): Promise<PaginatedProductos> {
  const res = await apiClient.get<PaginatedProductos>('/api/v1/productos/all')
  return res.data
}

/** Obtiene el detalle completo de un producto desde GET /api/v1/productos/{id}. */
export async function fetchProducto(id: number): Promise<Producto> {
  const res = await apiClient.get<Producto>(`/api/v1/productos/${id}`)
  return res.data
}

/** Crea un nuevo producto llamando a POST /api/v1/productos/ y retorna el producto creado. */
export async function createProducto(data: ProductoCreate): Promise<Producto> {
  const res = await apiClient.post<Producto>('/api/v1/productos/', data)
  return res.data
}

/** Actualiza un producto existente llamando a PUT /api/v1/productos/{id} y retorna el producto actualizado. */
export async function updateProducto(id: number, data: ProductoUpdate): Promise<Producto> {
  const res = await apiClient.put<Producto>(`/api/v1/productos/${id}`, data)
  return res.data
}

/** Actualiza el stock y la disponibilidad de un producto llamando a PATCH /api/v1/productos/{id}/stock y retorna el producto actualizado. */
export async function updateStock(
  id: number,
  data: { stock_cantidad: number; disponible: boolean }
): Promise<Producto> {
  const res = await apiClient.patch<Producto>(`/api/v1/productos/${id}/stock`, data)
  return res.data
}

/** Actualiza únicamente el campo disponible de un producto llamando a PATCH /api/v1/productos/{id}/disponibilidad y retorna el producto actualizado. */
export async function updateDisponibilidad(
  id: number,
  data: { disponible: boolean }
): Promise<Producto> {
  const res = await apiClient.patch<Producto>(`/api/v1/productos/${id}/disponibilidad`, data)
  return res.data
}

/** Realiza la baja lógica de un producto llamando a DELETE /api/v1/productos/{id}. */
export async function deleteProducto(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/productos/${id}`)
}

/** Llama a GET /api/v1/productos/export, descarga el archivo Excel de productos y lo guarda automáticamente en el navegador. */
export async function exportProductosExcel(): Promise<void> {
  const res = await apiClient.get('/api/v1/productos/export', { responseType: 'blob' })
  const url = window.URL.createObjectURL(new Blob([res.data]))
  const a = document.createElement('a')
  a.href = url
  a.setAttribute('download', 'productos.xlsx')
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}

/** Reactiva un producto dado de baja llamando a POST /api/v1/productos/{id}/activate y retorna el producto activado. */
export async function activateProducto(id: number): Promise<Producto> {
  const res = await apiClient.post<Producto>(`/api/v1/productos/${id}/activate`)
  return res.data
}
