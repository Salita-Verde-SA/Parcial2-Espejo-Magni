import { create } from "zustand";
import * as authApi from "../api/authApi";
import type { UserPublic, UserRegisterPayload, UserRole } from "../types/api";

/**
 * Store de autenticación basado en cookies httpOnly.
 *
 * El JWT NO vive en el frontend. Solo existe como cookie httpOnly
 * administrada por el navegador y el backend.
 * Zustand mantiene únicamente datos no sensibles del usuario en memoria.
 * Al recargar se rehidrata llamando a `/auth/me` (la cookie viaja automáticamente).
 */
interface AuthState {
  user: UserPublic | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  hasRole: (...roles: UserRole[]) => boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (payload: UserRegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearSession: () => void;
  setError: (msg: string | null) => void;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  setError: (msg) => set({ error: msg }),

  hasRole: (...roles) => {
    const { user } = get();
    if (!user) return false;
    return roles.includes(user.role);
  },

  clearSession: () =>
    set({ user: null, isAuthenticated: false, isLoading: false, error: null }),

  checkAuth: async () => {
    set({ isLoading: true, error: null });
    try {
      const user = await authApi.requestMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      await authApi.requestLogin(username, password);
      const user = await authApi.requestMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error de inicio de sesión";
      set({ user: null, isAuthenticated: false, isLoading: false, error: msg });
      throw e;
    }
  },

  register: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      await authApi.requestRegister(payload);
      set({ isLoading: false });
      await get().login(payload.username, payload.password);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al registrarse";
      set({ isLoading: false, error: msg });
      throw e;
    }
  },

  logout: async () => {
    try {
      await authApi.requestLogout();
    } catch {
      // Aun si falla la red, limpiamos el estado local
    }
    set({ user: null, isAuthenticated: false, error: null, isLoading: false });
  },
}));
