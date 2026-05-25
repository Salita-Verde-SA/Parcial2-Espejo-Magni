// ─── components/CategoriaModal.tsx ───────────────────────────────────────────
// Modal para crear o editar una categoría.

import { useState, useEffect, FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createCategoria, updateCategoria, fetchCategoriasAll } from '../api/categorias'
import type { Categoria, CategoriaCreate } from '../types'

interface Props {
  categoria?: Categoria | null
  onClose: () => void
}

const EMPTY: CategoriaCreate = {
  nombre: '',
  descripcion: '',
  parent_id: null,
}

export default function CategoriaModal({ categoria, onClose }: Props) {
  const isEdit = !!categoria
  const qc = useQueryClient()

  const [form, setForm] = useState<CategoriaCreate>(EMPTY)
  const [apiError, setApiError] = useState('')

  // Traer todas las categorías para el selector de padre (incluyendo eliminadas por consistencia)
  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias-all'],
    queryFn: fetchCategoriasAll,
  })

  useEffect(() => {
    if (categoria) {
      setForm({
        nombre: categoria.nombre,
        descripcion: categoria.descripcion ?? '',
        parent_id: categoria.parent_id,
      })
    } else {
      setForm(EMPTY)
    }
    setApiError('')
  }, [categoria])

  const mutation = useMutation({
    mutationFn: () =>
      isEdit
        ? updateCategoria(categoria!.id, {
            nombre: form.nombre,
            descripcion: form.descripcion || undefined,
            parent_id: form.parent_id,
          })
        : createCategoria({
            ...form,
            descripcion: form.descripcion || undefined,
          }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categorias-all'] })
      qc.invalidateQueries({ queryKey: ['categorias-tree'] })
      onClose()
    },
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
    mutation.mutate()
  }

  const loading = mutation.isPending

  // Excluir la categoría actual de las opciones de padre (evitar auto-referencia)
  const parentOptions = categorias.filter(c => c.id !== categoria?.id)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">
            {isEdit ? 'Editar Categoría' : 'Nueva Categoría'}
          </span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {apiError && <div className="alert alert-danger">{apiError}</div>}

            <div className="form-group">
              <label className="form-label">
                Nombre <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                className="form-input"
                type="text"
                maxLength={100}
                placeholder="ej. Hamburguesas"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Descripción</label>
              <textarea
                className="form-textarea"
                rows={3}
                maxLength={500}
                placeholder="Descripción opcional de la categoría..."
                value={form.descripcion ?? ''}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Categoría padre</label>
              <select
                className="form-select"
                value={form.parent_id ?? ''}
                onChange={(e) => setForm({ ...form, parent_id: e.target.value ? Number(e.target.value) : null })}
              >
                <option value="">Ninguna (categoría raíz)</option>
                {parentOptions.map((cat: Categoria) => (
                  <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                ))}
              </select>
              <span className="form-hint">
                Seleccioná una categoría padre si querés crear una subcategoría.
              </span>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : isEdit ? 'Guardar cambios' : 'Crear categoría'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}