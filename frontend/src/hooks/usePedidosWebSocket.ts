/**
 * Compatibilidad: el feed admin vive ahora en useOrderStatusWS.
 * Se reexporta como usePedidosWebSocket para no romper imports previos.
 */
export { useAdminOrdersFeed as usePedidosWebSocket } from './useOrderStatusWS'
