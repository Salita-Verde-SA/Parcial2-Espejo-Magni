import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "../stores/useAuthStore";

/**
 * InitApp: inicializa la autenticación al montar la app.
 * Llama a checkAuth() que consulta /auth/me con la cookie httpOnly.
 * Mientras carga, la UI sabe que debe esperar (isLoading: true).
 */
export const InitApp = ({ children }: { children: ReactNode }) => {
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return <>{children}</>;
};
