import type { ReactNode } from "react";

export const AuthLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-4xl">🍽</span>
          <h1 className="text-2xl font-bold text-slate-800 mt-2">
            Restaurante
          </h1>
          <p className="text-slate-500 text-sm">
            Sistema de gestión de pedidos
          </p>
        </div>
        {children}
      </div>
    </div>
  );
};
