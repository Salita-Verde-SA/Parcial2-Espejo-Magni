import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AppLayout } from "../components/layout/AppLayout";
import { ForbiddenPage } from "../pages/ForbiddenPage";
import { ProtectedRoute } from "./ProtectedRoute";

import { LoginPage } from "../modules/auth/pages/LoginPage";
import { DashboardPage } from "../modules/dashboard/pages/DashboardPage";
import { AdminPage } from "../modules/admin/pages/AdminPage";
import { ClientePage } from "../modules/pedidos/pages/ClientePage";
import { AuthLayout } from "../components/layout/AuthLayout";
import { RegisterPage } from "../modules/auth/pages/RegisterPage";
import { CajeroPage } from "../modules/pedidos/pages/CajeroPage";
import { KdsPage } from "../modules/pedidos/pages/KdsPage";

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route
          path="/login"
          element={
            <AuthLayout>
              <LoginPage />
            </AuthLayout>
          }
        />
        <Route
          path="/register"
          element={
            <AuthLayout>
              <RegisterPage />
            </AuthLayout>
          }
        />
        <Route path="/forbidden" element={<ForbiddenPage />} />

        {/* Rutas protegidas dentro del layout principal */}
        <Route element={<AppLayout />}>
          {/* Todos los roles autenticados */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={["admin", "user", "pedidos", "cocina"]}
              />
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>

          {/* Cliente: clientes + cajero + admin (no cocina) */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["admin", "user", "pedidos"]} />
            }
          >
            <Route path="/pedidos/cliente" element={<ClientePage />} />
          </Route>

          {/* Cajero: pedidos + admin */}
          <Route
            element={<ProtectedRoute allowedRoles={["admin", "pedidos"]} />}
          >
            <Route path="/pedidos/cajero" element={<CajeroPage />} />
          </Route>

          {/* KDS: cocina + pedidos + admin */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["admin", "pedidos", "cocina"]} />
            }
          >
            <Route path="/pedidos/kds" element={<KdsPage />} />
          </Route>

          {/* Solo admin */}
          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="/admin" element={<AdminPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
