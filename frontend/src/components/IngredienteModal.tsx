// ─── components/IngredienteModal.tsx ─────────────────────────────────────────
// Modal (ventana emergente) para crear o editar un insumo.
// El mismo componente sirve para ambos casos: si recibe una prop "ingrediente"
// está en modo edición; si no, está en modo creación.
// Usa useMutation de TanStack Query para enviar los cambios al backend.

import { useState, useEffect, FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createIngrediente, updateIngrediente } from '../api/ingredientes'
import { useAuthStore } from '../stores/authStore'
import type { Ingrediente, IngredienteCreate } from '../types'

// Props que recibe este componente desde su padre (IngredientesPage)
interface Props {
  ingrediente?: Ingrediente | null   // undefined/null → modo creación; objeto → modo edición
  onClose: () => void                // función para cerrar el modal
}

// Valores iniciales del formulario cuando se crea uno nuevo
const EMPTY: IngredienteCreate = { nombre: '', descripcion: '', es_alergeno: false, stock_cantidad: 0 }

export default function IngredienteModal({ ingrediente, onClose }: Props) {
  // isEdit: true si se recibió un ingrediente existente
  const isEdit = !!ingrediente

  // useQueryClient: permite acceder al caché de TanStack Query para invalidarlo
  const qc = useQueryClient()
  const isAdmin = useAuthStore((s) => s.isAdmin())

  // form: estado del formulario controlado
  const [form, setForm]         = useState<IngredienteCreate>(EMPTY)
  const [apiError, setApiError] = useState('')

  // ─── useEffect ──────────────────────────────────────────────────────────────
  // Se ejecuta cada vez que cambia la prop "ingrediente".
  // Si se abre en modo edición: carga los datos actuales en el formulario.
  // Si se abre en modo creación: resetea el formulario al estado vacío.
  useEffect(() => {
    if (ingrediente) {
      setForm({
        nombre:          ingrediente.nombre,
        descripcion:     ingrediente.descripcion ?? '',
        es_alergeno:     ingrediente.es_alergeno,
        stock_cantidad:  ingrediente.stock_cantidad,
      })
    } else {
      setForm(EMPTY)
    }
    setApiError('')
  }, [ingrediente])

  // ─── useMutation ────────────────────────────────────────────────────────────
  // useMutation: hook para peticiones que modifican datos (POST, PUT, PATCH, DELETE).
  // A diferencia de useQuery (que carga datos), mutation se llama manualmente.
  const mutation = useMutation({
    // mutationFn: la función que hace la petición HTTP
    mutationFn: () =>
      isEdit
        ? updateIngrediente(ingrediente!.id, {
            nombre:         form.nombre,
            descripcion:    form.descripcion || undefined,  // "" se convierte a undefined (no se envía)
            es_alergeno:    form.es_alergeno,
            stock_cantidad: form.stock_cantidad,
          })
        : createIngrediente({
            ...form,
            descripcion: form.descripcion || undefined,
          }),

    // onSuccess: se llama cuando la petición fue exitosa
    // invalidateQueries: borra el caché de "ingredientes" → fuerza recarga de la tabla
    onSuccess: () => {
      // Invalida TODAS las queries que empezar con "ingredientes"
      qc.invalidateQueries({ queryKey: ['ingredientes'] })
      onClose()   // cierra el modal
    },

    // onError: extrae el mensaje de error del backend y lo muestra en el formulario
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? 'Error al guardar'
      setApiError(msg)
    },
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setApiError('')
    mutation.mutate()   // dispara la mutación
  }

  // isPending: true mientras la petición está en vuelo (bloquea el botón)
  const loading = mutation.isPending

  return (
    // Overlay oscuro detrás del modal
    <div className="modal-overlay" onClick={onClose}>
      {/* stopPropagation: evita que el clic en el modal cierre el overlay */}
      <div className="modal" onClick={(e) => e.stopPropagation()}>

        <div className="modal-header">
          <span className="modal-title">
            {isEdit ? 'Editar Insumo' : 'Nuevo Insumo'}
          </span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">

            {/* Mensaje de error del backend (si hubo) */}
            {apiError && <div className="alert alert-danger">{apiError}</div>}

            {/* Campo: Nombre (obligatorio) */}
            <div className="form-group">
              <label className="form-label" htmlFor="ing-nombre">
                Nombre <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                id="ing-nombre"
                className="form-input"
                type="text"
                maxLength={100}
                placeholder="ej. Carne vacuna"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                required
                disabled={!isAdmin}
                autoFocus   // foco automático al abrir el modal
              />
            </div>

            {/* Campo: Descripción (opcional) */}
            <div className="form-group">
              <label className="form-label" htmlFor="ing-desc">Descripción</label>
              <textarea
                id="ing-desc"
                className="form-textarea"
                rows={3}
                maxLength={500}
                placeholder="Descripción opcional del insumo..."
                value={form.descripcion ?? ''}
                disabled={!isAdmin}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              />
              {/* Contador de caracteres */}
              <span className="form-hint">
                {(form.descripcion ?? '').length}/500 caracteres
              </span>
            </div>

            {/* Campo: Checkbox de alérgeno */}
            <div className="form-group">
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={form.es_alergeno}
                  disabled={!isAdmin}
                  onChange={(e) =>
                    setForm({ ...form, es_alergeno: e.target.checked })
                  }
                />
                <span className="form-label" style={{ marginBottom: 0 }}>
                  Es alérgeno
                </span>
              </label>
              <span className="form-hint">
                Marcá si este insumo puede causar reacciones alérgicas.
              </span>
            </div>

            {/* Campo: Stock */}
            <div className="form-group">
              <label className="form-label" htmlFor="ing-stock">
                Stock
              </label>
              <input
                id="ing-stock"
                className="form-input"
                type="number"
                min="0"
                placeholder="0"
                value={form.stock_cantidad || ''}
                onChange={(e) => setForm({ ...form, stock_cantidad: parseInt(e.target.value) || 0 })}
              />
              <span className="form-hint">
                Cantidad disponible en inventario (opcional).
              </span>
            </div>
          </div>

          {/* Botones del modal */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {/* Spinner mientras guarda, texto estático cuando no */}
              {loading ? <span className="spinner" /> : isEdit ? 'Guardar cambios' : 'Crear insumo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
