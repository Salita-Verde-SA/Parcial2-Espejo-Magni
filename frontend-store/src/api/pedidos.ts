import { apiClient } from './client'
import type { PedidoPublic, PedidoCreate, PaginatedPedidos } from '../types'

export async function createPedido(data: PedidoCreate): Promise<PedidoPublic> {
  const res = await apiClient.post<PedidoPublic>('/api/v1/pedidos/', data)
  return res.data
}

export async function fetchPedidos(
  page: number = 1,
  page_size: number = 5
): Promise<PaginatedPedidos> {
  const res = await apiClient.get<PaginatedPedidos>('/api/v1/pedidos/', {
    params: { page, page_size },
  })
  return res.data
}

export async function cancelarPedido(id: number): Promise<PedidoPublic> {
  const res = await apiClient.post<PedidoPublic>(`/api/v1/pedidos/${id}/cancelar`)
  return res.data
}
