import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useCartStore } from '../stores/cartStore'
import { useUiStore } from '../stores/uiStore'
import { logout } from '../api/auth'
import CarritoDrawer from './CarritoDrawer'

export default function Layout() {
  const { nombre, roles, isAdmin } = useAuthStore()

  const itemCount = useCartStore((s) => s.itemCount())

  const toggleCart = useUiStore((s) => s.toggleCart)

  const cartOpen = useUiStore((s) => s.cartOpen)

  const navigate = useNavigate()

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
          <span className="navbar-brand-name">Fast Food</span>
        </div>

        <div className="navbar-nav">
          <NavLink
            to="/catalogo"
            className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
          >
            Catálogo
          </NavLink>

          <NavLink
            to="/mis-pedidos"
            className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
          >
            Mis Pedidos
          </NavLink>

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
              Pedidos Admin
            </NavLink>
          )}
        </div>

        <div className="navbar-end">

          <button
            className="btn btn-primary btn-sm"
            onClick={toggleCart}
            style={{ position: 'relative' }}
          >
            Carrito
            {itemCount > 0 && (
              <span style={{
                position: 'absolute',
                top: -7, right: -7,
                background: 'var(--gold)',
                color: '#1C1917',
                borderRadius: '50%',
                width: 18, height: 18,
                fontSize: 10,
                fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {itemCount}
              </span>
            )}
          </button>

          <div className="navbar-divider" />

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
