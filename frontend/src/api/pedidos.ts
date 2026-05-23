import { apiClient } from './client'
import type { PedidoPublic, PedidoCreate, PaginatedPedidos } from '../types'

export async function createPedido(data: PedidoCreate): Promise<PedidoPublic> {
  const res = await apiClient.post<PedidoPublic>('/api/v1/pedidos/', data)
  return res.data
}

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

export async function fetchPedido(id: number): Promise<PedidoPublic> {
  const res = await apiClient.get<PedidoPublic>(`/api/v1/pedidos/${id}`)
  return res.data
}

export async function patchPedidoEstado(id: number, estado_codigo: string): Promise<PedidoPublic> {
  const res = await apiClient.patch<PedidoPublic>(`/api/v1/pedidos/${id}/estado`, {
    estado_codigo,
  })
  return res.data
}

export async function cancelarPedido(id: number): Promise<PedidoPublic> {
  const res = await apiClient.post<PedidoPublic>(`/api/v1/pedidos/${id}/cancelar`)
  return res.data
}
