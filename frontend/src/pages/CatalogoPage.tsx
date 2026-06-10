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
  const [showToast, setShowToast] = useState(false)

  const alergenos = producto.ingredientes.filter((i) => i.es_alergeno)

  function handleAgregar() {
    addItem(producto, 1, [])
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2500)
  }

  return (
    <div className="group relative bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-lg hover:shadow-[0_8px_30px_rgba(220,38,38,0.2)] hover:-translate-y-1 transition-all duration-300 flex flex-col animate-fade-in-up">
      
      {/* Toast de agregado al carrito */}
      {showToast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-green-600/95 text-white px-4 py-2 rounded-full text-xs font-bold shadow-2xl z-50 animate-bounce backdrop-blur-md border border-green-400/30 whitespace-nowrap flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          ¡Agregado!
        </div>
      )}

      <div className="h-48 overflow-hidden relative bg-gradient-to-br from-neutral-900 to-black flex items-center justify-center">
        {producto.imagen_url ? (
          <img
            src={producto.imagen_url}
            alt={producto.nombre}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-red-900/20 to-black/80">
            <svg className="w-12 h-12 text-white/20 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xl font-black text-white/30 tracking-tighter">
              {producto.nombre[0].toUpperCase()}
            </span>
          </div>
        )}
        {/* Overlay gradient para que el título resalte si montamos algo encima */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <div className="p-5 flex flex-col flex-1 gap-3 relative z-10 bg-gradient-to-b from-transparent to-black/40">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-bold text-lg leading-tight text-white group-hover:text-red-400 transition-colors">
            {producto.nombre}
          </h3>
        </div>

        {producto.descripcion && (
          <p className="text-sm text-neutral-400 line-clamp-2 leading-relaxed">
            {producto.descripcion}
          </p>
        )}

        {alergenos.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {alergenos.map((a) => (
              <span key={a.id} className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wider">
                {a.nombre}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto pt-4">
          {producto.stock_cantidad === 0 && producto.disponible ? (
            <button className="w-full bg-white/5 text-neutral-500 font-bold rounded-xl px-4 py-3 uppercase tracking-widest text-xs cursor-not-allowed" disabled>
              Sin stock
            </button>
          ) : !producto.disponible ? (
            <button className="w-full bg-white/5 text-neutral-500 font-bold rounded-xl px-4 py-3 uppercase tracking-widest text-xs cursor-not-allowed" disabled>
              No disponible
            </button>
          ) : (
            <button
              onClick={handleAgregar}
              className="w-full appearance-none border-none bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl px-4 py-3 shadow-[0_4px_15px_rgba(220,38,38,0.3)] hover:shadow-[0_8px_25px_rgba(220,38,38,0.5)] transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wider text-sm"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              {formatPrecio(producto.precio_base, producto.unidad_venta?.simbolo)}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden flex flex-col animate-pulse h-[380px]">
      <div className="h-48 bg-white/5"></div>
      <div className="p-5 flex flex-col flex-1 gap-4">
        <div className="flex justify-between">
          <div className="h-5 bg-white/10 rounded w-1/2"></div>
          <div className="h-5 bg-white/10 rounded w-1/4"></div>
        </div>
        <div className="h-3 bg-white/5 rounded w-full"></div>
        <div className="h-3 bg-white/5 rounded w-4/5"></div>
        <div className="mt-auto h-11 bg-white/10 rounded-xl w-full"></div>
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

  const handleCategorySelect = (id: number | null) => {
    const newFiltros = { ...filtros, categoria_id: id, page: 1 }
    setDraft(newFiltros)
    setFiltros(newFiltros)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFiltros({ ...draft, page: 1 })
  }

  return (
    <>
      <div className="pt-10 pb-6 text-center">
        <h1 className="text-4xl sm:text-5xl font-black text-white drop-shadow-lg tracking-tight mb-3">
          Nuestro Menú
        </h1>
        <p className="text-neutral-300 text-lg font-medium drop-shadow-md">
          Descubre los mejores sabores de la ciudad.
        </p>
      </div>

      <div className="page-wrapper pt-0" style={{ maxWidth: 1400, margin: '0 auto' }}>

        {/* Filtros Modernos */}
        <div className="mb-8 space-y-6">
          {/* Búsqueda */}
          <form onSubmit={handleSearchSubmit} className="relative max-w-xl">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar hamburguesas, bebidas, etc..."
              value={draft.nombre}
              onChange={(e) => setDraft({ ...draft, nombre: e.target.value })}
              className="w-full bg-black/40 backdrop-blur-xl border border-white/10 text-white placeholder-neutral-500 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all shadow-lg"
            />
            {draft.nombre && (
              <button
                type="button"
                onClick={() => { setDraft({ ...draft, nombre: '' }); setFiltros({ ...filtros, nombre: '', page: 1 }) }}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-400 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </form>

          {/* Categorías (Pills horizontales) */}
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
            <button
              onClick={() => handleCategorySelect(null)}
              className={`appearance-none border-none whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${filtros.categoria_id === null
                  ? 'bg-red-600 text-white shadow-[0_4px_15px_rgba(220,38,38,0.4)]'
                  : 'bg-white/5 border border-white/10 text-neutral-300 hover:bg-white/10 hover:text-white'
                }`}
            >
              Todos
            </button>
            {categorias?.map((c) => (
              <button
                key={c.id}
                onClick={() => handleCategorySelect(c.id)}
                className={`appearance-none border-none whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${filtros.categoria_id === c.id
                    ? 'bg-red-600 text-white shadow-[0_4px_15px_rgba(220,38,38,0.4)]'
                    : 'bg-white/5 border border-white/10 text-neutral-300 hover:bg-white/10 hover:text-white'
                  }`}
              >
                {c.nombre}
              </button>
            ))}
          </div>
        </div>

        {/* Grilla de Productos */}
        {isLoading ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 24,
            }}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : data?.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No encontramos nada</h3>
            <p className="text-neutral-400 max-w-md">
              Intenta buscar con otros términos o selecciona una categoría diferente.
            </p>
            <button
              onClick={() => { setDraft(DEFAULT_FILTROS); setFiltros(DEFAULT_FILTROS) }}
              className="mt-6 text-red-400 font-bold hover:text-red-300 transition-colors"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 24,
            }}
          >
            {data?.items.map((p) => <ProductoCard key={p.id} producto={p} />)}
          </div>
        )}

        {/* Paginación */}
        {data && data.total > data.page_size && (
          <div className="flex justify-center items-center gap-4 mt-12 mb-8">
            <button
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:hover:bg-white/5"
              disabled={filtros.page === 1}
              onClick={() => {
                setFiltros({ ...filtros, page: filtros.page - 1 })
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-bold text-neutral-400">
              Página <span className="text-white">{filtros.page}</span> de {data.pages}
            </span>
            <button
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:hover:bg-white/5"
              disabled={filtros.page === data.pages}
              onClick={() => {
                setFiltros({ ...filtros, page: filtros.page + 1 })
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </>
  )
}
