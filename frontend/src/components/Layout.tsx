import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useCartStore } from '../stores/cartStore'
import { useUiStore } from '../stores/uiStore'
import { logout } from '../api/auth'
import CarritoDrawer from './CarritoDrawer'

const STAFF_ROLES = ['ADMIN', 'STOCK', 'PEDIDOS']

export default function Layout() {
  const { nombre, roles, isAdmin } = useAuthStore()
  const itemCount = useCartStore((s) => s.itemCount())
  const { cartOpen, openCart } = useUiStore()
  const navigate = useNavigate()

  const isStaff = roles.some((r) => STAFF_ROLES.includes(r))
  const isClient = roles.includes('CLIENT') && !isStaff

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const initial = (nombre ?? 'U')[0].toUpperCase()

  return (
    <div className="app-shell">

      <nav className="navbar">

        <div className="navbar-brand">
          <div className="navbar-logo-mark">FF</div>
          <span className="navbar-brand-name">{isClient ? 'Fast Food' : 'Fast Food Admin'}</span>
        </div>

        <div className="navbar-nav">
          {/* Catálogo: visible para CLIENT y ADMIN */}
          {(isClient || isAdmin()) && (
            <NavLink
              to="/catalogo"
              className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
            >
              Catálogo
            </NavLink>
          )}

          {/* Mis Pedidos: solo CLIENT */}
          {isClient && (
            <NavLink
              to="/mis-pedidos"
              className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
            >
              Mis Pedidos
            </NavLink>
          )}

          {/* Secciones staff */}
          {(isAdmin() || roles.includes('STOCK')) && (
            <>
              <NavLink
                to="/ingredientes"
                className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
              >
                Insumos
              </NavLink>
              <NavLink
                to="/productos"
                className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
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
              >
                Categorías
              </NavLink>
              <NavLink
                to="/usuarios"
                className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
              >
                Usuarios
              </NavLink>
            </>
          )}

          {(roles.includes('ADMIN') || roles.includes('PEDIDOS')) && (
            <NavLink
              to="/admin/pedidos"
              className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
            >
              Pedidos
            </NavLink>
          )}
        </div>

        <div className="navbar-end">
          {isClient && (
            <button
              onClick={openCart}
              title="Carrito"
              style={{
                position: 'relative',
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '6px 12px',
                cursor: 'pointer',
                color: 'var(--text)',
                fontSize: 18,
                lineHeight: 1,
              }}
            >
              🛒
              {itemCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: -6, right: -6,
                  background: 'var(--primary)',
                  color: '#fff',
                  borderRadius: '50%',
                  width: 18, height: 18,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700,
                }}>
                  {itemCount}
                </span>
              )}
            </button>
          )}

          <div className="navbar-user">
            <div className="avatar">{initial}</div>
            <div>
              <div className="navbar-username">{nombre}</div>
              <div className="navbar-role">{roles.join(', ')}</div>
            </div>
          </div>

          <button className="btn-logout" onClick={handleLogout}>
            Salir
          </button>
        </div>
      </nav>

      <div className="main-content">
        <Outlet />
      </div>

      {cartOpen && <CarritoDrawer />}

    </div>
  )
}
