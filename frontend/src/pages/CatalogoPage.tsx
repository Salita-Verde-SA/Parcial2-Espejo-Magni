// ─── pages/CatalogoPage.tsx ───────────────────────────────────────────────────
// Página principal de la app. Muestra los productos en grilla de cards.
// Incluye filtros de búsqueda y paginación.
// El cliente puede agregar productos al carrito desde aquí.

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchProductos } from '../api/productos'
import { fetchCategorias } from '../api/categorias'
import { useCartStore } from '../stores/cartStore'
import { useUiStore } from '../stores/uiStore'
import type { Producto, FiltrosProducto } from '../types'

// Estado inicial de los filtros: muestra solo productos disponibles, página 1
const DEFAULT_FILTROS: FiltrosProducto = {
  nombre: '',
  categoria_id: null,
  disponible: 'true',
  page: 1,
  page_size: 12,
}

// ─── formatPrecio ─────────────────────────────────────────────────────────────
// Convierte un string de precio a formato moneda argentina.
// Si tiene unidad, muestra: "$ 1.500 / kg"
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

// ─── ProductoCard ─────────────────────────────────────────────────────────────
// Componente interno que renderiza la tarjeta visual de un producto.
// Se usa dentro del map() de la grilla.
// Recibe un producto y se encarga de mostrar su info + botón de acción.
function ProductoCard({ producto }: { producto: Producto }) {
  const addItem = useCartStore((s) => s.addItem)
  const openCart = useUiStore((s) => s.openCart)

  // Filtra solo los ingredientes marcados como alérgenos para el badge de alerta
  const alergenos = producto.ingredientes.filter((i) => i.es_alergeno)

  // handleAgregar: agrega el producto al carrito y abre el drawer automáticamente
  function handleAgregar() {
    addItem(producto, 1, [])   // cantidad inicial: 1, sin personalizaciones
    openCart()
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

      {/* Imagen del producto o placeholder con inicial si no hay imagen */}
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
          // Muestra la primera letra del nombre como placeholder visual
          <span style={{ fontSize: 36, fontWeight: 900, color: 'rgba(255,255,255,0.65)', letterSpacing: -1 }}>
            {producto.nombre[0].toUpperCase()}
          </span>
        )}
      </div>

      {/* Contenido de la tarjeta */}
      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>

        {/* Nombre y precio en la misma línea */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <strong style={{ fontSize: 15 }}>{producto.nombre}</strong>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary)', whiteSpace: 'nowrap', marginLeft: 8 }}>
            {formatPrecio(producto.precio_base, producto.unidad_venta?.simbolo)}
          </span>
        </div>

        {/* Descripción opcional */}
        {producto.descripcion && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
            {producto.descripcion}
          </p>
        )}

        {/* Badges de alérgenos: solo aparece si el producto tiene ingredientes alérgenos */}
        {alergenos.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {alergenos.map((a) => (
              <span key={a.id} className="badge badge-danger" style={{ fontSize: 10 }}>
                {a.nombre}
              </span>
            ))}
          </div>
        )}

        {/* Botón de acción: cambia según el estado del producto */}
        <div style={{ marginTop: 'auto', paddingTop: 8 }}>
          {/* Caso 1: hay 0 unidades pero está marcado como disponible → "Sin stock" */}
          {producto.stock_cantidad === 0 && producto.disponible ? (
            <button className="btn btn-ghost" style={{ width: '100%' }} disabled>
              Sin stock
            </button>
          ) : !producto.disponible ? (
            /* Caso 2: el admin lo marcó como no disponible → no se puede pedir */
            <button className="btn btn-ghost" style={{ width: '100%' }} disabled>
              No disponible
            </button>
          ) : (
            /* Caso 3: disponible y con stock → se puede agregar al carrito */
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleAgregar}>
              Agregar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── CatalogoPage ─────────────────────────────────────────────────────────────
export default function CatalogoPage() {
  // filtros: estado "confirmado" que se usa para buscar (se actualiza al presionar Buscar)
  const [filtros, setFiltros] = useState<FiltrosProducto>(DEFAULT_FILTROS)

  // draft: estado "borrador" que va cambiando mientras el usuario escribe
  // Se separa de filtros para que la búsqueda solo ocurra al hacer clic en Buscar
  const [draft, setDraft] = useState<FiltrosProducto>(DEFAULT_FILTROS)

  // ─── useQuery de productos ─────────────────────────────────────────────────
  // useQuery: hook de TanStack Query para peticiones GET.
  // queryKey: identifica y cachea la consulta. Si los filtros cambian,
  //   hace una nueva petición. Si los filtros vuelven al mismo valor,
  //   usa el caché (sin ir al servidor si está dentro de staleTime).
  // staleTime: 60 segundos → no re-pide si los datos tienen menos de 1 minuto
  const { data, isLoading } = useQuery({
    queryKey: ['productos', filtros],
    queryFn: () => fetchProductos(filtros),
    staleTime: 60_000,
  })

  // ─── useQuery de categorías ────────────────────────────────────────────────
  // Se pide aparte con su propio caché (5 minutos) porque cambian muy poco
  const { data: categorias } = useQuery({
    queryKey: ['categorias'],
    queryFn: fetchCategorias,
    staleTime: 5 * 60_000,
  })

  return (
    <>
      {/* Barra de título de la página (debajo de la navbar) */}
      <header className="topbar">
        <span className="topbar-title">Catálogo de Productos</span>
      </header>

      <div className="page-wrapper">

        {/* ── Barra de filtros ────────────────────────────────────────────── */}
        <div className="filtros-bar">
          <div className="filtro-group">
            <label className="filtro-label">Buscar</label>
            <input
              className="filtro-input"
              type="text"
              placeholder="Nombre del producto..."
              value={draft.nombre}
              // Actualiza solo el draft al escribir (no lanza búsqueda todavía)
              onChange={(e) => setDraft({ ...draft, nombre: e.target.value })}
              // Enter también lanza la búsqueda (UX conveniente)
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
            {/* Al buscar, copia el draft a filtros y vuelve a la página 1 */}
            <button className="btn btn-primary" onClick={() => setFiltros({ ...draft, page: 1 })}>
              Buscar
            </button>
            {/* Limpiar: resetea tanto el draft como los filtros al estado inicial */}
            <button className="btn btn-ghost" onClick={() => { setDraft(DEFAULT_FILTROS); setFiltros(DEFAULT_FILTROS) }}>
              Limpiar
            </button>
          </div>
        </div>

        {/* ── Contenido principal: spinner / vacío / grilla ──────────────── */}
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
          // Grilla responsiva: mínimo 240px por columna, se ajusta sola
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

        {/* ── Paginación simple (solo cuando hay más de una página) ──────── */}
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
