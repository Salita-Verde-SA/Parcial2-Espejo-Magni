import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { logout } from '../api/auth'

export default function Layout() {
  const { nombre, roles, isAdmin } = useAuthStore()
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
          <span className="navbar-brand-name">Fast Food Admin</span>
        </div>

        <div className="navbar-nav">
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

    </div>
  )
}
