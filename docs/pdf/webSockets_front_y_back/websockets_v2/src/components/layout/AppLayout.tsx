import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/useAuthStore";

const roleBadgeClass: Record<string, string> = {
  admin: "bg-purple-100 text-purple-700",
  pedidos: "bg-blue-100 text-blue-700",
  cocina: "bg-orange-100 text-orange-700",
  user: "bg-green-100 text-green-700",
};

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium transition-colors px-1 py-0.5 rounded ${
    isActive
      ? "text-indigo-600 border-b-2 border-indigo-600"
      : "text-slate-700 hover:text-indigo-600"
  }`;

export const AppLayout = () => {
  const { user, logout, hasRole } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-6">
              <span className="font-bold text-indigo-600 text-lg">
                🍽 Restaurante
              </span>
              <NavLink to="/dashboard" className={navLinkClass}>
                Dashboard
              </NavLink>
              {!hasRole("cocina") && (
                <NavLink to="/pedidos/cliente" className={navLinkClass}>
                  Mis Pedidos
                </NavLink>
              )}
              {hasRole("admin", "pedidos") && (
                <NavLink to="/pedidos/cajero" className={navLinkClass}>
                  Cajero
                </NavLink>
              )}
              {hasRole("admin", "pedidos", "cocina") && (
                <NavLink to="/pedidos/kds" className={navLinkClass}>
                  KDS
                </NavLink>
              )}
              {hasRole("admin") && (
                <NavLink to="/admin" className={navLinkClass}>
                  Admin
                </NavLink>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600">
                {user?.full_name}
                <span
                  className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${
                    roleBadgeClass[user?.role ?? ""] ??
                    "bg-slate-100 text-slate-600"
                  }`}
                >
                  {user?.role}
                </span>
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};
