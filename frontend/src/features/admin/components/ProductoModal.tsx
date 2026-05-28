// ─── components/ProductoModal.tsx ─────────────────────────────────────────────
// Modal para crear o editar un producto.
// El mismo componente sirve para ambos casos.

import { useState, useEffect, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from '@tanstack/react-form'
import { createProducto, updateProducto } from '../../../api/productos'
import { fetchCategorias } from '../../../api/categorias'
import { fetchIngredientesAll } from '../../../api/ingredientes'
import { fetchUnidades } from '../../../api/unidades'
import type { Producto, ProductoCreate, CategoriaTree, Ingrediente, IngredienteCantidadInput, UnidadMedida } from '../../../types'

interface Props {
  producto?: Producto | null
  onClose: () => void
}

const EMPTY: Omit<ProductoCreate, 'stock_cantidad'> = {
  nombre: '',
  descripcion: '',
  precio_base: 0,
  unidad_venta_id: null,
  disponible: true,
  imagen_url: '',
  categoria_ids: [],
  ingredientes: [],
}

export default function ProductoModal({ producto, onClose }: Props) {
  const isEdit = !!producto
  const qc = useQueryClient()

  const [apiError, setApiError] = useState('')
  const [stockWarning, setStockWarning] = useState<string | null>(null)

  const form = useForm({
    defaultValues: EMPTY,
    onSubmit: async ({ value }) => {
      setApiError('')
      mutation.mutate(value)
    },
  })

  // Traer categorías
  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias', 'all'],
    queryFn: fetchCategorias,
  })

  // Árbol de categorías para la vista de asignación
  const categoriasTree = useMemo(() => {
    const map = new Map<number, CategoriaTree>()
    const roots: CategoriaTree[] = []
    
    const sorted = [...categorias].sort((a, b) => a.id - b.id)

    sorted.forEach(cat => {
      map.set(cat.id, { ...cat, hijos: [] })
    })

    sorted.forEach(cat => {
      if (cat.parent_id !== null) {
        const parent = map.get(cat.parent_id)
        if (parent) {
          parent.hijos.push(map.get(cat.id)!)
        } else {
          roots.push(map.get(cat.id)!)
        }
      } else {
        roots.push(map.get(cat.id)!)
      }
    })

    return roots
  }, [categorias])

  const [expandedCats, setExpandedCats] = useState<Set<number>>(new Set())

  function toggleExpandCat(id: number, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setExpandedCats(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function renderCategoriaCheckboxes(nodes: CategoriaTree[], depth = 0) {
    return nodes.map(cat => {
      const hasChildren = cat.hijos && cat.hijos.length > 0
      const isExpanded = expandedCats.has(cat.id)

      return (
        <div key={cat.id} style={{ marginLeft: depth > 0 ? 24 : 0, marginTop: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => toggleExpandCat(cat.id, e)}
                style={{ 
                  background: 'none', border: 'none', cursor: 'pointer', 
                  padding: 2, display: 'flex', alignItems: 'center', color: 'var(--text-muted)',
                  transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.15s ease',
                  outline: 'none'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            ) : (
              <div style={{ width: 18 }} /> // Espaciador
            )}
            <label className="checkbox-row" style={{ gap: 6, marginBottom: 0, fontWeight: depth === 0 ? 600 : 400 }}>
              <input
                type="checkbox"
                checked={form.state.values.categoria_ids.includes(cat.id)}
                onChange={() => toggleCategoria(cat.id)}
              />
              <span>{cat.nombre}</span>
            </label>
          </div>
          {hasChildren && isExpanded && (
            <div style={{ marginTop: 2 }}>
              {renderCategoriaCheckboxes(cat.hijos, depth + 1)}
            </div>
          )}
        </div>
      )
    })
  }

  // Traer ingredientes (usando el endpoint "all" para obtenerlos todos)
  const { data: ingredientesData } = useQuery({
    queryKey: ['ingredientes', 'all'],
    queryFn: fetchIngredientesAll,
  })
  const ingredientes: Ingrediente[] = ingredientesData?.items ?? []

  // Traer unidades de medida
  const { data: unidades = [] } = useQuery({
    queryKey: ['unidades'],
    queryFn: fetchUnidades,
  })

  // Verifica si un ingrediente está seleccionado
  function hasIngrediente(ingId: number): boolean {
    return form.state.values.ingredientes.some(i => i.ingrediente_id === ingId)
  }

  // Obtener símbolo de unidad por id
  function getUnidadSimbolo(unidadId: number | null): string {
    if (!unidadId) return ''
    const unidad = unidades.find(u => u.id === unidadId)
    return unidad?.simbolo ?? ''
  }

  // Calcular stock del producto en tiempo real
  function calcularStockEnTiempoReal(): number {
    if (form.state.values.ingredientes.length === 0) return 0
    
    const maxProducts: number[] = []
    
    for (const ing of form.state.values.ingredientes) {
      const ingData = ingredientes.find(i => i.id === ing.ingrediente_id)
      if (!ingData) continue
      
      const stock = ingData.stock_cantidad ?? 0
      const cantidad = ing.cantidad > 0 ? ing.cantidad : 1
      
      // floor(stock / cantidad_necesaria)
      const productosPosibles = Math.floor(stock / cantidad)
      maxProducts.push(productosPosibles)
    }
    
    if (maxProducts.length === 0) return 0
    return Math.min(...maxProducts)
  }

  const stockCalculado = calcularStockEnTiempoReal()

  // Cargar datos del producto en modo edición
  useEffect(() => {
    if (producto) {
      form.setFieldValue('nombre', producto.nombre)
      form.setFieldValue('descripcion', producto.descripcion ?? '')
      form.setFieldValue('precio_base', parseFloat(producto.precio_base))
      form.setFieldValue('unidad_venta_id', producto.unidad_venta_id ?? null)
      form.setFieldValue('disponible', producto.disponible)
      form.setFieldValue('imagen_url', producto.imagen_url ?? '')
      form.setFieldValue('categoria_ids', producto.categorias)
      form.setFieldValue('ingredientes', producto.ingredientes.map(i => ({
        ingrediente_id: i.id,
        cantidad: i.cantidad,
        unidad_medida_id: i.unidad_medida_id,
        es_removible: i.es_removible,
      })))
    } else {
      form.reset()
    }
    setApiError('')
  }, [producto])

  const mutation = useMutation({
    mutationFn: (value: Omit<ProductoCreate, 'stock_cantidad'>) =>
      isEdit
        ? updateProducto(producto!.id, {
            nombre: value.nombre,
            descripcion: value.descripcion || undefined,
            precio_base: value.precio_base,
            unidad_venta_id: value.unidad_venta_id,
            disponible: value.disponible,
            imagen_url: value.imagen_url || undefined,
            categoria_ids: value.categoria_ids,
            ingredientes: value.ingredientes,
          })
        : createProducto({
            ...value,
            descripcion: value.descripcion || undefined,
            imagen_url: value.imagen_url || undefined,
          }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['productos'] })
      qc.invalidateQueries({ queryKey: ['productos-all'] })
      onClose()
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? 'Error al guardar'
      setApiError(msg)
    },
  })

  function toggleCategoria(catId: number) {
    const ids = form.state.values.categoria_ids.includes(catId)
      ? form.state.values.categoria_ids.filter(id => id !== catId)
      : [...form.state.values.categoria_ids, catId]
    form.setFieldValue('categoria_ids', ids)
  }

  function addIngrediente(ingId: number) {
    // Agregar ingrediente con cantidad por defecto 1 y unidad "u" (pieza)
    const unidadDefault = unidades.find(u => u.simbolo === 'u')
    const newIngrediente: IngredienteCantidadInput = {
      ingrediente_id: ingId,
      cantidad: 1,
      unidad_medida_id: unidadDefault?.id ?? 1,
      es_removible: false,
    }
    
    // Verificar stock y mostrar warning si no hay suficiente
    const ing = ingredientes.find(i => i.id === ingId)
    if (ing && ing.stock_cantidad < 1) {
      const ingNombre = ing.nombre
      setStockWarning(`⚠️ El ingrediente "${ingNombre}" no tiene stock disponible (stock: ${ing.stock_cantidad})`)
      setTimeout(() => setStockWarning(null), 4000)
    }
    
    form.setFieldValue('ingredientes', [...form.state.values.ingredientes, newIngrediente])
  }

  function removeIngrediente(ingId: number) {
    form.setFieldValue('ingredientes', form.state.values.ingredientes.filter(i => i.ingrediente_id !== ingId))
  }

  function updateCantidad(ingId: number, cantidad: number) {
    const newIngredientes = form.state.values.ingredientes.map(i =>
      i.ingrediente_id === ingId ? { ...i, cantidad: Math.max(0.001, cantidad) } : i
    )
    form.setFieldValue('ingredientes', newIngredientes)
  }

  function updateUnidadMedida(ingId: number, unidadId: number) {
    const newIngredientes = form.state.values.ingredientes.map(i =>
      i.ingrediente_id === ingId ? { ...i, unidad_medida_id: unidadId } : i
    )
    form.setFieldValue('ingredientes', newIngredientes)
  }

  function toggleEsRemovible(ingId: number) {
    const newIngredientes = form.state.values.ingredientes.map(i =>
      i.ingrediente_id === ingId ? { ...i, es_removible: !i.es_removible } : i
    )
    form.setFieldValue('ingredientes', newIngredientes)
  }

  const loading = mutation.isPending || form.state.isSubmitting

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 650 }}>
        <div className="modal-header">
          <span className="modal-title">
            {isEdit ? 'Editar Producto' : 'Nuevo Producto'}
          </span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}>
          <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            {apiError && <div className="alert alert-danger">{apiError}</div>}
            {stockWarning && (
              <div className="alert alert-warning" style={{ marginBottom: 12 }}>
                {stockWarning}
              </div>
            )}

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
                    placeholder="ej. Classic Burger"
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
                    placeholder="Descripción del producto..."
                    value={field.state.value ?? ''}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                </div>
              )}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <form.Field
                name="precio_base"
                validators={{
                  onChange: ({ value }) => (value < 0 ? 'El precio no puede ser negativo' : undefined),
                }}
                children={(field) => (
                  <div className="form-group">
                    <label className="form-label">
                      Precio base <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    <input
                      className="form-input"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={field.state.value || ''}
                      onChange={(e) => field.handleChange(parseFloat(e.target.value) || 0)}
                      onBlur={field.handleBlur}
                      required
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
                name="unidad_venta_id"
                children={(field) => (
                  <div className="form-group">
                    <label className="form-label">Unidad de venta</label>
                    <select
                      className="form-input"
                      value={field.state.value ?? ''}
                      onChange={(e) => field.handleChange(e.target.value ? Number(e.target.value) : null)}
                      onBlur={field.handleBlur}
                    >
                      <option value="">Sin unidad (por pieza)</option>
                      {unidades.map((u: UnidadMedida) => (
                        <option key={u.id} value={u.id}>
                          {u.simbolo} - {u.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              />

              <div className="form-group">
                <label className="form-label">Stock calculado</label>
                {form.state.values.ingredientes.length > 0 ? (
                  <div style={{ 
                    padding: '8px 12px', 
                    background: stockCalculado > 0 ? 'var(--bg-light)' : 'rgba(220, 53, 69, 0.1)', 
                    borderRadius: 4,
                    border: `1px solid ${stockCalculado > 0 ? 'var(--border)' : 'var(--danger)'}`,
                    color: stockCalculado > 0 ? 'var(--success)' : 'var(--danger)',
                    fontSize: 18,
                    fontWeight: 'bold'
                  }}>
                    {stockCalculado} {stockCalculado === 1 ? 'unidad' : 'unidades'} disponibles
                  </div>
                ) : (
                  <div style={{ 
                    padding: '8px 12px', 
                    background: 'var(--bg-light)', 
                    borderRadius: 4,
                    border: '1px solid var(--border)',
                    color: 'var(--danger)',
                    fontSize: 13,
                    fontStyle: 'italic'
                  }}>
                    Sin ingredientes
                  </div>
                )}
              </div>
            </div>

            <form.Field
              name="imagen_url"
              children={(field) => (
                <div className="form-group">
                  <label className="form-label">URL de imagen</label>
                  <input
                    className="form-input"
                    type="url"
                    placeholder="https://..."
                    value={field.state.value ?? ''}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                </div>
              )}
            />

            <form.Field
              name="disponible"
              children={(field) => (
                <div className="form-group">
                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={field.state.value}
                      onChange={(e) => field.handleChange(e.target.checked)}
                      onBlur={field.handleBlur}
                    />
                    <span className="form-label" style={{ marginBottom: 0 }}>
                      Disponible para venta
                    </span>
                  </label>
                </div>
              )}
            />

            <div className="form-group">
              <label className="form-label">Categorías</label>
              <div style={{ 
                padding: '12px 16px', 
                background: 'var(--bg-light)', 
                borderRadius: 8, 
                border: '1px solid var(--border)',
                maxHeight: 200,
                overflowY: 'auto'
              }}>
                {categoriasTree.length > 0 ? (
                  renderCategoriaCheckboxes(categoriasTree)
                ) : (
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>No hay categorías disponibles.</span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Ingredientes de receta</label>
              
              {/* Lista de ingredientes seleccionados con cantidad y unidad */}
              {form.state.values.ingredientes.length > 0 && (
                <div style={{ marginBottom: 12, padding: 8, background: 'var(--bg-light)', borderRadius: 6 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                    Ingredientes seleccionados:
                  </div>
                  {form.state.values.ingredientes.map((ing) => {
                    const ingInfo = ingredientes.find(i => i.id === ing.ingrediente_id)
                    const simbolo = getUnidadSimbolo(ing.unidad_medida_id)
                    const stockActual = ingInfo?.stock_cantidad ?? 0
                    const tieneStock = stockActual >= ing.cantidad
                    
                    return (
                      <div key={ing.ingrediente_id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 6,
                        flexWrap: 'wrap',
                        padding: tieneStock ? 0 : '4px 8px',
                        background: tieneStock ? 'transparent' : 'rgba(220, 53, 69, 0.1)',
                        borderRadius: 4,
                        border: tieneStock ? 'none' : '1px solid var(--danger)'
                      }}>
                        <span style={{ flex: 1, minWidth: 100, color: tieneStock ? 'inherit' : 'var(--danger)' }}>
                          {ingInfo?.nombre ?? `ID ${ing.ingrediente_id}`}
                          {!tieneStock && <span style={{ fontSize: 11, marginLeft: 4 }}>⚠️ Sin stock</span>}
                        </span>
                        
                        {/* Stock actual del ingrediente */}
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginRight: 4 }}>
                          Stock: {stockActual}
                        </span>
                        
                        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                          Cant:
                          <input
                            type="number"
                            min="0.001"
                            step="0.001"
                            style={{ width: 60, padding: '4px 6px', borderRadius: 4, border: '1px solid var(--border)' }}
                            value={ing.cantidad}
                            onChange={(e) => updateCantidad(ing.ingrediente_id, parseFloat(e.target.value) || 0.001)}
                          />
                        </label>
                        {simbolo && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{simbolo}</span>}
                        <select
                          style={{ padding: '4px 6px', borderRadius: 4, border: '1px solid var(--border)', fontSize: 13 }}
                          value={ing.unidad_medida_id}
                          onChange={(e) => updateUnidadMedida(ing.ingrediente_id, Number(e.target.value))}
                        >
                          {unidades.map((u: UnidadMedida) => (
                            <option key={u.id} value={u.id}>
                              {u.simbolo}
                            </option>
                          ))}
                        </select>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                          <input
                            type="checkbox"
                            checked={ing.es_removible}
                            onChange={() => toggleEsRemovible(ing.ingrediente_id)}
                          />
                          Remov.
                        </label>
                        <button
                          type="button"
                          onClick={() => removeIngrediente(ing.ingrediente_id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--danger)',
                            cursor: 'pointer',
                            fontSize: 18,
                            padding: '0 4px'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
              
              {/* Checkboxes para agregar ingredientes */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 120, overflowY: 'auto' }}>
                {ingredientes.map((ing: Ingrediente) => (
                  <label key={ing.id} className="checkbox-row" style={{ gap: 6, opacity: ing.stock_cantidad > 0 ? 1 : 0.5 }}>
                    <input
                      type="checkbox"
                      checked={hasIngrediente(ing.id)}
                      onChange={() => hasIngrediente(ing.id) ? removeIngrediente(ing.id) : addIngrediente(ing.id)}
                      disabled={ing.stock_cantidad === 0}
                    />
                    <span title={`Stock: ${ing.stock_cantidad}`}>
                      {ing.nombre}
                      {ing.stock_cantidad > 0 && <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 4 }}>({ing.stock_cantidad})</span>}
                      {ing.stock_cantidad === 0 && <span style={{ fontSize: 10, color: 'var(--danger)', marginLeft: 4 }}>(sin stock)</span>}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading || !form.state.canSubmit}>
              {loading ? <span className="spinner" /> : isEdit ? 'Guardar cambios' : 'Crear producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
