// ─── App.tsx ─────────────────────────────────────────────────────────────────
// Componente raíz de la aplicación. Define el sistema de rutas con React Router.
// Centraliza la protección de rutas: quién puede acceder a qué página.

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import LoginPage from './pages/LoginPage'
import Layout from './components/Layout'
import CatalogoPage from './pages/CatalogoPage'
import IngredientesPage from './pages/IngredientesPage'
import ProductosPage from './pages/ProductosPage'
import CategoriasPage from './pages/CategoriasPage'
import CheckoutPage from './pages/CheckoutPage'
import MisPedidosPage from './pages/MisPedidosPage'
import AdminPedidosPage from './pages/AdminPedidosPage'
import AdminUsuariosPage from './pages/AdminUsuariosPage'

// ─── Guardia de autenticación ─────────────────────────────────────────────────
// Componente de "guardia": envuelve rutas que requieren estar logueado.
// Si no hay token en el store → redirige a /login automáticamente.
// Si hay token → renderiza los hijos normalmente.
function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

// ─── Guardia de rol ───────────────────────────────────────────────────────────
// Verifica que el usuario tenga al menos uno de los roles permitidos.
// Si no tiene el rol → redirige a "/" (inicio).
function RequireRole({ roles, children }: { roles: string[]; children: React.ReactNode }) {
  const userRoles = useAuthStore((s) => s.roles)
  const hasAny = userRoles.some((r) => roles.includes(r))
  if (!hasAny) return <Navigate to="/" replace />
  return <>{children}</>
}

// ─── Árbol de rutas ───────────────────────────────────────────────────────────
export default function App() {
  return (
    // BrowserRouter: habilita la navegación por URL (ej: /catalogo, /login).
    // Usa la History API del navegador en vez de recargar la página.
    <BrowserRouter>
      <Routes>

        {/* Ruta pública: cualquiera puede acceder al login */}
        <Route path="/login" element={<LoginPage />} />

        {/* Ruta protegida raíz: todo lo que esté dentro de "/" requiere login.
            Layout es el componente padre con la navbar; las sub-rutas se
            renderizan donde Layout tenga <Outlet />. */}
        <Route
          path="/"
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          {/* Ruta índice: "/" redirige automáticamente a "/catalogo" */}
          <Route index element={<Navigate to="/catalogo" replace />} />

          {/* Catálogo: accesible para cualquier usuario autenticado */}
          <Route path="catalogo" element={<CatalogoPage />} />

          {/* Checkout (confirmar pedido): accesible para clientes logueados */}
          <Route path="checkout" element={<CheckoutPage />} />

          {/* Mis Pedidos (historial de pedidos del cliente) */}
          <Route path="mis-pedidos" element={<MisPedidosPage />} />

          {/* Ingredientes: para ADMIN y STOCK */}
          <Route path="ingredientes" element={
            <RequireRole roles={['ADMIN', 'STOCK']}><IngredientesPage /></RequireRole>
          } />

          {/* Productos: para ADMIN y STOCK */}
          <Route path="productos" element={
            <RequireRole roles={['ADMIN', 'STOCK']}><ProductosPage /></RequireRole>
          } />

          {/* Categorías: solo para usuarios con rol ADMIN */}
          <Route path="categorias" element={
            <RequireRole roles={['ADMIN']}><CategoriasPage /></RequireRole>
          } />

          {/* Usuarios: solo para usuarios con rol ADMIN */}
          <Route path="usuarios" element={
            <RequireRole roles={['ADMIN']}><AdminUsuariosPage /></RequireRole>
          } />

          {/* Administración de Pedidos: accesible para ADMIN y PEDIDOS */}
          <Route path="admin/pedidos" element={
            <RequireRole roles={['ADMIN', 'PEDIDOS']}><AdminPedidosPage /></RequireRole>
          } />
        </Route>

        {/* Comodín: cualquier URL no definida redirige a "/" */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  )
}
