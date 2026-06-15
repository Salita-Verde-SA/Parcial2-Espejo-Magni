import { useEffect } from 'react'
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore'
import { useWsStore } from '../stores/wsStore'

const MAX_BACKOFF = 30_000

function buildWsUrl(path: string): string {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const token = useAuthStore.getState().token
  const base = `${proto}//${window.location.host}${path}`
  return token ? `${base}?token=${encodeURIComponent(token)}` : base
}

function invalidate(qc: QueryClient, raw: string) {
  try {
    const data = JSON.parse(raw)
    useWsStore.getState().setLastEvent(data.event || data.type || null)

    // Actualización optimista para evitar desincronización visual entre lista y detalle
    if (data.pedido_id && data.estado_nuevo) {
      qc.setQueriesData({ queryKey: ['admin-pedidos'] }, (oldData: any) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          items: oldData.items.map((item: any) =>
            item.id === data.pedido_id ? { ...item, estado_codigo: data.estado_nuevo } : item
          ),
        }
      })
      qc.setQueriesData({ queryKey: ['pedidos'] }, (oldData: any) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          items: oldData.items.map((item: any) => {
            if (item.id === data.pedido_id) {
              const updatedItem = { ...item, estado_codigo: data.estado_nuevo }
              if (data.motivo) {
                updatedItem.historial = [...(item.historial || []), {
                  id: Date.now(),
                  pedido_id: item.id,
                  estado_anterior_codigo: item.estado_codigo,
                  estado_nuevo_codigo: data.estado_nuevo,
                  motivo: data.motivo,
                  fecha: new Date().toISOString(),
                  usuario_id: data.usuario_id,
                  usuario_nombre: 'Sistema' // Fallback
                }]
              }
              return updatedItem
            }
            return item
          }),
        }
      })
      qc.setQueriesData({ queryKey: ['pedido-detalle', data.pedido_id] }, (oldData: any) => {
        if (!oldData) return oldData
        const updatedItem = { ...oldData, estado_codigo: data.estado_nuevo }
        if (data.motivo) {
          updatedItem.historial = [...(oldData.historial || []), {
            id: Date.now(),
            pedido_id: oldData.id,
            estado_anterior_codigo: oldData.estado_codigo,
            estado_nuevo_codigo: data.estado_nuevo,
            motivo: data.motivo,
            fecha: new Date().toISOString(),
            usuario_id: data.usuario_id,
            usuario_nombre: 'Sistema' // Fallback
          }]
        }
        return updatedItem
      })
    }

    qc.invalidateQueries({ queryKey: ['pedidos'] })
    qc.invalidateQueries({ queryKey: ['admin-pedidos'] })
    qc.invalidateQueries({ queryKey: ['admin-dashboard'] })
    qc.invalidateQueries({ queryKey: ['estadisticas'] })
    if (data.pedido_id) {
      qc.invalidateQueries({ queryKey: ['pedido-detalle', data.pedido_id] })
    }
  } catch {
    /* mensaje no-JSON: ignorar */
  }
}

/**
 * Feed global de pedidos para ADMIN/PEDIDOS (canal admin).
 * Reconexión con backoff exponencial; refleja el estado en wsStore.
 */
export function useAdminOrdersFeed() {
  const qc = useQueryClient()
  const token = useAuthStore((s) => s.token)
  const setStatus = useWsStore((s) => s.setStatus)

  useEffect(() => {
    if (!token) return
    let ws: WebSocket | null = null
    let attempt = 0
    let closed = false
    let timer: ReturnType<typeof setTimeout>

    function connect() {
      setStatus('connecting')
      ws = new WebSocket(buildWsUrl('/ws/pedidos'))

      ws.onopen = () => {
        attempt = 0
        setStatus('connected')
      }
      ws.onmessage = (e) => invalidate(qc, e.data)
      ws.onclose = () => {
        setStatus('disconnected')
        if (closed) return
        const delay = Math.min(1000 * 2 ** attempt, MAX_BACKOFF)
        attempt += 1
        timer = setTimeout(connect, delay)
      }
      ws.onerror = () => ws?.close()
    }

    connect()
    return () => {
      closed = true
      clearTimeout(timer)
      if (ws) {
        ws.onclose = null
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.onopen = () => ws?.close()
        } else {
          ws.close()
        }
      }
      setStatus('disconnected')
    }
  }, [token, qc, setStatus])
}

export function useMisPedidosFeed(_pedidoIds: number[]) {
  // Mantener por compatibilidad o simplemente usar el feed global
  useMisPedidosGlobalFeed();
}

/**
 * Feed global para el CLIENTE: abre una sola conexión para todos sus pedidos
 * (canal user:{id}). Recibe eventos cuando crea un pedido nuevo o le cambian el estado.
 */
export function useMisPedidosGlobalFeed() {
  const qc = useQueryClient()
  const token = useAuthStore((s) => s.token)
  const setStatus = useWsStore((s) => s.setStatus)

  useEffect(() => {
    if (!token) {
      setStatus('disconnected')
      return
    }
    let ws: WebSocket | null = null
    let attempt = 0
    let closed = false
    let timer: ReturnType<typeof setTimeout>

    function connect() {
      setStatus('connecting')
      ws = new WebSocket(buildWsUrl('/ws/mis-pedidos'))

      ws.onopen = () => {
        attempt = 0
        setStatus('connected')
      }
      ws.onmessage = (e) => invalidate(qc, e.data)
      ws.onclose = () => {
        setStatus('disconnected')
        if (closed) return
        const delay = Math.min(1000 * 2 ** attempt, MAX_BACKOFF)
        attempt += 1
        timer = setTimeout(connect, delay)
      }
      ws.onerror = () => ws?.close()
    }

    connect()
    return () => {
      closed = true
      clearTimeout(timer)
      if (ws) {
        ws.onclose = null
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.onopen = () => ws?.close()
        } else {
          ws.close()
        }
      }
      setStatus('disconnected')
    }
  }, [token, qc, setStatus])
}
