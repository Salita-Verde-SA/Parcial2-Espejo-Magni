/** Representa un ingrediente/insumo con información básica y borrado lógico (versión simplificada del módulo de tipos principal). */
export interface Ingrediente {
  id: number
  nombre: string
  descripcion: string | null
  es_alergeno: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

/** Respuesta paginada del endpoint de ingredientes. */
export interface PaginatedIngredientes {
  items: Ingrediente[]
  total: number
  page: number
  page_size: number
  pages: number
}

/** Datos requeridos para crear un nuevo ingrediente. */
export interface IngredienteCreate {
  nombre: string
  descripcion?: string
  es_alergeno: boolean
}

/** Datos opcionales para actualizar parcialmente un ingrediente existente. */
export interface IngredienteUpdate {
  nombre?: string
  descripcion?: string
  es_alergeno?: boolean
}

/** Datos de la solicitud de login con username y password. */
export interface LoginRequest {
  username: string
  password: string
}

/** Respuesta del endpoint de autenticación con el access token. */
export interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

/** Parámetros de filtrado para la búsqueda de ingredientes, incluyendo filtro de alérgeno como string ('', 'true', 'false'). */
export interface FiltrosIngrediente {
  nombre: string
  es_alergeno: string   // '' | 'true' | 'false'
  page: number
  page_size: number
}
