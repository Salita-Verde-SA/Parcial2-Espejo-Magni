import { useWsStore } from '../../../stores/wsStore'

/**
 * Indicador de conexión en tiempo real (WebSocket).
 * Muestra "En vivo" cuando hay conexión y "Sin conexión en tiempo real" si se cae.
 */
export default function WsConnectionBadge() {
  const status = useWsStore((s) => s.status)

  const config = {
    connected: { label: 'En vivo', color: '#10b981', dot: '#10b981' },
    connecting: { label: 'Conectando…', color: '#f59e0b', dot: '#f59e0b' },
    disconnected: { label: 'Sin conexión en tiempo real', color: '#ef4444', dot: '#ef4444' },
  }[status]

  return (
    <span
      title={`WebSocket: ${status}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 12,
        fontWeight: 600,
        color: config.color,
        padding: '4px 10px',
        borderRadius: 999,
        border: `1px solid ${config.color}33`,
        background: `${config.color}11`,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: config.dot,
          boxShadow: status === 'connected' ? `0 0 0 3px ${config.dot}33` : 'none',
          animation: status === 'connecting' ? 'pulse 1s infinite' : undefined,
        }}
      />
      {config.label}
    </span>
  )
}
