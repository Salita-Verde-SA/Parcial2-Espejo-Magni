import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useCartStore } from '../stores/cartStore'
import { useUiStore } from '../stores/uiStore'
import { logout } from '../api/auth'
import CarritoDrawer from './CarritoDrawer'

export default function Layout() {
  const { nombre } = useAuthStore()
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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f8f7f5' }}>

      <nav style={{
        background: '#1C1917',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        height: 60,
        gap: 24,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 16 }}>
          <div style={{
            width: 34, height: 34,
            background: 'linear-gradient(135deg, #E53E3E, #CC1F1F)',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: 14, color: '#fff',
          }}>FF</div>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Fast Food</span>
        </div>

        <NavLink
          to="/catalogo"
          style={({ isActive }) => ({
            color: isActive ? '#E53E3E' : 'rgba(255,255,255,0.75)',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: 14,
            padding: '4px 0',
            borderBottom: isActive ? '2px solid #E53E3E' : '2px solid transparent',
          })}
        >
          Catálogo
        </NavLink>

        <NavLink
          to="/mis-pedidos"
          style={({ isActive }) => ({
            color: isActive ? '#E53E3E' : 'rgba(255,255,255,0.75)',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: 14,
            padding: '4px 0',
            borderBottom: isActive ? '2px solid #E53E3E' : '2px solid transparent',
          })}
        >
          Mis Pedidos
        </NavLink>

        <div style={{ flex: 1 }} />

        <button
          onClick={toggleCart}
          style={{
            position: 'relative',
            background: '#E53E3E',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '6px 16px',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          🛒 Carrito
          {itemCount > 0 && (
            <span style={{
              position: 'absolute',
              top: -7, right: -7,
              background: '#FBBF24',
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32,
            background: '#E53E3E',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 13, color: '#fff',
          }}>
            {initial}
          </div>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>{nombre}</span>
        </div>

        <button
          onClick={handleLogout}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.2)',
            color: 'rgba(255,255,255,0.7)',
            borderRadius: 6,
            padding: '5px 12px',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Salir
        </button>
      </nav>

      <main style={{ flex: 1, padding: '24px 32px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <Outlet />
      </main>

      {cartOpen && <CarritoDrawer />}
    </div>
  )
}
