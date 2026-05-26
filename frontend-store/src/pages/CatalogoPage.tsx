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

function formatPrecio(precio: string) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(Number(precio))
}

interface ProductoCardProps {
  producto: Producto
}

function ProductoCard({ producto }: ProductoCardProps) {
  const addItem = useCartStore((s) => s.addItem)
  const openCart = useUiStore((s) => s.openCart)
  const alergenos = producto.ingredientes.filter((i) => i.es_alergeno)

  function handleAgregar() {
    addItem(producto, 1)
    openCart()
  }

  return (
    <div style={{
      background: '#fff',
      borderRadius: 14,
      overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}>
      <div style={{
        height: 140,
        background: 'linear-gradient(135deg, #fc8181, #E53E3E)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {producto.imagen_url ? (
          <img src={producto.imagen_url} alt={producto.nombre}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: 40, fontWeight: 900, color: 'rgba(255,255,255,0.7)' }}>
            {producto.nombre[0].toUpperCase()}
          </span>
        )}
      </div>

      <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <strong style={{ fontSize: 15, color: '#111827' }}>{producto.nombre}</strong>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#E53E3E', whiteSpace: 'nowrap', marginLeft: 8 }}>
            {formatPrecio(producto.precio_base)}
          </span>
        </div>

        {producto.descripcion && (
          <p style={{ fontSize: 12, color: '#6b7280', margin: 0, lineHeight: 1.4 }}>
            {producto.descripcion}
          </p>
        )}

        {alergenos.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {alergenos.map((a) => (
              <span key={a.id} style={{
                background: '#fef2f2', color: '#b91c1c',
                border: '1px solid #fecaca',
                borderRadius: 4, fontSize: 10, padding: '1px 6px',
              }}>
                ⚠ {a.nombre}
              </span>
            ))}
          </div>
        )}

        <div style={{ marginTop: 'auto', paddingTop: 8 }}>
          {!producto.disponible || producto.stock_cantidad === 0 ? (
            <button disabled style={{
              width: '100%', padding: '8px 0', borderRadius: 8,
              border: '1px solid #e5e7eb', background: '#f9fafb',
              color: '#9ca3af', fontSize: 14, cursor: 'not-allowed',
            }}>
              {!producto.disponible ? 'No disponible' : 'Sin stock'}
            </button>
          ) : (
            <button onClick={handleAgregar} style={{
              width: '100%', padding: '8px 0', borderRadius: 8,
              border: 'none', background: '#E53E3E',
              color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}>
              Agregar al carrito
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
    <div>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20, color: '#111827' }}>
        Nuestro Menú
      </h2>

      <div style={{
        display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'flex-end',
        background: '#fff', padding: 16, borderRadius: 12,
        boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
      }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#374151' }}>
            Buscar
          </label>
          <input
            type="text"
            placeholder="Nombre del producto..."
            value={draft.nombre}
            onChange={(e) => setDraft({ ...draft, nombre: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && setFiltros({ ...draft, page: 1 })}
            style={{
              padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db',
              fontSize: 14, outline: 'none', width: 200,
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#374151' }}>
            Categoría
          </label>
          <select
            value={draft.categoria_id ?? ''}
            onChange={(e) =>
              setDraft({ ...draft, categoria_id: e.target.value ? Number(e.target.value) : null })
            }
            style={{
              padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db',
              fontSize: 14, outline: 'none', background: '#fff',
            }}
          >
            <option value="">Todas las categorías</option>
            {categorias?.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setFiltros({ ...draft, page: 1 })}
          style={{
            background: '#E53E3E', color: '#fff', border: 'none',
            borderRadius: 8, padding: '8px 20px', fontWeight: 700, cursor: 'pointer',
          }}
        >
          Buscar
        </button>
        <button
          onClick={() => { setDraft(DEFAULT_FILTROS); setFiltros(DEFAULT_FILTROS) }}
          style={{
            background: '#f9fafb', color: '#374151',
            border: '1px solid #d1d5db', borderRadius: 8,
            padding: '8px 16px', cursor: 'pointer',
          }}
        >
          Limpiar
        </button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 64, color: '#6b7280' }}>
          Cargando productos...
        </div>
      ) : data?.items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 64, color: '#6b7280' }}>
          No hay productos con los filtros aplicados.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 20,
        }}>
          {data?.items.map((p) => <ProductoCard key={p.id} producto={p} />)}
        </div>
      )}

      {data && data.total > data.page_size && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 32 }}>
          <button
            disabled={filtros.page === 1}
            onClick={() => setFiltros({ ...filtros, page: filtros.page - 1 })}
            style={{
              padding: '6px 14px', borderRadius: 8,
              border: '1px solid #d1d5db', background: '#fff',
              cursor: filtros.page === 1 ? 'not-allowed' : 'pointer',
            }}
          >‹</button>
          <span style={{ fontSize: 13, color: '#6b7280' }}>
            Página {filtros.page} de {data.pages}
          </span>
          <button
            disabled={filtros.page === data.pages}
            onClick={() => setFiltros({ ...filtros, page: filtros.page + 1 })}
            style={{
              padding: '6px 14px', borderRadius: 8,
              border: '1px solid #d1d5db', background: '#fff',
              cursor: filtros.page === data.pages ? 'not-allowed' : 'pointer',
            }}
          >›</button>
        </div>
      )}
    </div>
  )
}
