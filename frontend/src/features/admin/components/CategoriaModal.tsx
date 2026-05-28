// ─── components/CategoriaModal.tsx ───────────────────────────────────────────
// Modal para crear o editar una categoría.

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from '@tanstack/react-form'
import { createCategoria, updateCategoria, fetchCategoriasAll } from '../../../api/categorias'
import type { Categoria, CategoriaCreate } from '../../../types'

interface Props {
  categoria?: Categoria | null
  initialParentId?: number | null
  onClose: () => void
}

const EMPTY: CategoriaCreate = {
  nombre: '',
  descripcion: '',
  parent_id: null,
}

export default function CategoriaModal({ categoria, initialParentId, onClose }: Props) {
  const isEdit = !!categoria
  const qc = useQueryClient()
  const [apiError, setApiError] = useState('')

  // Traer todas las categorías para el selector de padre (incluyendo eliminadas por consistencia)
  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias-all'],
    queryFn: fetchCategoriasAll,
  })

  const form = useForm({
    defaultValues: categoria
      ? {
          nombre: categoria.nombre,
          descripcion: categoria.descripcion ?? '',
          parent_id: categoria.parent_id,
        }
      : { ...EMPTY, parent_id: initialParentId ?? null },
    onSubmit: async ({ value }) => {
      setApiError('')
      mutation.mutate(value)
    },
  })

  useEffect(() => {
    if (categoria) {
      form.setFieldValue('nombre', categoria.nombre)
      form.setFieldValue('descripcion', categoria.descripcion ?? '')
      form.setFieldValue('parent_id', categoria.parent_id)
    } else {
      form.setFieldValue('nombre', '')
      form.setFieldValue('descripcion', '')
      form.setFieldValue('parent_id', initialParentId ?? null)
    }
    setApiError('')
  }, [categoria, initialParentId])

  const mutation = useMutation({
    mutationFn: (value: CategoriaCreate) =>
      isEdit
        ? updateCategoria(categoria!.id, {
            nombre: value.nombre,
            descripcion: value.descripcion || undefined,
            parent_id: value.parent_id,
          })
        : createCategoria({
            ...value,
            descripcion: value.descripcion || undefined,
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

  const loading = mutation.isPending || form.state.isSubmitting

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

        <form onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}>
          <div className="modal-body">
            {apiError && <div className="alert alert-danger">{apiError}</div>}

            <form.Field
              name="nombre"
              validators={{
                onChange: ({ value }) => (!value ? 'El nombre es obligatorio' : undefined),
              }}
              children={(field) => (
                <div className="form-group">
                  <label className="form-label">
                    Nombre <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input
                    className="form-input"
                    type="text"
                    maxLength={100}
                    placeholder="ej. Hamburguesas"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    required
                    autoFocus
                  />
                  {field.state.meta.errors ? (
                    <em role="alert" style={{ color: 'var(--danger)', fontSize: 12 }}>
                      {field.state.meta.errors.join(', ')}
                    </em>
                  ) : null}
                </div>
              )}
            />

            <form.Field
              name="descripcion"
              children={(field) => (
                <div className="form-group">
                  <label className="form-label">Descripción</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    maxLength={500}
                    placeholder="Descripción opcional de la categoría..."
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                </div>
              )}
            />

            <form.Field
              name="parent_id"
              children={(field) => (
                <div className="form-group">
                  <label className="form-label">Categoría padre</label>
                  <select
                    className="form-select"
                    value={field.state.value ?? ''}
                    onChange={(e) => field.handleChange(e.target.value ? Number(e.target.value) : null)}
                    onBlur={field.handleBlur}
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
              )}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading || !form.state.canSubmit}>
              {loading ? <span className="spinner" /> : isEdit ? 'Guardar cambios' : 'Crear categoría'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
