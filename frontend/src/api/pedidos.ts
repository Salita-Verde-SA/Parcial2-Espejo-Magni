import { apiClient } from './client'
import type { PedidoPublic, PedidoCreate, PaginatedPedidos } from '../types'

/** Crea un nuevo pedido llamando a POST /api/v1/pedidos/ con los datos del carrito y retorna el pedido creado. */
export async function createPedido(data: PedidoCreate): Promise<PedidoPublic> {
  const res = await apiClient.post<PedidoPublic>('/api/v1/pedidos/', data)
  return res.data
}

/** Obtiene la lista paginada de pedidos desde GET /api/v1/pedidos/ filtrando por estado, página y tamaño de página. */
export async function fetchPedidos(
  estado_codigo: string = '',
  page: number = 1,
  page_size: number = 10
): Promise<PaginatedPedidos> {
  const res = await apiClient.get<PaginatedPedidos>('/api/v1/pedidos/', {
    params: { estado_codigo, page, page_size },
  })
  return res.data
}

/** Obtiene el detalle de un pedido específico desde GET /api/v1/pedidos/{id}. */
export async function fetchPedido(id: number): Promise<PedidoPublic> {
  const res = await apiClient.get<PedidoPublic>(`/api/v1/pedidos/${id}`)
  return res.data
}

/** Actualiza el estado de un pedido llamando a PATCH /api/v1/pedidos/{id}/estado y retorna el pedido actualizado. */
export async function patchPedidoEstado(id: number, estado_codigo: string): Promise<PedidoPublic> {
  const res = await apiClient.patch<PedidoPublic>(`/api/v1/pedidos/${id}/estado`, {
    estado_codigo,
  })
  return res.data
}

/** Cancela un pedido llamando a POST /api/v1/pedidos/{id}/cancelar y retorna el pedido con estado CANCELADO. */
export async function cancelarPedido(id: number): Promise<PedidoPublic> {
  const res = await apiClient.post<PedidoPublic>(`/api/v1/pedidos/${id}/cancelar`)
  return res.data
}
