import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../stores/useAuthStore";
import type { UserRole } from "../types/api";

type Props = {
  allowedRoles: UserRole[];
};

export const ProtectedRoute = ({ allowedRoles }: Props) => {
  const { user, hasRole, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-slate-500">Restaurando sesión…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!hasRole(...allowedRoles)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
};
