// ─── components/Layout.tsx ────────────────────────────────────────────────────
// Componente de estructura de la aplicación. Se renderiza UNA sola vez
// y contiene la navbar horizontal + el área de contenido dinámico.
//
// React Router usa <Outlet /> para renderizar la página activa (hija)
// dentro de este layout. Es decir: Layout no sabe qué página está mostrando,
// solo provee la "carcasa" (navbar, carrito) alrededor de cualquier página.

import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useCartStore } from '../stores/cartStore'
import { useUiStore } from '../stores/uiStore'
import { logout } from '../api/auth'
import CarritoDrawer from './CarritoDrawer'

export default function Layout() {
  // Lee datos del usuario desde el store de autenticación
  const { nombre, roles, isAdmin } = useAuthStore()

  // itemCount: número total de unidades en el carrito (para el badge)
  // useCartStore con selector → solo re-renderiza si itemCount cambia
  const itemCount = useCartStore((s) => s.itemCount())

  // toggleCart: función para abrir/cerrar el drawer del carrito
  const toggleCart = useUiStore((s) => s.toggleCart)

  // cartOpen: booleano que controla si el CarritoDrawer se muestra
  const cartOpen = useUiStore((s) => s.cartOpen)

  // useNavigate: hook para redirigir programáticamente (sin <Link>)
  const navigate = useNavigate()

  // handleLogout: llama a la API para invalidar el token y redirige al login
  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  // Toma la primera letra del nombre para el avatar (ej: "Fabricio" → "F")
  const initial = (nombre ?? 'U')[0].toUpperCase()

  return (
    <div className="app-shell">

      {/* ── Navbar horizontal ─────────────────────────────────────────────── */}
      <nav className="navbar">

        {/* Marca / Logo: FF en cuadrado rojo + nombre del negocio */}
        <div className="navbar-brand">
          <div className="navbar-logo-mark">FF</div>
          <span className="navbar-brand-name">Fast Food</span>
        </div>

        {/* Links de navegación principal */}
        <div className="navbar-nav">
          {/* NavLink: como <Link> pero agrega la clase "active" automáticamente
              cuando la URL coincide con el destino */}
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

          {/* Muestra "Insumos" y "Productos" si el usuario tiene rol ADMIN o STOCK */}
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

          {/* Categorías y Usuarios solo para ADMIN */}
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

          {/* Muestra "Pedidos Admin" si el usuario es ADMIN o PEDIDOS */}
          {(roles.includes('ADMIN') || roles.includes('PEDIDOS')) && (
            <NavLink
              to="/admin/pedidos"
              className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
            >
              Pedidos Admin
            </NavLink>
          )}
        </div>

        {/* Zona derecha: carrito + usuario + logout */}
        <div className="navbar-end">

          {/* Botón de carrito con badge de cantidad */}
          <button
            className="btn btn-primary btn-sm"
            onClick={toggleCart}
            style={{ position: 'relative' }}
          >
            Carrito
            {/* Badge dorado con la cantidad de ítems.
                Solo se muestra si hay al menos 1 ítem. */}
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

          {/* Separador visual vertical */}
          <div className="navbar-divider" />

          {/* Info del usuario: avatar con inicial + nombre + rol */}
          <div className="navbar-user">
            <div className="avatar">{initial}</div>
            <div>
              <div className="navbar-username">{nombre}</div>
              <div className="navbar-role">{roles.join(', ')}</div>
            </div>
          </div>

          {/* Botón de cerrar sesión */}
          <button className="btn-logout" onClick={handleLogout}>
            Salir
          </button>
        </div>
      </nav>

      {/* ── Área de contenido dinámico ────────────────────────────────────── */}
      {/* <Outlet /> renderiza el componente de la ruta activa.
          Ej: si la URL es /catalogo → aquí aparece <CatalogoPage /> */}
      <div className="main-content">
        <Outlet />
      </div>

      {/* ── Drawer del carrito ────────────────────────────────────────────── */}
      {/* Se monta/desmonta del DOM según cartOpen.
          Está en Layout (no en CatalogoPage) para que funcione en cualquier página. */}
      {cartOpen && <CarritoDrawer />}

    </div>
  )
}
