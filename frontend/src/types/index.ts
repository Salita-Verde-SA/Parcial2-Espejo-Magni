export interface Ingrediente {
  id: number
  nombre: string
  descripcion: string | null
  es_alergeno: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface PaginatedIngredientes {
  items: Ingrediente[]
  total: number
  page: number
  page_size: number
  pages: number
}

export interface IngredienteCreate {
  nombre: string
  descripcion?: string
  es_alergeno: boolean
}

export interface IngredienteUpdate {
  nombre?: string
  descripcion?: string
  es_alergeno?: boolean
}

export interface LoginRequest {
  username: string
  password: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

export interface FiltrosIngrediente {
  nombre: string
  es_alergeno: string   // '' | 'true' | 'false'
  page: number
  page_size: number
}
