import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchCategoriasAll, deleteCategoria, activateCategoria } from '../api/categorias'
import { useAuthStore } from '../stores/authStore'
import CategoriaModal from '../components/CategoriaModal'
import ConfirmDialog from '../components/ConfirmDialog'
import type { Categoria } from '../types'

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="12" height="12" viewBox="0 0 12 12" fill="none"
      style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform .18s ease', display: 'block' }}
    >
      <path d="M4.5 2.5L8 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function FolderIcon({ open, inactive }: { open: boolean; inactive: boolean }) {
  const base = inactive ? '#9CA3AF' : '#F59E0B'
  const light = inactive ? '#C4C9D0' : '#FCD34D'
  return (
    <svg width="22" height="18" viewBox="0 0 22 18" fill="none" style={{ flexShrink: 0 }}>
      {/* Tab */}
      <path d="M1 5a1 1 0 011-1h5.382a1 1 0 01.894.553L9.118 6H20a1 1 0 011 1v9a1 1 0 01-1 1H2a1 1 0 01-1-1V5z" fill={base} />
      {/* Front face when open */}
      {open && <path d="M1 8h20v8a1 1 0 01-1 1H2a1 1 0 01-1-1V8z" fill={light} />}
      {/* Bottom shadow line */}
      <path d="M1 15h20" stroke={inactive ? '#B0B8C0' : '#D97706'} strokeWidth="1" opacity="0.4" />
    </svg>
  )
}

function FileIcon({ inactive }: { inactive: boolean }) {
  const stroke = inactive ? '#D1D5DB' : '#94A3B8'
  const lines = inactive ? '#E5E7EB' : '#CBD5E1'
  return (
    <svg width="16" height="19" viewBox="0 0 16 19" fill="none" style={{ flexShrink: 0 }}>
      {/* Sheet */}
      <path d="M2 1h8.5L14 4.5V18H2V1z" fill="white" stroke={stroke} strokeWidth="1.4" strokeLinejoin="round" />
      {/* Folded corner */}
      <path d="M10 1l4 3.5h-4V1z" fill={inactive ? '#F3F4F6' : '#EFF6FF'} stroke={stroke} strokeWidth="1.4" strokeLinejoin="round" />
      {/* Content lines */}
      <line x1="4.5" y1="8" x2="11.5" y2="8" stroke={lines} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="4.5" y1="11" x2="11.5" y2="11" stroke={lines} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="4.5" y1="14" x2="9" y2="14" stroke={lines} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

// ─── Tree types & utils ────────────────────────────────────────────────────────

interface CategoriaNode extends Categoria {
  children: CategoriaNode[]
}

function buildTree(cats: Categoria[], parentId: number | null = null): CategoriaNode[] {
  return cats
    .filter(c => (c.parent_id ?? null) === parentId)
    .sort((a, b) => a.id - b.id)
    .map(c => ({ ...c, children: buildTree(cats, c.id) }))
}

function collectAllIds(nodes: CategoriaNode[]): number[] {
  return nodes.flatMap(n => [n.id, ...collectAllIds(n.children)])
}

// ─── CategoryNode component ────────────────────────────────────────────────────

interface NodeProps {
  node: CategoriaNode
  depth: number
  expanded: Set<number>
  onToggle: (id: number) => void
  isAdmin: boolean
  onNewChild: (parentId: number) => void
  onEdit: (cat: Categoria) => void
  onDelete: (cat: Categoria) => void
  onActivate: (id: number) => void
}

function CategoryNode({
  node, depth, expanded, onToggle,
  isAdmin, onNewChild, onEdit, onDelete, onActivate,
}: NodeProps) {
  const hasChildren = node.children.length > 0
  const isExpanded = expanded.has(node.id)
  const inactive = !!node.deleted_at
  const isRoot = depth === 0

  return (
    <>
      <div
        className={`cat-row ${isRoot ? 'root' : ''}`}
        style={{ paddingLeft: 16 + depth * 28 }}
      >
        {/* Chevron */}
        <button
          className="cat-toggle"
          onClick={() => hasChildren && onToggle(node.id)}
          style={{ cursor: hasChildren ? 'pointer' : 'default', opacity: hasChildren ? 1 : 0 }}
          tabIndex={hasChildren ? 0 : -1}
        >
          <ChevronIcon open={isExpanded} />
        </button>

        {/* Icono */}
        {hasChildren
          ? <FolderIcon open={isExpanded} inactive={inactive} />
          : <FileIcon inactive={inactive} />
        }

        {/* Nombre + descripción */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className={`cat-name ${isRoot ? 'root-level' : ''} ${inactive ? 'inactive' : ''}`}>
            {node.nombre}
            {hasChildren && (
              <span style={{
                marginLeft: 8,
                fontSize: 10, fontWeight: 600,
                background: inactive ? 'var(--border)' : '#FEF3C7',
                color: inactive ? 'var(--text-subtle)' : '#92400E',
                padding: '1px 6px', borderRadius: 10,
                verticalAlign: 'middle',
              }}>
                {node.children.length}
              </span>
            )}
          </div>
          {node.descripcion && (
            <div className="cat-desc">{node.descripcion}</div>
          )}
        </div>

        {/* Badges estado */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          {node.in_use && <span className="badge badge-warning">En uso</span>}
          {inactive && <span className="badge badge-neutral">Inactivo</span>}
        </div>

        {/* Separador */}
        {isAdmin && (
          <div style={{ width: 1, height: 18, background: 'var(--border)', flexShrink: 0, margin: '0 4px' }} />
        )}

        {/* Acciones */}
        {isAdmin && (
          <div className="cat-actions" style={{ marginLeft: 0, gap: 4 }}>
            {!inactive && (
              <button className="btn btn-ghost btn-sm" onClick={() => onNewChild(node.id)}>
                + Subcategoría
              </button>
            )}
            {inactive ? (
              <button className="btn btn-success btn-sm" onClick={() => onActivate(node.id)}>
                Activar
              </button>
            ) : node.in_use ? (
              <span style={{ fontSize: 11, color: 'var(--text-subtle)', fontStyle: 'italic' }}>
                Bloqueado
              </span>
            ) : (
              <>
                <button className="btn btn-ghost btn-sm" onClick={() => onEdit(node)}>Editar</button>
                <button className="btn btn-danger btn-sm" onClick={() => onDelete(node)}>Baja</button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Hijos con línea conectora */}
      {hasChildren && isExpanded && (
        <div
          className="cat-children"
          style={{ marginLeft: 16 + depth * 28 + 11, paddingLeft: 20 }}
        >
          {node.children.map((child) => (
            <CategoryNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              onToggle={onToggle}
              isAdmin={isAdmin}
              onNewChild={onNewChild}
              onEdit={onEdit}
              onDelete={onDelete}
              onActivate={onActivate}
            />
          ))}
        </div>
      )}
    </>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function CategoriasPage() {
  const isAdmin = useAuthStore((s) => s.isAdmin())
  const qc = useQueryClient()

  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Categoria | null>(null)
  const [defaultParentId, setDefaultParentId] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Categoria | null>(null)

  const { data: allCategorias = [], isLoading, isError } = useQuery({
    queryKey: ['categorias-all'],
    queryFn: fetchCategoriasAll,
  })

  const tree = buildTree(allCategorias)
  const allIds = collectAllIds(tree)

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCategoria(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categorias-all'] })
      qc.invalidateQueries({ queryKey: ['categorias-tree'] })
      setDeleteTarget(null)
    },
  })

  const activateMutation = useMutation({
    mutationFn: (id: number) => activateCategoria(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categorias-all'] })
      qc.invalidateQueries({ queryKey: ['categorias-tree'] })
    },
  })

  function toggleNode(id: number) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleNewRoot() { setEditTarget(null); setDefaultParentId(null); setModalOpen(true) }
  function handleNewChild(parentId: number) { setEditTarget(null); setDefaultParentId(parentId); setModalOpen(true) }
  function handleEdit(cat: Categoria) { setEditTarget(cat); setDefaultParentId(null); setModalOpen(true) }
  function handleModalClose() { setModalOpen(false); setEditTarget(null); setDefaultParentId(null) }

  const rootCount = tree.length
  const totalCount = allCategorias.length
  const inUseCount = allCategorias.filter(c => c.in_use).length

  return (
    <>
      <header className="topbar">
        <span className="topbar-title">Gestión de Categorías</span>
      </header>

      <div className="page-wrapper">

        {/* Stats */}
        {!isLoading && totalCount > 0 && (
          <div className="stat-row">
            <div className="stat-card accent">
              <span className="stat-card-value">{totalCount}</span>
              <span className="stat-card-label">Total</span>
            </div>
            <div className="stat-card">
              <span className="stat-card-value">{rootCount}</span>
              <span className="stat-card-label">Raíz</span>
            </div>
            <div className="stat-card">
              <span className="stat-card-value">{totalCount - rootCount}</span>
              <span className="stat-card-label">Subcategorías</span>
            </div>
            <div className="stat-card">
              <span className="stat-card-value">{inUseCount}</span>
              <span className="stat-card-label">En uso</span>
            </div>
          </div>
        )}

        <div className="card">
          {/* Header */}
          <div className="card-header">
            <span className="card-title">Estructura de categorías</span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setExpanded(new Set(allIds))} disabled={isLoading}>
                Expandir todo
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setExpanded(new Set())} disabled={isLoading}>
                Colapsar todo
              </button>
              {isAdmin && (
                <>
                  <div style={{ width: 1, height: 18, background: 'var(--border)' }} />
                  <button className="btn btn-primary btn-sm" onClick={handleNewRoot}>
                    + Nueva raíz
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Columnas */}
          {!isLoading && totalCount > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '7px 20px', borderBottom: '2px solid var(--border)',
              background: 'var(--surface-alt)',
            }}>
              <div style={{ width: 22 + 22 + 10, flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.7px' }}>
                Nombre
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.7px' }}>
                Estado
              </div>
              {isAdmin && (
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.7px', width: 210, textAlign: 'right' }}>
                  Acciones
                </div>
              )}
            </div>
          )}

          {/* Contenido */}
          {isLoading && (
            <div style={{ textAlign: 'center', padding: 56 }}>
              <span className="spinner spinner-dark" />
              <p style={{ marginTop: 12, color: 'var(--text-muted)', fontSize: 13 }}>Cargando...</p>
            </div>
          )}

          {isError && (
            <div className="alert alert-danger" style={{ margin: 20 }}>
              Error al cargar las categorías. Intentá de nuevo.
            </div>
          )}

          {!isLoading && !isError && tree.length === 0 && (
            <div className="empty-state">
              <h3>Sin categorías</h3>
              <p>Todavía no hay categorías creadas.</p>
            </div>
          )}

          {!isLoading && !isError && tree.length > 0 && (
            <div>
              {tree.map((node) => (
                <CategoryNode
                  key={node.id}
                  node={node}
                  depth={0}
                  expanded={expanded}
                  onToggle={toggleNode}
                  isAdmin={isAdmin}
                  onNewChild={handleNewChild}
                  onEdit={handleEdit}
                  onDelete={setDeleteTarget}
                  onActivate={(id) => activateMutation.mutate(id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <CategoriaModal
          categoria={editTarget}
          defaultParentId={defaultParentId}
          onClose={handleModalClose}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          message={
            <>
              Dar de baja <strong>"{deleteTarget.nombre}"</strong>.
              <br />
              <span style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
                El registro quedará oculto pero no se eliminará de la base de datos.
              </span>
            </>
          }
          confirmLabel="Dar de baja"
          loading={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  )
}
