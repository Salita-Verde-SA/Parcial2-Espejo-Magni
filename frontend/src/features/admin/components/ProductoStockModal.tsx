import { useState, FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateStock } from '../../../api/productos'
import type { Producto } from '../../../types'

interface Props {
  producto: Producto
  onClose: () => void
}

export default function ProductoStockModal({ producto, onClose }: Props) {
  const qc = useQueryClient()
  const [stockCantidad, setStockCantidad] = useState(producto.stock_cantidad)
  const [disponible, setDisponible] = useState(producto.disponible)
  const [apiError, setApiError] = useState('')

  const mutation = useMutation({
    mutationFn: () => updateStock(producto.id, { stock_cantidad: stockCantidad, disponible }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['productos'] })
      qc.invalidateQueries({ queryKey: ['productos-all'] })
      onClose()
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? 'Error al actualizar el stock'
      setApiError(msg)
    },
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setApiError('')
    if (stockCantidad < 0 || Number.isNaN(stockCantidad)) {
      setApiError('La cantidad de stock no puede ser negativa')
      return
    }
    mutation.mutate()
  }

  const loading = mutation.isPending

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <span className="modal-title">Gestión Rápida de Stock</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {apiError && <div className="alert alert-danger">{apiError}</div>}

            <p style={{ marginBottom: 16 }}>
              Actualizando producto: <strong>{producto.nombre}</strong>
            </p>

            <div className="form-group">
              <label className="form-label" htmlFor="stock-cantidad">
                Cantidad de stock
              </label>
              <input
                id="stock-cantidad"
                className="form-input"
                type="number"
                min={0}
                step={1}
                value={stockCantidad}
                onChange={(e) => setStockCantidad(e.target.valueAsNumber)}
              />
            </div>

            <div className="form-group">
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={disponible}
                  onChange={(e) => setDisponible(e.target.checked)}
                />
                <span className="form-label" style={{ marginBottom: 0 }}>
                  Disponible para venta
                </span>
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
