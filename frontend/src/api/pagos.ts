import { apiClient } from './client'

export async function createPago(pedidoId: number) {
  const response = await apiClient.post('/api/v1/pagos/crear', {
    pedido_id: pedidoId
  })
  return response.data // { init_point: string }
}

export async function confirmarPagoManual(pedidoId: number) {
  const response = await apiClient.post('/api/v1/pagos/confirmar', {
    pedido_id: pedidoId
  })
  return response.data
}
