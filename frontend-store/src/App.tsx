import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import LoginPage from './pages/LoginPage'
import Layout from './components/Layout'
import CatalogoPage from './pages/CatalogoPage'
import CheckoutPage from './pages/CheckoutPage'
import MisPedidosPage from './pages/MisPedidosPage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
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
          <Route index element={<Navigate to="/catalogo" replace />} />
          <Route path="catalogo" element={<CatalogoPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="mis-pedidos" element={<MisPedidosPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  )
}
