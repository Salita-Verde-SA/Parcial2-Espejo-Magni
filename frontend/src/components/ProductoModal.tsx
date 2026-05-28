import { useState, useEffect, FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createProducto, updateProducto, updateStock } from '../api/productos'
import { fetchCategorias } from '../api/categorias'
import { fetchIngredientesAll } from '../api/ingredientes'
import { fetchUnidades } from '../api/unidades'
import type { Producto, ProductoCreate, Categoria, Ingrediente, IngredienteCantidadInput, UnidadMedida } from '../types'

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

  const [form, setForm] = useState(EMPTY)
  const [apiError, setApiError] = useState('')
  const [stockWarning, setStockWarning] = useState<string | null>(null)

  // Modo venta directa: sin ingredientes, stock manual
  const [ventaDirecta, setVentaDirecta] = useState(false)
  const [stockDirecto, setStockDirecto] = useState(0)

  const { data: categorias = [] } = useQuery({
    queryKey: ['categorias', 'all'],
    queryFn: fetchCategorias,
  })

  const { data: ingredientesData } = useQuery({
    queryKey: ['ingredientes', 'all'],
    queryFn: fetchIngredientesAll,
  })
  const ingredientes: Ingrediente[] = ingredientesData?.items ?? []

  const { data: unidades = [] } = useQuery({
    queryKey: ['unidades'],
    queryFn: fetchUnidades,
  })

  function hasIngrediente(ingId: number): boolean {
    return form.ingredientes.some(i => i.ingrediente_id === ingId)
  }

  function getUnidadSimbolo(unidadId: number | null): string {
    if (!unidadId) return ''
    return unidades.find(u => u.id === unidadId)?.simbolo ?? ''
  }

  function calcularStockEnTiempoReal(): number {
    if (form.ingredientes.length === 0) return 0
    const maxProducts: number[] = []
    for (const ing of form.ingredientes) {
      const ingData = ingredientes.find(i => i.id === ing.ingrediente_id)
      if (!ingData) continue
      const stock = ingData.stock_cantidad ?? 0
      const cantidad = ing.cantidad > 0 ? ing.cantidad : 1
      maxProducts.push(Math.floor(stock / cantidad))
    }
    if (maxProducts.length === 0) return 0
    return Math.min(...maxProducts)
  }

  const stockCalculado = calcularStockEnTiempoReal()

  useEffect(() => {
    if (producto) {
      const sinIngredientes = producto.ingredientes.length === 0
      setVentaDirecta(sinIngredientes)
      setStockDirecto(sinIngredientes ? (producto.stock_cantidad ?? 0) : 0)
      setForm({
        nombre: producto.nombre,
        descripcion: producto.descripcion ?? '',
        precio_base: parseFloat(producto.precio_base),
        unidad_venta_id: producto.unidad_venta_id ?? null,
        disponible: producto.disponible,
        imagen_url: producto.imagen_url ?? '',
        categoria_ids: producto.categorias,
        ingredientes: producto.ingredientes.map(i => ({
          ingrediente_id: i.id,
          cantidad: i.cantidad,
          unidad_medida_id: i.unidad_medida_id,
          es_removible: i.es_removible,
        })),
      })
    } else {
      setVentaDirecta(false)
      setStockDirecto(0)
      setForm(EMPTY)
    }
    setApiError('')
  }, [producto])

  function handleToggleVentaDirecta(valor: boolean) {
    setVentaDirecta(valor)
    if (valor) {
      // Limpiar ingredientes al pasar a venta directa
      setForm(prev => ({ ...prev, ingredientes: [] }))
      setStockWarning(null)
    }
  }

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        nombre: form.nombre,
        descripcion: form.descripcion || undefined,
        precio_base: form.precio_base,
        unidad_venta_id: form.unidad_venta_id,
        disponible: form.disponible,
        imagen_url: form.imagen_url || undefined,
        categoria_ids: form.categoria_ids,
        ingredientes: ventaDirecta ? [] : form.ingredientes,
      }

      const saved = isEdit
        ? await updateProducto(producto!.id, payload)
        : await createProducto({ ...form, ...payload })

      // El stock no está en ProductoCreate/ProductoUpdate — se actualiza por endpoint dedicado
      if (ventaDirecta) {
        await updateStock(saved.id, { stock_cantidad: stockDirecto, disponible: form.disponible })
      }

      return saved
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['productos'] })
      qc.invalidateQueries({ queryKey: ['productos-all'] })
      onClose()
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Error al guardar'
      setApiError(msg)
    },
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setApiError('')
    if (!ventaDirecta && form.ingredientes.length === 0) {
      setApiError('Modo "Con receta" requiere al menos un ingrediente. Si el producto no tiene receta, seleccioná "Venta directa".')
      return
    }
    mutation.mutate()
  }

  function toggleCategoria(catId: number) {
    const ids = form.categoria_ids.includes(catId)
      ? form.categoria_ids.filter(id => id !== catId)
      : [...form.categoria_ids, catId]
    setForm({ ...form, categoria_ids: ids })
  }

  function addIngrediente(ingId: number) {
    const unidadDefault = unidades.find(u => u.simbolo === 'u')
    const newIngrediente: IngredienteCantidadInput = {
      ingrediente_id: ingId,
      cantidad: 1,
      unidad_medida_id: unidadDefault?.id ?? 1,
      es_removible: false,
    }
    const ing = ingredientes.find(i => i.id === ingId)
    if (ing && ing.stock_cantidad < 1) {
      setStockWarning(`El ingrediente "${ing.nombre}" no tiene stock disponible (stock: ${ing.stock_cantidad})`)
      setTimeout(() => setStockWarning(null), 4000)
    }
    setForm({ ...form, ingredientes: [...form.ingredientes, newIngrediente] })
  }

  function removeIngrediente(ingId: number) {
    setForm({ ...form, ingredientes: form.ingredientes.filter(i => i.ingrediente_id !== ingId) })
  }

  function updateCantidad(ingId: number, cantidad: number) {
    setForm({
      ...form,
      ingredientes: form.ingredientes.map(i =>
        i.ingrediente_id === ingId ? { ...i, cantidad: Math.max(0.001, cantidad) } : i
      ),
    })
  }

  function updateUnidadMedida(ingId: number, unidadId: number) {
    setForm({
      ...form,
      ingredientes: form.ingredientes.map(i =>
        i.ingrediente_id === ingId ? { ...i, unidad_medida_id: unidadId } : i
      ),
    })
  }

  function toggleEsRemovible(ingId: number) {
    setForm({
      ...form,
      ingredientes: form.ingredientes.map(i =>
        i.ingrediente_id === ingId ? { ...i, es_removible: !i.es_removible } : i
      ),
    })
  }

  const loading = mutation.isPending

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 650 }}>
        <div className="modal-header">
          <span className="modal-title">{isEdit ? 'Editar Producto' : 'Nuevo Producto'}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            {apiError && <div className="alert alert-danger">{apiError}</div>}
            {stockWarning && (
              <div className="alert alert-danger" style={{ marginBottom: 12 }}>{stockWarning}</div>
            )}

            {/* Nombre */}
            <div className="form-group">
              <label className="form-label">
                Nombre <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                className="form-input"
                type="text"
                maxLength={100}
                placeholder="ej. Classic Burger"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                required
                autoFocus
              />
            </div>

            {/* Descripción */}
            <div className="form-group">
              <label className="form-label">Descripción</label>
              <textarea
                className="form-textarea"
                rows={3}
                maxLength={500}
                placeholder="Descripción del producto..."
                value={form.descripcion ?? ''}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              />
            </div>

            {/* Precio / Unidad / Stock */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
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
                  value={form.precio_base || ''}
                  onChange={(e) => setForm({ ...form, precio_base: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Unidad de venta</label>
                <select
                  className="form-input"
                  value={form.unidad_venta_id ?? ''}
                  onChange={(e) => setForm({ ...form, unidad_venta_id: e.target.value ? Number(e.target.value) : null })}
                >
                  <option value="">Sin unidad (por pieza)</option>
                  {unidades.map((u: UnidadMedida) => (
                    <option key={u.id} value={u.id}>{u.simbolo} - {u.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Stock calculado</label>
                {ventaDirecta ? (
                  <div style={{
                    padding: '8px 12px', borderRadius: 6,
                    background: 'var(--surface-alt)', border: '1px solid var(--border)',
                    color: 'var(--text-muted)', fontSize: 13, fontStyle: 'italic',
                  }}>
                    Manual (venta directa)
                  </div>
                ) : form.ingredientes.length > 0 ? (
                  <div style={{
                    padding: '8px 12px', borderRadius: 6,
                    background: stockCalculado > 0 ? 'var(--success-bg)' : 'var(--danger-bg)',
                    border: `1px solid ${stockCalculado > 0 ? '#BBF7D0' : '#FECACA'}`,
                    color: stockCalculado > 0 ? 'var(--success)' : 'var(--danger)',
                    fontSize: 15, fontWeight: 700,
                  }}>
                    {stockCalculado} {stockCalculado === 1 ? 'unidad' : 'unidades'}
                  </div>
                ) : (
                  <div style={{
                    padding: '8px 12px', borderRadius: 6,
                    background: 'var(--surface-alt)', border: '1px solid var(--border)',
                    color: 'var(--danger)', fontSize: 13, fontStyle: 'italic',
                  }}>
                    Sin ingredientes
                  </div>
                )}
              </div>
            </div>

            {/* URL imagen */}
            <div className="form-group">
              <label className="form-label">URL de imagen</label>
              <input
                className="form-input"
                type="url"
                placeholder="https://..."
                value={form.imagen_url ?? ''}
                onChange={(e) => setForm({ ...form, imagen_url: e.target.value })}
              />
            </div>

            {/* Disponible */}
            <div className="form-group">
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={form.disponible}
                  onChange={(e) => setForm({ ...form, disponible: e.target.checked })}
                />
                <span className="form-label" style={{ marginBottom: 0 }}>Disponible para venta</span>
              </label>
            </div>

            {/* Categorías */}
            <div className="form-group">
              <label className="form-label">Categorías</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {categorias.map((cat: Categoria) => (
                  <label key={cat.id} className="checkbox-row" style={{ gap: 6 }}>
                    <input
                      type="checkbox"
                      checked={form.categoria_ids.includes(cat.id)}
                      onChange={() => toggleCategoria(cat.id)}
                    />
                    <span>{cat.nombre}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Toggle: Con receta vs Venta directa */}
            <div className="form-group">
              <label className="form-label">Tipo de stock</label>
              <div className="view-toggle" style={{ width: 'fit-content' }}>
                <button
                  type="button"
                  className={`view-toggle-btn ${!ventaDirecta ? 'active' : ''}`}
                  onClick={() => handleToggleVentaDirecta(false)}
                >
                  Con receta
                </button>
                <button
                  type="button"
                  className={`view-toggle-btn ${ventaDirecta ? 'active' : ''}`}
                  onClick={() => handleToggleVentaDirecta(true)}
                >
                  Venta directa
                </button>
              </div>
              <span className="form-hint" style={{ marginTop: 6 }}>
                {ventaDirecta
                  ? 'El stock se ingresa manualmente. Ideal para bebidas, productos envasados, etc.'
                  : 'El stock se calcula automáticamente según los ingredientes de la receta.'}
              </span>
            </div>

            {/* Stock manual (solo en venta directa) */}
            {ventaDirecta && (
              <div className="form-group">
                <label className="form-label">
                  Stock disponible <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={stockDirecto}
                  max={99999}
                  onChange={(e) => {
                    const val = parseInt(e.target.value)
                    if (isNaN(val) || val < 0) { setStockDirecto(0); return }
                    if (val > 99999) { setApiError('El stock no puede superar 99.999 unidades.'); return }
                    setApiError('')
                    setStockDirecto(val)
                  }}
                  required={ventaDirecta}
                  style={{ maxWidth: 180 }}
                />
                <span className="form-hint">Cantidad de unidades disponibles en stock.</span>
              </div>
            )}

            {/* Ingredientes de receta (solo cuando NO es venta directa) */}
            {!ventaDirecta && (
              <div className="form-group">
                <label className="form-label">Ingredientes de receta</label>

                {form.ingredientes.length > 0 && (
                  <div style={{
                    marginBottom: 12, padding: 12,
                    background: 'var(--surface-alt)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>
                      Ingredientes seleccionados
                    </div>
                    {form.ingredientes.map((ing) => {
                      const ingInfo = ingredientes.find(i => i.id === ing.ingrediente_id)
                      const simbolo = getUnidadSimbolo(ing.unidad_medida_id)
                      const stockActual = ingInfo?.stock_cantidad ?? 0
                      const tieneStock = stockActual >= ing.cantidad

                      return (
                        <div key={ing.ingrediente_id} style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          marginBottom: 8, flexWrap: 'wrap',
                          padding: '6px 8px',
                          background: tieneStock ? 'var(--surface)' : 'var(--danger-bg)',
                          borderRadius: 6,
                          border: `1px solid ${tieneStock ? 'var(--border)' : '#FECACA'}`,
                        }}>
                          <span style={{ flex: 1, minWidth: 100, fontSize: 13, fontWeight: 500, color: tieneStock ? 'var(--text)' : 'var(--danger)' }}>
                            {ingInfo?.nombre ?? `ID ${ing.ingrediente_id}`}
                            {!tieneStock && <span style={{ fontSize: 11, marginLeft: 4, fontWeight: 400 }}>(sin stock)</span>}
                          </span>

                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            Stock: {stockActual}
                          </span>

                          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                            Cant:
                            <input
                              type="number"
                              min="0.001"
                              step="0.001"
                              style={{ width: 60, padding: '4px 6px', borderRadius: 6, border: '1.5px solid var(--border)', fontSize: 13 }}
                              value={ing.cantidad}
                              onChange={(e) => updateCantidad(ing.ingrediente_id, parseFloat(e.target.value) || 0.001)}
                            />
                          </label>

                          {simbolo && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{simbolo}</span>}

                          <select
                            style={{ padding: '4px 6px', borderRadius: 6, border: '1.5px solid var(--border)', fontSize: 13 }}
                            value={ing.unidad_medida_id}
                            onChange={(e) => updateUnidadMedida(ing.ingrediente_id, Number(e.target.value))}
                          >
                            {unidades.map((u: UnidadMedida) => (
                              <option key={u.id} value={u.id}>{u.simbolo}</option>
                            ))}
                          </select>

                          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                            <input
                              type="checkbox"
                              checked={ing.es_removible}
                              onChange={() => toggleEsRemovible(ing.ingrediente_id)}
                            />
                            Removible
                          </label>

                          <button
                            type="button"
                            onClick={() => removeIngrediente(ing.ingrediente_id)}
                            style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 18, padding: '0 4px', lineHeight: 1 }}
                          >
                            ×
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 130, overflowY: 'auto', padding: 4 }}>
                  {ingredientes.map((ing: Ingrediente) => (
                    <label key={ing.id} className="checkbox-row" style={{ gap: 6, opacity: ing.stock_cantidad > 0 ? 1 : 0.5 }}>
                      <input
                        type="checkbox"
                        checked={hasIngrediente(ing.id)}
                        onChange={() => hasIngrediente(ing.id) ? removeIngrediente(ing.id) : addIngrediente(ing.id)}
                        disabled={ing.stock_cantidad === 0}
                      />
                      <span title={`Stock: ${ing.stock_cantidad}`} style={{ fontSize: 13 }}>
                        {ing.nombre}
                        <span style={{ fontSize: 10, color: ing.stock_cantidad > 0 ? 'var(--text-muted)' : 'var(--danger)', marginLeft: 4 }}>
                          ({ing.stock_cantidad})
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : isEdit ? 'Guardar cambios' : 'Crear producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
