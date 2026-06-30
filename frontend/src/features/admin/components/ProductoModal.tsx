// ─── components/ProductoModal.tsx ─────────────────────────────────────────────
// Modal para crear o editar un producto.
// El mismo componente sirve para ambos casos.

import { useState, useEffect, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from '@tanstack/react-form'
import { createProducto, updateProducto, updateComposicion } from '../../../api/productos'
import { fetchCategorias } from '../../../api/categorias'
import { fetchIngredientesAll } from '../../../api/ingredientes'
import { fetchUnidades } from '../../../api/unidades'
import { uploadImagen, deleteImagen, cldThumb } from '../../../api/uploads'
import type { Producto, ProductoCreate, CategoriaTree, Ingrediente, IngredienteCantidadInput, UnidadMedida } from '../../../types'

interface Props {
  producto?: Producto | null
  onClose: () => void
  // Si es false, los campos comerciales (nombre, precio, etc.) quedan de solo
  // lectura y solo se editan categorías e ingredientes (rol STOCK).
  canEditComercial?: boolean
}

const MARGEN_SUGERIDO = 20

const EMPTY: Omit<ProductoCreate, 'stock_cantidad'> = {
  nombre: '',
  descripcion: '',
  precio_base: 0,
  margen_ganancia: MARGEN_SUGERIDO,
  unidad_venta_id: null,
  disponible: true,
  imagen_url: '',
  categoria_ids: [],
  ingredientes: [],
}

export default function ProductoModal({ producto, onClose, canEditComercial = true }: Props) {
  const isEdit = !!producto
  const qc = useQueryClient()

  const [apiError, setApiError] = useState('')
  const [stockWarning, setStockWarning] = useState<string | null>(null)
  // Estado del uploader de imágenes Cloudinary
  const [imgUploading, setImgUploading] = useState(false)
  const [imgPublicId, setImgPublicId] = useState<string | null>(null)
  const [imgError, setImgError] = useState('')
  const [ingSearch, setIngSearch] = useState('')

  const form = useForm({
    defaultValues: EMPTY,
    onSubmit: async ({ value }) => {
      setApiError('')
      const { precioSugerido } = calcularCostoYPrecioSugerido(value.ingredientes, value.margen_ganancia)
      value.precio_base = precioSugerido
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

  // Mapas de jerarquía para cascade de categorías
  const parentMap = useMemo(() => {
    const map = new Map<number, number>()
    categorias?.forEach(c => {
      if (c.parent_id !== null) map.set(c.id, c.parent_id)
    })
    return map
  }, [categorias])

  const childrenMap = useMemo(() => {
    const map = new Map<number, number[]>()
    categorias?.forEach(c => {
      if (c.parent_id !== null) {
        const siblings = map.get(c.parent_id) ?? []
        siblings.push(c.id)
        map.set(c.parent_id, siblings)
      }
    })
    return map
  }, [categorias])

  function getAllDescendants(id: number): number[] {
    const result: number[] = []
    const stack = [id]
    while (stack.length > 0) {
      const current = stack.pop()!
      const kids = childrenMap.get(current)
      if (kids) {
        for (const kid of kids) {
          result.push(kid)
          stack.push(kid)
        }
      }
    }
    return result
  }

  function getAllAncestors(id: number): number[] {
    const result: number[] = []
    let current = parentMap.get(id)
    while (current !== undefined) {
      result.push(current)
      current = parentMap.get(current)
    }
    return result
  }

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

  function renderCategoriaCheckboxes(nodes: CategoriaTree[], currentIds: number[], indeterminateIds: Set<number>, depth = 0) {
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
              <div style={{ width: 18 }} />
            )}
            <label className="checkbox-row" style={{ gap: 6, marginBottom: 0, fontWeight: depth === 0 ? 600 : 400 }}>
              <input
                type="checkbox"
                checked={currentIds.includes(cat.id)}
                onChange={() => toggleCategoria(cat.id)}
                disabled={!canEditComercial}
                ref={el => { if (el) el.indeterminate = indeterminateIds.has(cat.id) }}
              />
              <span>{cat.nombre}</span>
            </label>
          </div>
          {hasChildren && isExpanded && (
            <div style={{ marginTop: 2 }}>
              {renderCategoriaCheckboxes(cat.hijos, currentIds, indeterminateIds, depth + 1)}
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
  function hasIngrediente(ingId: number, selectedIngs: any[]): boolean {
    return selectedIngs.some(i => i.ingrediente_id === ingId)
  }

  // Obtener símbolo de unidad por id
  function getUnidadSimbolo(unidadId: number | null | undefined): string {
    if (!unidadId) return ''
    const unidad = unidades.find(u => u.id === unidadId)
    return unidad?.simbolo ?? ''
  }

  function isUnidadContable(unidadId: number | null | undefined): boolean {
    if (!unidadId) return false
    const unidad = unidades.find(u => u.id === unidadId)
    return unidad?.tipo === 'contable'
  }

  // Calcular stock del producto en tiempo real
  function calcularStockEnTiempoReal(selectedIngs: any[]): number {
    if (selectedIngs.length === 0) return 0
    
    const maxProducts: number[] = []
    
    for (const ing of selectedIngs) {
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

  // Calcular costo sugerido
  function calcularCostoYPrecioSugerido(selectedIngs: any[], margenGanancia: number) {
    let costoTotal = 0
    for (const ing of selectedIngs) {
      const ingData = ingredientes.find(i => i.id === ing.ingrediente_id)
      if (!ingData) continue
      const costoUnitario = parseFloat(ingData.costo_unitario) || 0
      costoTotal += costoUnitario * ing.cantidad
    }
    const precioSugerido = costoTotal * (1 + (margenGanancia / 100))
    return { costoTotal, precioSugerido }
  }

  // Cargar datos del producto en modo edición
  useEffect(() => {
    if (producto) {
      form.setFieldValue('nombre', producto.nombre)
      form.setFieldValue('descripcion', producto.descripcion ?? '')
      form.setFieldValue('precio_base', parseFloat(producto.precio_base))
      form.setFieldValue('margen_ganancia', parseFloat(producto.margen_ganancia))
      form.setFieldValue('unidad_venta_id', producto.unidad_venta_id ?? null)
      form.setFieldValue('disponible', producto.disponible)
      form.setFieldValue('imagen_url', producto.imagen_url ?? '')
      form.setFieldValue('categoria_ids', producto.categorias)
      form.setFieldValue('ingredientes', producto.ingredientes.map(i => ({
        ingrediente_id: i.id,
        cantidad: i.cantidad,
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
        ? canEditComercial
          ? updateProducto(producto!.id, {
              nombre: value.nombre,
              descripcion: value.descripcion || undefined,
              precio_base: value.precio_base,
              margen_ganancia: value.margen_ganancia,
              unidad_venta_id: value.unidad_venta_id,
              disponible: value.disponible,
              imagen_url: value.imagen_url || undefined,
              categoria_ids: value.categoria_ids,
              ingredientes: value.ingredientes,
            })
          : updateComposicion(producto!.id, {
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
    const currentIds = form.getFieldValue('categoria_ids')
    const ancestors = getAllAncestors(catId)
    const expectedSet = new Set([catId, ...ancestors])

    // Misma selección actual → toggle off (limpia todo)
    if (currentIds.length === expectedSet.size && currentIds.every(id => expectedSet.has(id))) {
      form.setFieldValue('categoria_ids', [])
      return
    }

    // Reemplazar selección: solo esta categoría + sus ancestros
    form.setFieldValue('categoria_ids', [catId, ...ancestors])
  }

  function computeIndeterminateIds(currentIds: number[]): Set<number> {
    const indeterminate = new Set<number>()
    const catList = categorias ?? []
    for (const cat of catList) {
      const descendants = getAllDescendants(cat.id)
      if (descendants.length === 0) continue
      const selectedCount = descendants.filter(d => currentIds.includes(d)).length
      if (selectedCount > 0 && selectedCount < descendants.length) {
        indeterminate.add(cat.id)
      }
    }
    return indeterminate
  }

  function addIngrediente(ingId: number) {
    const currentIngs = form.getFieldValue('ingredientes')
    const ing = ingredientes.find(i => i.id === ingId)
    const newIngrediente: IngredienteCantidadInput = {
      ingrediente_id: ingId,
      cantidad: 1,
      es_removible: false,
    }
    
    // Verificar stock y mostrar warning si no hay suficiente
    if (ing && ing.stock_cantidad < 1) {
      const ingNombre = ing.nombre
      setStockWarning(`⚠️ El ingrediente "${ingNombre}" no tiene stock disponible (stock: ${ing.stock_cantidad})`)
      setTimeout(() => setStockWarning(null), 4000)
    }
    
    form.setFieldValue('ingredientes', [...currentIngs, newIngrediente])
  }

  function removeIngrediente(ingId: number) {
    const currentIngs = form.getFieldValue('ingredientes')
    form.setFieldValue('ingredientes', currentIngs.filter((i: any) => i.ingrediente_id !== ingId))
  }

  function updateCantidad(ingId: number, cantidad: number) {
    const ingData = ingredientes.find(i => i.id === ingId)
    if (ingData?.es_terminado) {
      cantidad = 1
    }
    const minVal = isUnidadContable(ingData?.unidad_medida_id) ? 1 : 0.01
    const currentIngs = form.getFieldValue('ingredientes')
    const newIngredientes = currentIngs.map((i: any) =>
      i.ingrediente_id === ingId ? { ...i, cantidad: Math.max(minVal, cantidad) } : i
    )
    form.setFieldValue('ingredientes', newIngredientes)
  }

  function toggleEsRemovible(ingId: number) {
    const currentIngs = form.getFieldValue('ingredientes')
    const newIngredientes = currentIngs.map((i: any) =>
      i.ingrediente_id === ingId ? { ...i, es_removible: !i.es_removible } : i
    )
    form.setFieldValue('ingredientes', newIngredientes)
  }

  const loading = mutation.isPending || form.state.isSubmitting

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 780 }}>
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
            <style>{`
              .qty-input::-webkit-outer-spin-button,
              .qty-input::-webkit-inner-spin-button {
                -webkit-appearance: none;
                margin: 0;
              }
              .qty-input[type="number"] {
                -moz-appearance: textfield;
              }
            `}</style>
            {apiError && <div className="alert alert-danger">{apiError}</div>}
            {stockWarning && (
              <div className="alert alert-warning" style={{ marginBottom: 12 }}>
                {stockWarning}
              </div>
            )}
            {!canEditComercial && (
              <div className="alert alert-warning" style={{ marginBottom: 12 }}>
                Como gestor de stock solo podés editar las <strong>categorías</strong> y los <strong>ingredientes</strong>.
                Los datos comerciales (nombre, precio, etc.) son de solo lectura.
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
                    style={{ width: '100%' }}
                    required
                    autoFocus
                    disabled={!canEditComercial}
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
                    disabled={!canEditComercial}
                  />
                </div>
              )}
            />

            <form.Subscribe selector={(state) => state.values.categoria_ids}>
              {(categoria_ids) => {
                const indetIds = computeIndeterminateIds(categoria_ids)
                return (
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
                      renderCategoriaCheckboxes(categoriasTree, categoria_ids, indetIds)
                    ) : (
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>No hay categorías disponibles.</span>
                    )}
                  </div>
                </div>
              )}}
            </form.Subscribe>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <form.Field
                name="margen_ganancia"
                validators={{
                  onChange: ({ value }) => (value < 0 ? 'El margen no puede ser negativo' : undefined),
                }}
                children={(field) => (
                  <div className="form-group">
                    <label className="form-label">
                      Margen de ganancia
                      {!isEdit && (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8 }}>
                          Sugerido: {MARGEN_SUGERIDO}%
                        </span>
                      )}
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        className="form-input"
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="0"
                        value={field.state.value || ''}
                        onChange={(e) => field.handleChange(parseFloat(e.target.value) || 0)}
                        onBlur={field.handleBlur}
                        style={{ width: '100%' }}
                        disabled={!canEditComercial}
                      />
                      <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>%</span>
                    </div>
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
                      disabled={!canEditComercial}
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
            </div>

            <form.Subscribe
              selector={(state) => ({ ings: state.values.ingredientes, margen: state.values.margen_ganancia, unidadVentaId: state.values.unidad_venta_id })}
            >
              {({ ings: selectedIngs, margen, unidadVentaId }) => {
                const stockCalc = calcularStockEnTiempoReal(selectedIngs)
                const { costoTotal, precioSugerido } = calcularCostoYPrecioSugerido(selectedIngs, margen)
                const unidadLabel = (() => {
                  const unidad = unidades.find(u => u.id === unidadVentaId)
                  if (!unidad) return stockCalc === 1 ? 'unidad' : 'unidades'
                  const v = unidad.nombre
                  if (stockCalc === 1) return v
                  const ultima = v.slice(-1)
                  return 'aeiouáéíóú'.includes(ultima) ? v + 's' : v + 'es'
                })()
                const availableIngs = ingredientes.filter(ing => !ing.es_terminado && !hasIngrediente(ing.id, selectedIngs))
                const filteredAvail = ingSearch
                  ? availableIngs.filter(ing => ing.nombre.toLowerCase().includes(ingSearch.toLowerCase()))
                  : availableIngs

                return (
                  <div className="form-group">
                    <label className="form-label">Ingredientes de receta</label>

                    <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                      <div style={{
                        flex: 1, padding: '8px 12px', borderRadius: 4,
                        background: selectedIngs.length > 0
                          ? (stockCalc > 0 ? 'var(--bg-light)' : 'rgba(220, 53, 69, 0.1)')
                          : 'var(--bg-light)',
                        border: `1px solid ${
                          selectedIngs.length === 0 ? 'var(--border)'
                          : stockCalc > 0 ? 'var(--border)'
                          : 'var(--danger)'
                        }`,
                        fontSize: 13, fontWeight: 600,
                        color: selectedIngs.length === 0 ? 'var(--text-muted)'
                          : stockCalc > 0 ? 'var(--success)' : 'var(--danger)',
                      }}>
                        {selectedIngs.length > 0
                          ? `Stock: ${stockCalc} ${unidadLabel}`
                          : 'Sin ingredientes'}
                      </div>
                      <div style={{
                        flex: 1, padding: '8px 12px', borderRadius: 4,
                        background: 'var(--bg-light)', border: '1px solid var(--border)',
                        fontSize: 13, display: 'flex', flexDirection: 'column', gap: 2,
                      }}>
                        <span>Costo: <strong>${costoTotal.toFixed(2)}</strong></span>
                        <span style={{ color: 'var(--primary)' }}>
                          Precio final (ganancia del {margen}%): <strong>${precioSugerido.toFixed(2)}</strong>
                        </span>
                      </div>
                    </div>

                    <input
                      className="form-input"
                      type="text"
                      placeholder="Buscar ingrediente..."
                      value={ingSearch}
                      onChange={(e) => setIngSearch(e.target.value)}
                      style={{ width: '100%', marginBottom: 12 }}
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div style={{
                        border: '1px solid var(--border)', borderRadius: 6,
                        padding: 8, maxHeight: 220, overflowY: 'auto',
                        background: 'var(--bg-light)',
                      }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                          Disponibles
                        </div>
                        {filteredAvail.length === 0 ? (
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', padding: 8 }}>
                            {ingSearch ? 'Sin resultados' : 'Todos seleccionados'}
                          </div>
                        ) : (
                          filteredAvail.map(ing => {
                            const sinStock = ing.stock_cantidad === 0
                            return (
                              <div key={ing.id} style={{
                                display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px',
                                borderRadius: 4, opacity: sinStock ? 0.5 : 1,
                              }}>
                                <button
                                  type="button"
                                  disabled={sinStock}
                                  onClick={() => addIngrediente(ing.id)}
                                  style={{
                                    width: 22, height: 22, borderRadius: '50%', border: 'none',
                                    background: sinStock ? 'var(--border)' : 'var(--primary)',
                                    color: '#fff', fontSize: 14, lineHeight: '22px', textAlign: 'center',
                                    cursor: sinStock ? 'not-allowed' : 'pointer', padding: 0, flexShrink: 0,
                                  }}
                                >
                                  +
                                </button>
                                <span style={{ fontSize: 13, flex: 1 }}>
                                  {ing.nombre}
                                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>
                                    ({ing.stock_cantidad})
                                  </span>
                                </span>
                                {sinStock && (
                                  <span style={{ fontSize: 10, color: 'var(--danger)' }}>sin stock</span>
                                )}
                              </div>
                            )
                          })
                        )}
                      </div>

                      <div style={{
                        border: '1px solid var(--border)', borderRadius: 6,
                        padding: 8, maxHeight: 220, overflowY: 'auto',
                        background: 'var(--bg-light)',
                      }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                          En receta
                        </div>
                        {selectedIngs.length === 0 ? (
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', padding: 8 }}>
                            Agregá ingredientes desde la lista de disponibles
                          </div>
                        ) : (
                          selectedIngs.map((ing: any) => {
                            const ingInfo = ingredientes.find(i => i.id === ing.ingrediente_id)
                            const simbolo = getUnidadSimbolo(ingInfo?.unidad_medida_id)
                            const esContable = isUnidadContable(ingInfo?.unidad_medida_id)
                            const tieneStock = (ingInfo?.stock_cantidad ?? 0) >= ing.cantidad
                            return (
                              <div key={ing.ingrediente_id} style={{
                                display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px',
                                borderRadius: 4, marginBottom: 4,
                                background: tieneStock ? 'transparent' : 'rgba(220, 53, 69, 0.08)',
                                flexWrap: 'wrap',
                              }}>
                                <span style={{ flex: 1, minWidth: 80, fontSize: 13, fontWeight: 500 }}>
                                  {ingInfo?.nombre ?? `ID ${ing.ingrediente_id}`}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  {ingInfo?.es_terminado ? (
                                    <input
                                      type="number"
                                      className="qty-input"
                                      style={{ width: 50, padding: '2px 4px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--bg-light)', fontSize: 13, textAlign: 'center' }}
                                      value={1}
                                      disabled
                                    />
                                  ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
                                      <button
                                        type="button"
                                        onClick={() => updateCantidad(ing.ingrediente_id, Math.max(esContable ? 1 : 0.01, (esContable ? parseInt : parseFloat)(String(ing.cantidad)) - (esContable ? 1 : 0.01)))}
                                        style={{
                                          width: 26, height: 28, border: 'none', borderRight: '1px solid var(--border)',
                                          background: 'var(--bg-light)', cursor: 'pointer', fontSize: 15, lineHeight: 1,
                                          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, color: 'var(--text-muted)',
                                        }}
                                        onMouseOver={(e) => (e.currentTarget.style.background = 'var(--border)')}
                                        onMouseOut={(e) => (e.currentTarget.style.background = 'var(--bg-light)')}
                                      >
                                        −
                                      </button>
                                      <input
                                        type="number"
                                        className="qty-input"
                                        min={esContable ? "1" : "0.01"}
                                        step={esContable ? "1" : "0.01"}
                                        style={{ width: 48, padding: '2px 0', border: 'none', fontSize: 13, textAlign: 'center', outline: 'none' }}
                                        value={ing.cantidad}
                                        onChange={(e) => updateCantidad(ing.ingrediente_id, (esContable ? parseInt : parseFloat)(e.target.value) || (esContable ? 1 : 0.01))}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => updateCantidad(ing.ingrediente_id, (esContable ? parseInt : parseFloat)(String(ing.cantidad)) + (esContable ? 1 : 0.01))}
                                        style={{
                                          width: 26, height: 28, border: 'none', borderLeft: '1px solid var(--border)',
                                          background: 'var(--bg-light)', cursor: 'pointer', fontSize: 15, lineHeight: 1,
                                          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, color: 'var(--text-muted)',
                                        }}
                                        onMouseOver={(e) => (e.currentTarget.style.background = 'var(--border)')}
                                        onMouseOut={(e) => (e.currentTarget.style.background = 'var(--bg-light)')}
                                      >
                                        +
                                      </button>
                                    </div>
                                  )}
                                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{simbolo}</span>
                                </div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 11 }}>
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
                                    background: 'none', border: 'none', color: 'var(--danger)',
                                    cursor: 'pointer', fontSize: 16, padding: '0 2px', lineHeight: 1,
                                  }}
                                >
                                  ×
                                </button>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>

                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                      ☐ Remov. = cliente puede quitarlo del producto
                    </div>
                  </div>
                )
              }}
            </form.Subscribe>

                    <form.Field
              name="imagen_url"
              children={(field) => {
                async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
                  const file = e.target.files?.[0]
                  if (!file) return
                  setImgError('')
                  setImgUploading(true)
                  try {
                    const res = await uploadImagen(file, 'productos')
                    field.handleChange(res.secure_url)
                    setImgPublicId(res.public_id)
                  } catch (err: any) {
                    const status = err?.response?.status
                    setImgError(
                      status === 503
                        ? 'Cloudinary no está configurado en el servidor.'
                        : (err?.response?.data?.detail || 'No se pudo subir la imagen.')
                    )
                  } finally {
                    setImgUploading(false)
                    e.target.value = ''
                  }
                }

                async function handleRemove() {
                  if (imgPublicId) {
                    try { await deleteImagen(imgPublicId) } catch { /* ignorar */ }
                  }
                  setImgPublicId(null)
                  field.handleChange('')
                }

                return (
                  <div className="form-group">
                    <label className="form-label">Imagen del producto</label>
                    {field.state.value ? (
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
                        <img
                          src={cldThumb(field.state.value, 120, 120)}
                          alt="preview"
                          style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }}
                        />
                        {canEditComercial && (
                          <button type="button" className="btn btn-ghost" onClick={handleRemove}>
                            Quitar imagen
                          </button>
                        )}
                      </div>
                    ) : null}
                    {canEditComercial && (
                      <input
                        className="form-input"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFile}
                        disabled={imgUploading}
                      />
                    )}
                    {imgUploading && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Subiendo imagen…</span>}
                    {imgError && <em style={{ color: 'var(--danger)', fontSize: 12 }}>{imgError}</em>}
                    {/* Fallback: permitir pegar una URL manual */}
                    <input
                      className="form-input"
                      type="url"
                      placeholder="o pegá una URL de imagen…"
                      value={field.state.value ?? ''}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      disabled={!canEditComercial}
                      style={{ marginTop: 8 }}
                    />
                  </div>
                )
              }}
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
                      disabled={!canEditComercial}
                    />
                    <span className="form-label" style={{ marginBottom: 0 }}>
                      Disponible para venta
                    </span>
                  </label>
                </div>
              )}
            />
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
