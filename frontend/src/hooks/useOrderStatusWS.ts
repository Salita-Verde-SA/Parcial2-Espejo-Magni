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
        ws.close()
      }
      setStatus('disconnected')
    }
  }, [token, qc, setStatus])
}

/**
 * Feed por pedido para el CLIENTE: abre una conexión por cada pedido visible
 * (canal pedido:{id}). Permite ver el cambio de estado en tiempo real sin recargar.
 */
export function useMisPedidosFeed(pedidoIds: number[]) {
  const qc = useQueryClient()
  const token = useAuthStore((s) => s.token)
  const setStatus = useWsStore((s) => s.setStatus)
  const key = [...pedidoIds].sort((a, b) => a - b).join(',')

  useEffect(() => {
    if (!token || pedidoIds.length === 0) {
      setStatus('disconnected')
      return
    }
    const sockets: WebSocket[] = []
    const abiertos = new Set<number>()
    let closedAll = false

    function refresh() {
      setStatus(abiertos.size > 0 ? 'connected' : 'connecting')
    }

    pedidoIds.forEach((id) => {
      function connect(attempt = 0) {
        if (closedAll) return
        const ws = new WebSocket(buildWsUrl(`/ws/pedidos/${id}`))
        sockets.push(ws)
        ws.onopen = () => {
          abiertos.add(id)
          refresh()
        }
        ws.onmessage = (e) => invalidate(qc, e.data)
        ws.onclose = () => {
          abiertos.delete(id)
          refresh()
          if (closedAll) return
          const delay = Math.min(1000 * 2 ** attempt, MAX_BACKOFF)
          setTimeout(() => connect(attempt + 1), delay)
        }
        ws.onerror = () => ws.close()
      }
      connect()
    })

    setStatus('connecting')
    return () => {
      closedAll = true
      sockets.forEach((ws) => {
        ws.onclose = null
        ws.close()
      })
      setStatus('disconnected')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, token])
}
