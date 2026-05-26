import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

export function usePedidosWebSocket() {
  const qc = useQueryClient()

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws/pedidos`
    let ws: WebSocket | null = null
    let reconnectTimeout: ReturnType<typeof setTimeout>

    function connect() {
      ws = new WebSocket(wsUrl)

      ws.onopen = () => console.log('WS pedidos conectado')

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'NEW_PEDIDO' || data.type === 'PEDIDO_UPDATED') {
            qc.invalidateQueries({ queryKey: ['pedidos'] })
          }
        } catch { /* ignorar */ }
      }

      ws.onclose = () => {
        reconnectTimeout = setTimeout(connect, 3000)
      }

      ws.onerror = () => ws?.close()
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
