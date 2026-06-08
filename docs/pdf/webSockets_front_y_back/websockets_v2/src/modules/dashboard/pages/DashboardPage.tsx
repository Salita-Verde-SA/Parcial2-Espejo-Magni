import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../stores/useAuthStore";

type Card = {
  label: string;
  description: string;
  path: string;
  colorClass: string;
  show: boolean;
};

export const DashboardPage = () => {
  const { user, hasRole } = useAuthStore();
  const navigate = useNavigate();

  const cards: Card[] = [
    {
      label: "Mis Pedidos",
      description: "Ver y seguir tus pedidos en tiempo real",
      path: "/pedidos/cliente",
      colorClass:
        "bg-green-50 border-green-200 hover:border-green-400 text-green-800",
      show: !hasRole("cocina"),
    },
    {
      label: "Cajero",
      description: "Gestionar y avanzar pedidos entrantes",
      path: "/pedidos/cajero",
      colorClass:
        "bg-amber-50 border-amber-200 hover:border-amber-400 text-amber-800",
      show: hasRole("admin", "pedidos"),
    },
    {
      label: "KDS — Cocina",
      description: "Display de cocina con pedidos en vivo",
      path: "/pedidos/kds",
      colorClass:
        "bg-orange-50 border-orange-200 hover:border-orange-400 text-orange-800",
      show: hasRole("admin", "pedidos", "cocina"),
    },
    {
      label: "Administración",
      description: "Vista general de todos los pedidos",
      path: "/admin",
      colorClass:
        "bg-purple-50 border-purple-200 hover:border-purple-400 text-purple-800",
      show: hasRole("admin"),
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">
          Bienvenido, {user?.full_name} 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Conectado como{" "}
          <span className="font-medium text-slate-700">{user?.username}</span> ·
          Rol: <span className="font-medium text-slate-700">{user?.role}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards
          .filter((c) => c.show)
          .map((card) => (
            <button
              key={card.path}
              onClick={() => navigate(card.path)}
              className={`text-left p-5 rounded-xl border-2 transition-all hover:shadow-md cursor-pointer ${card.colorClass}`}
            >
              <h3 className="font-semibold text-base">{card.label}</h3>
              <p className="text-sm mt-1 opacity-70">{card.description}</p>
            </button>
          ))}
      </div>
    </div>
  );
};
