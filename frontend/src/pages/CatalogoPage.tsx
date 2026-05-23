import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchProductos } from '../api/productos'
import { fetchCategorias } from '../api/categorias'
import { useCartStore } from '../stores/cartStore'
import { useUiStore } from '../stores/uiStore'
import type { Producto, FiltrosProducto } from '../types'

const DEFAULT_FILTROS: FiltrosProducto = {
  nombre: '',
  categoria_id: null,
  disponible: 'true',
  page: 1,
  page_size: 12,
}

function formatPrecio(precio: string, unidadSimbolo?: string) {
  const formatted = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(Number(precio))
  if (unidadSimbolo) {
    return `${formatted} / ${unidadSimbolo}`
  }
  return formatted
}

function ProductoCard({ producto }: { producto: Producto }) {
  const addItem = useCartStore((s) => s.addItem)
  const openCart = useUiStore((s) => s.openCart)

  const alergenos = producto.ingredientes.filter((i) => i.es_alergeno)

  function handleAgregar() {
    addItem(producto, 1, [])
    openCart()
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

      <div
        style={{
          height: 160,
          background: 'linear-gradient(135deg, var(--primary-light), var(--primary))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {producto.imagen_url ? (
          <img
            src={producto.imagen_url}
            alt={producto.nombre}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span style={{ fontSize: 36, fontWeight: 900, color: 'rgba(255,255,255,0.65)', letterSpacing: -1 }}>
            {producto.nombre[0].toUpperCase()}
          </span>
        )}
      </div>

      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <strong style={{ fontSize: 15 }}>{producto.nombre}</strong>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary)', whiteSpace: 'nowrap', marginLeft: 8 }}>
            {formatPrecio(producto.precio_base, producto.unidad_venta?.simbolo)}
          </span>
        </div>

        {producto.descripcion && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
            {producto.descripcion}
          </p>
        )}

        {alergenos.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {alergenos.map((a) => (
              <span key={a.id} className="badge badge-danger" style={{ fontSize: 10 }}>
                {a.nombre}
              </span>
            ))}
          </div>
        )}

        <div style={{ marginTop: 'auto', paddingTop: 8 }}>
          {producto.stock_cantidad === 0 && producto.disponible ? (
            <button className="btn btn-ghost" style={{ width: '100%' }} disabled>
              Sin stock
            </button>
          ) : !producto.disponible ? (
            <button className="btn btn-ghost" style={{ width: '100%' }} disabled>
              No disponible
            </button>
          ) : (
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleAgregar}>
              Agregar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CatalogoPage() {
  const [filtros, setFiltros] = useState<FiltrosProducto>(DEFAULT_FILTROS)
  const [draft, setDraft] = useState<FiltrosProducto>(DEFAULT_FILTROS)

  const { data, isLoading } = useQuery({
    queryKey: ['productos', filtros],
    queryFn: () => fetchProductos(filtros),
    staleTime: 60_000,
  })

  const { data: categorias } = useQuery({
    queryKey: ['categorias'],
    queryFn: fetchCategorias,
    staleTime: 5 * 60_000,
  })

  return (
    <>
      <header className="topbar">
        <span className="topbar-title">Catálogo de Productos</span>
      </header>

      <div className="page-wrapper">

        <div className="filtros-bar">
          <div className="filtro-group">
            <label className="filtro-label">Buscar</label>
            <input
              className="filtro-input"
              type="text"
              placeholder="Nombre del producto..."
              value={draft.nombre}
              onChange={(e) => setDraft({ ...draft, nombre: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && setFiltros({ ...draft, page: 1 })}
            />
          </div>

          <div className="filtro-group">
            <label className="filtro-label">Categoría</label>
            <select
              className="filtro-select"
              value={draft.categoria_id ?? ''}
              onChange={(e) =>
                setDraft({ ...draft, categoria_id: e.target.value ? Number(e.target.value) : null })
              }
            >
              <option value="">Todas</option>
              {categorias?.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <button className="btn btn-primary" onClick={() => setFiltros({ ...draft, page: 1 })}>
              Buscar
            </button>
            <button className="btn btn-ghost" onClick={() => { setDraft(DEFAULT_FILTROS); setFiltros(DEFAULT_FILTROS) }}>
              Limpiar
            </button>
          </div>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <span className="spinner spinner-dark" /> Cargando...
          </div>
        ) : data?.items.length === 0 ? (
          <div className="empty-state">
            <h3>Sin resultados</h3>
            <p>No hay productos con los filtros aplicados.</p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 16,
            }}
          >
            {data?.items.map((p) => <ProductoCard key={p.id} producto={p} />)}
          </div>
        )}

        {data && data.total > data.page_size && (
          <div className="pagination" style={{ marginTop: 24 }}>
            <button
              className="page-btn"
              disabled={filtros.page === 1}
              onClick={() => setFiltros({ ...filtros, page: filtros.page - 1 })}
            >‹</button>
            <span style={{ padding: '0 12px', fontSize: 13, color: 'var(--text-muted)' }}>
              Página {filtros.page} de {data.pages}
            </span>
            <button
              className="page-btn"
              disabled={filtros.page === data.pages}
              onClick={() => setFiltros({ ...filtros, page: filtros.page + 1 })}
            >›</button>
          </div>
        )}
      </div>
    </>
  )
}
