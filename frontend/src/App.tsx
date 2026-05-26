import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import LoginPage from './pages/LoginPage'
import Layout from './components/Layout'
import IngredientesPage from './pages/IngredientesPage'
import ProductosPage from './pages/ProductosPage'
import CategoriasPage from './pages/CategoriasPage'
import AdminPedidosPage from './pages/AdminPedidosPage'
import AdminUsuariosPage from './pages/AdminUsuariosPage'
import CatalogoPage from './pages/CatalogoPage'
import CheckoutPage from './pages/CheckoutPage'
import MisPedidosPage from './pages/MisPedidosPage'

const STAFF_ROLES = ['ADMIN', 'STOCK', 'PEDIDOS']

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

function DefaultRedirect() {
  const roles = useAuthStore((s) => s.roles)
  const isStaff = roles.some((r) => STAFF_ROLES.includes(r))
  if (!isStaff && roles.includes('CLIENT')) return <Navigate to="/catalogo" replace />
  if (roles.includes('ADMIN') || roles.includes('PEDIDOS')) return <Navigate to="/admin/pedidos" replace />
  return <Navigate to="/ingredientes" replace />
}

export default function App() {
  return (
    <BrowserRouter>
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
          <Route index element={<DefaultRedirect />} />

          <Route path="catalogo" element={
            <RequireRole roles={['CLIENT', 'ADMIN']}><CatalogoPage /></RequireRole>
          } />

          <Route path="checkout" element={
            <RequireRole roles={['CLIENT']}><CheckoutPage /></RequireRole>
          } />

          <Route path="mis-pedidos" element={
            <RequireRole roles={['CLIENT']}><MisPedidosPage /></RequireRole>
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
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  )
}
