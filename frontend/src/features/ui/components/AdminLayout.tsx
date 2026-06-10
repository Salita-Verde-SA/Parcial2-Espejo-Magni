import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../../stores/authStore'
import { logout } from '../../../api/auth'

export default function AdminLayout() {
  const { nombre, roles, isAdmin } = useAuthStore()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const initial = (nombre ?? 'U')[0].toUpperCase()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'Inter, sans-serif' }}>

      {/* Sidebar */}
      <aside style={{
        width: '260px',
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0
      }}>
        <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '34px', height: '34px', background: 'var(--brand)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '12px', letterSpacing: '-0.5px' }}>
              FF
            </div>
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#fff', letterSpacing: '0.1px' }}>Admin</span>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>

          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
            style={{ padding: '10px 16px', borderRadius: '8px' }}
          >
            Dashboard
          </NavLink>

          {(isAdmin() || roles.includes('STOCK')) && (
            <>
              <NavLink
                to="/ingredientes"
                className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
                style={{ padding: '10px 16px', borderRadius: '8px' }}
              >
                Insumos
              </NavLink>
              <NavLink
                to="/productos"
                className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
                style={{ padding: '10px 16px', borderRadius: '8px' }}
              >
                Productos
              </NavLink>
            </>
          )}

          {isAdmin() && (
            <>
              <NavLink
                to="/categorias"
                className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
                style={{ padding: '10px 16px', borderRadius: '8px' }}
              >
                Categorías
              </NavLink>
              <NavLink
                to="/usuarios"
                className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
                style={{ padding: '10px 16px', borderRadius: '8px' }}
              >
                Usuarios
              </NavLink>
            </>
          )}

          {(isAdmin() || roles.includes('PEDIDOS')) && (
            <NavLink
              to="/admin/pedidos"
              className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
              style={{ padding: '10px 16px', borderRadius: '8px' }}
            >
              Pedidos Admin
            </NavLink>
          )}

        </nav>

        <div style={{ padding: '20px', borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div className="avatar">{initial}</div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.9)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{nombre}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{roles.join(', ')}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button onClick={() => navigate('/catalogo')} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
              Volver a Tienda
            </button>
            <button onClick={handleLogout} className="btn btn-danger" style={{ width: '100%', justifyContent: 'center' }}>
              Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <Outlet />
        </div>
      </main>

    </div>
  )
}
