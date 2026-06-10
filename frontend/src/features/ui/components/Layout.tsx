import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../../stores/authStore'
import { useCartStore } from '../../../stores/cartStore'
import { useUiStore } from '../../../stores/uiStore'
import { logout } from '../../../api/auth'
import CarritoDrawer from '../../store/components/CarritoDrawer'

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

  // La tienda (catálogo, carrito, mis pedidos) solo aplica a clientes y admin.
  const canShop = roles.includes('CLIENT') || isAdmin()

  const showAdminMenu = isAdmin() || roles.includes('STOCK') || roles.includes('PEDIDOS')

  function handleGoAdmin() {
    if (isAdmin()) navigate('/admin/dashboard')
    else if (roles.includes('STOCK')) navigate('/productos')
    else if (roles.includes('PEDIDOS')) navigate('/admin/pedidos')
  }

  return (
    <div className="app-shell relative font-sans">
      {/* Background image */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-20 pointer-events-none"
        style={{ backgroundImage: "url('/bg-food.png')" }}
      />

      <nav className="navbar relative z-50">

        <div className="navbar-brand">
          <div className="navbar-logo-mark">FF</div>
          <span className="navbar-brand-name">Fast Food</span>
        </div>

        <div className="navbar-nav">
          {canShop && (
            <>
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
            </>
          )}

          {showAdminMenu && (
            <button
              onClick={handleGoAdmin}
              className="nav-link"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}
            >
              Administración
            </button>
          )}
        </div>

        <div className="navbar-end">

          {canShop && (
            <>
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
            </>
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

      <div className="main-content relative z-10">
        <Outlet />
      </div>

      {cartOpen && <CarritoDrawer />}

    </div>
  )
}
