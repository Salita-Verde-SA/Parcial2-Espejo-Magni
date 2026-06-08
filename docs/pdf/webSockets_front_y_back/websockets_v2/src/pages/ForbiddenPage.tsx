import { useNavigate } from "react-router-dom";

export const ForbiddenPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-7xl font-bold text-slate-200">403</p>
        <h1 className="text-xl font-semibold text-slate-700 mt-2">
          Acceso denegado
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          No tenés permisos para ver esta página
        </p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-sm text-indigo-600 hover:underline cursor-pointer"
        >
          ← Volver
        </button>
      </div>
    </div>
  );
};
