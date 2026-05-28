import { apiClient } from './client'

export async function createPago(token: string, pedidoId: number, issuerId?: string, paymentMethodId?: string, installments?: number) {
  const response = await apiClient.post('/api/v1/pagos/crear', {
    token,
    pedido_id: pedidoId,
    issuer_id: issuerId,
    payment_method_id: paymentMethodId,
    installments: installments || 1,
  })
  return response.data
}

export async function getPagoStatus(pedidoId: number) {
  const response = await apiClient.get(`/api/v1/pagos/${pedidoId}`)
  return response.data
}
