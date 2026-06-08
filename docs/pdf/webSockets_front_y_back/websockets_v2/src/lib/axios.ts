import axios from "axios";

export const apiClient = axios.create({
  baseURL: "http://localhost:8000/api/v1",
  withCredentials: true, // envía la cookie httpOnly en cada request
});

// ─── Response interceptor ─────────────────────────────────────────────────────
// Extrae el mensaje de error del cuerpo FastAPI ({ detail: "..." })
// y lo relanza como un Error normal para que useQuery / useMutation lo reciban.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const detail =
      error.response?.data?.detail ?? error.message ?? "Error desconocido";
    return Promise.reject(new Error(detail));
  },
);
