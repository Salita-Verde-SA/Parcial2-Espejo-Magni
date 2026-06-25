import { create } from 'zustand'

export type WsStatus = 'connecting' | 'connected' | 'disconnected'

interface WsState {
  status: WsStatus
  lastEvent: string | null
  setStatus: (status: WsStatus) => void
  setLastEvent: (event: string | null) => void
}

/**
 * Estado de la(s) conexión(es) WebSocket en tiempo real.
 * Lo gestionan EXCLUSIVAMENTE los hooks useAdminOrdersFeed / useMisPedidosFeed;
 * los componentes solo lo leen (p. ej. el badge "Sin conexión").
 */
export const useWsStore = create<WsState>((set) => ({
  status: 'disconnected',
  lastEvent: null,
  setStatus: (status) => set({ status }),
  setLastEvent: (lastEvent) => set({ lastEvent }),
}))
