// ─── components/ConfirmDialog.tsx ────────────────────────────────────────────
// Diálogo de confirmación reutilizable para acciones destructivas.
// Se muestra antes de eliminar o dar de baja un registro.
// Es genérico: el mensaje, el label del botón y su color se pasan por props.

// Props del componente
interface Props {
  message: React.ReactNode   // puede ser texto simple o JSX con <strong>, etc.
  onConfirm: () => void      // función que ejecuta la acción al confirmar
  onCancel: () => void       // función que cierra el diálogo sin hacer nada
  loading?: boolean          // si true → muestra spinner y bloquea botones
  confirmLabel?: string      // texto del botón de confirmación (default: "Confirmar")
  confirmVariant?: 'danger' | 'primary'  // color del botón (default: rojo)
}

export default function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
  loading = false,
  confirmLabel = 'Confirmar',
  confirmVariant = 'danger',
}: Props) {
  return (
    // Overlay oscuro con blur
    <div className="modal-overlay" onClick={onCancel}>
      {/* Modal pequeño (maxWidth 400) para diálogos de confirmación */}
      <div className="modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>

        <div className="modal-header">
          <span className="modal-title">Confirmar acción</span>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>

        <div className="modal-body">
          {/* Ícono de advertencia: círculo amarillo con "!" (CSS puro, sin emoji) */}
          <div className="confirm-icon">!</div>

          {/* Mensaje descriptivo de la acción a confirmar */}
          <div className="confirm-msg">{message}</div>
        </div>

        <div className="modal-footer">
          {/* Botón cancelar: siempre ghost, cierra sin hacer nada */}
          <button className="btn btn-ghost" onClick={onCancel} disabled={loading}>
            Cancelar
          </button>

          {/* Botón confirmar: su clase CSS cambia según confirmVariant
              btn-danger (rojo) para eliminar, btn-primary para otras acciones */}
          <button
            className={`btn btn-${confirmVariant}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
