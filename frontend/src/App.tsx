import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import LoginPage from './pages/LoginPage'
import Layout from './features/ui/components/Layout'
import CatalogoPage from './pages/CatalogoPage'
import IngredientesPage from './pages/IngredientesPage'
import ProductosPage from './pages/ProductosPage'
import CategoriasPage from './pages/CategoriasPage'
import CheckoutPage from './pages/CheckoutPage'
import MisPedidosPage from './pages/MisPedidosPage'
import AdminPedidosPage from './pages/AdminPedidosPage'
import AdminUsuariosPage from './pages/AdminUsuariosPage'
import DashboardPage from './pages/DashboardPage'
import { initUser } from './api/auth'
import { useEffect, useState } from 'react'

function AppInitializer({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initUser().finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>Cargando...</div>
  }

  return <>{children}</>
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RequireRole({ roles, children }: { roles: string[]; children: React.ReactNode }) {
  const userRoles = useAuthStore((s) => s.roles)
  const hasAny = userRoles.some((r) => roles.includes(r))
  if (!hasAny) return <Navigate to="/" replace />
  return <>{children}</>
}

// Pantalla de inicio según el rol: cada perfil aterriza en su área de trabajo.
function landingPathFor(roles: string[]): string {
  if (roles.includes('ADMIN')) return '/admin/dashboard'
  if (roles.includes('STOCK')) return '/productos'
  if (roles.includes('PEDIDOS')) return '/admin/pedidos'
  if (roles.includes('CLIENT')) return '/catalogo'
  return '/catalogo'
}

function HomeRedirect() {
  const roles = useAuthStore((s) => s.roles)
  return <Navigate to={landingPathFor(roles)} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInitializer>
      <Routes>

        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/"
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<HomeRedirect />} />

          <Route path="catalogo" element={
            <RequireRole roles={['CLIENT', 'ADMIN']}><CatalogoPage /></RequireRole>
          } />

          <Route path="checkout" element={
            <RequireRole roles={['CLIENT', 'ADMIN']}><CheckoutPage /></RequireRole>
          } />

          <Route path="mis-pedidos" element={
            <RequireRole roles={['CLIENT', 'ADMIN']}><MisPedidosPage /></RequireRole>
          } />

          <Route path="ingredientes" element={
            <RequireRole roles={['ADMIN', 'STOCK']}><IngredientesPage /></RequireRole>
          } />

          <Route path="productos" element={
            <RequireRole roles={['ADMIN', 'STOCK']}><ProductosPage /></RequireRole>
          } />

          <Route path="categorias" element={
            <RequireRole roles={['ADMIN']}><CategoriasPage /></RequireRole>
          } />

          <Route path="usuarios" element={
            <RequireRole roles={['ADMIN']}><AdminUsuariosPage /></RequireRole>
          } />

          <Route path="admin/pedidos" element={
            <RequireRole roles={['ADMIN', 'PEDIDOS']}><AdminPedidosPage /></RequireRole>
          } />

          <Route path="admin/dashboard" element={
            <RequireRole roles={['ADMIN']}><DashboardPage /></RequireRole>
          } />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
      </AppInitializer>
    </BrowserRouter>
  )
}
