export type UserRole = "admin" | "pedidos" | "cocina" | "user";

export interface UserPublic {
  id: number;
  username: string;
  full_name: string;
  email: string;
  role: UserRole;
  disabled: boolean;
}

export interface UserRegisterPayload {
  username: string;
  full_name: string;
  email: string;
  password: string;
}

export type PedidoEstado =
  | "pendiente"
  | "confirmado"
  | "preparando"
  | "listo"
  | "entregado"
  | "cancelado";

export interface PedidoPublic {
  id: number;
  descripcion: string;
  total: number;
  estado: PedidoEstado;
  usuario_id: number | null;
}

export interface PedidoCreate {
  descripcion: string;
  total?: number;
}

export interface CategoriaPublic {
  id: number;
  nombre: string;
  descripcion: string;
}

export interface CategoriaCreate {
  nombre: string;
  descripcion?: string;
}

export interface CategoriaUpdate {
  nombre?: string;
  descripcion?: string;
}
