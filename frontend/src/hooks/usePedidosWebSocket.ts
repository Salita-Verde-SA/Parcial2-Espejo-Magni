import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

/** Hook que establece y mantiene una conexión WebSocket con el endpoint /ws/pedidos; al recibir eventos NEW_PEDIDO o PEDIDO_UPDATED invalida las queries de pedidos en el caché de TanStack Query para forzar la recarga automática. Implementa reconexión automática cada 3 segundos ante desconexiones. */
export function usePedidosWebSocket() {
  const qc = useQueryClient()

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws/pedidos`
    let ws: WebSocket | null = null
    let reconnectTimeout: ReturnType<typeof setTimeout>

    /** Crea la conexión WebSocket y registra los handlers de eventos del ciclo de vida. */
    function connect() {
      ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('🔌 Conectado al WebSocket de pedidos')
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('📡 Mensaje WebSocket recibido:', data)

          if (data.type === 'NEW_PEDIDO' || data.type === 'PEDIDO_UPDATED') {
            qc.invalidateQueries({ queryKey: ['pedidos'] })
            qc.invalidateQueries({ queryKey: ['admin-pedidos'] })
            if (data.pedido_id) {
              qc.invalidateQueries({ queryKey: ['pedido-detalle', data.pedido_id] })
            }
          }
        } catch (err) {
          console.error('Error parseando mensaje WS:', err)
        }
      }

      ws.onclose = () => {
        console.log('❌ WebSocket desconectado. Reconectando en 3s...')
        reconnectTimeout = setTimeout(connect, 3000)
      }

      ws.onerror = (err) => {
        console.error('Error en WebSocket:', err)
        ws?.close()
      }
    }

    connect()

    return () => {
      clearTimeout(reconnectTimeout)
      if (ws) {
        ws.onclose = null
        ws.close()
      }
    }
  }, [qc])
}
