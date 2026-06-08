import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../stores/useAuthStore";
import type { UserRegisterPayload } from "../../../types/api";

export const RegisterPage = () => {
  const [form, setForm] = useState<UserRegisterPayload>({
    username: "",
    full_name: "",
    email: "",
    password: "",
  });
  const { register, isLoading, error, setError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await register(form);
      navigate("/dashboard");
    } catch {
      // error ya seteado en el store
    }
  };

  const set = (field: keyof UserRegisterPayload, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const inputClass =
    "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
      <h2 className="text-xl font-semibold text-slate-800 mb-6">
        Crear cuenta
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-2 underline cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Usuario
            </label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => set("username", e.target.value)}
              required
              disabled={isLoading}
              className={inputClass}
              placeholder="juan_perez"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nombre completo
            </label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => set("full_name", e.target.value)}
              required
              disabled={isLoading}
              className={inputClass}
              placeholder="Juan Pérez"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            required
            disabled={isLoading}
            className={inputClass}
            placeholder="juan@ejemplo.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Contraseña
          </label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            required
            minLength={8}
            disabled={isLoading}
            className={inputClass}
            placeholder="••••••••"
          />
          <p className="text-xs text-slate-400 mt-1">Mínimo 8 caracteres</p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? "Creando cuenta…" : "Crear cuenta"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-500">
        ¿Ya tenés cuenta?{" "}
        <Link to="/login" className="text-indigo-600 hover:underline">
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
};
