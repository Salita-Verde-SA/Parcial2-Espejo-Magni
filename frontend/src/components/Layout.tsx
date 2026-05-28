import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useCartStore } from '../stores/cartStore'
import { useUiStore } from '../stores/uiStore'
import { logout } from '../api/auth'
import CarritoDrawer from './CarritoDrawer'

const STAFF_ROLES = ['ADMIN', 'STOCK', 'PEDIDOS']

/** Componente de shell principal de la aplicación; renderiza la barra de navegación superior con links condicionales según el rol del usuario, el icono del carrito para clientes, el avatar del usuario, el botón de cierre de sesión y el outlet para las páginas hijas. */
export default function Layout() {
  const { nombre, roles, isAdmin } = useAuthStore()
  const itemCount = useCartStore((s) => s.itemCount())
  const { cartOpen, openCart } = useUiStore()
  const navigate = useNavigate()

  const isStaff = roles.some((r) => STAFF_ROLES.includes(r))
  const isClient = roles.includes('CLIENT') && !isStaff

  /** Llama a la función de logout de la API y redirige al usuario a la página de login. */
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
                background: 'rgba(255,255,255,.08)',
                border: '1px solid rgba(255,255,255,.14)',
                borderRadius: 8,
                padding: '6px 14px',
                cursor: 'pointer',
                color: 'rgba(255,255,255,.85)',
                fontSize: 13,
                fontWeight: 600,
                lineHeight: 1,
              }}
            >
              Carrito
              {itemCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: -6, right: -6,
                  background: 'var(--brand)',
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
