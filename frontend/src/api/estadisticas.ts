import { apiClient } from './client'
import type {
  ResumenEstadisticas,
  VentasPeriodoItem,
  ProductoTopItem,
  PedidosEstadoItem,
  IngresosFormaPagoItem,
} from '../types'

export async function fetchResumen(): Promise<ResumenEstadisticas> {
  const res = await apiClient.get<ResumenEstadisticas>('/api/v1/estadisticas/resumen')
  return res.data
}

export async function fetchVentas(agrupacion = 'day'): Promise<VentasPeriodoItem[]> {
  const res = await apiClient.get<VentasPeriodoItem[]>('/api/v1/estadisticas/ventas', {
    params: { agrupacion },
  })
  return res.data
}

export async function fetchProductosTop(limit = 5): Promise<ProductoTopItem[]> {
  const res = await apiClient.get<ProductoTopItem[]>('/api/v1/estadisticas/productos-top', {
    params: { limit },
  })
  return res.data
}

export async function fetchPedidosPorEstado(): Promise<PedidosEstadoItem[]> {
  const res = await apiClient.get<PedidosEstadoItem[]>('/api/v1/estadisticas/pedidos-por-estado')
  return res.data
}

export async function fetchIngresos(): Promise<IngresosFormaPagoItem[]> {
  const res = await apiClient.get<IngresosFormaPagoItem[]>('/api/v1/estadisticas/ingresos')
  return res.data
}
