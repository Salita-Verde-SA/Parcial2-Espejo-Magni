export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

export interface UserPublic {
  id: number
  nombre: string
  apellido: string
  email: string
  disabled: boolean
  roles: string[]
  created_at: string
}

export interface Categoria {
  id: number
  nombre: string
  descripcion: string | null
  parent_id: number | null
  created_at: string
  deleted_at: string | null
  in_use: boolean
}

export interface IngredienteResumen {
  id: number
  nombre: string
  es_alergeno: boolean
  cantidad: number
  unidad_medida_id: number
  simbolo: string
  es_removible: boolean
  stock_insumo: number
}

export interface UnidadMedida {
  id: number
  nombre: string
  simbolo: string
  tipo: string
}

export interface Producto {
  id: number
  nombre: string
  descripcion: string | null
  precio_base: string
  unidad_venta_id: number | null
  unidad_venta: UnidadMedida | null
  stock_cantidad: number
  disponible: boolean
  imagen_url: string | null
  created_at: string
  deleted_at: string | null
  categorias: number[]
  ingredientes: IngredienteResumen[]
}

export interface FiltrosProducto {
  nombre: string
  categoria_id: number | null
  disponible: string
  page: number
  page_size: number
}

export interface PaginatedProductos {
  items: Producto[]
  total: number
  page: number
  page_size: number
  pages: number
}

export interface CartItem {
  producto: Producto
  cantidad: number
}

export interface DetallePedidoPublic {
  id: number
  pedido_id: number
  producto_id: number
  cantidad: number
  precio_unitario: string
  producto_nombre: string
}

export interface HistorialEstadoPedidoPublic {
  id: number
  pedido_id: number
  estado_anterior_codigo: string | null
  estado_nuevo_codigo: string
  fecha: string
  usuario_id: number
  usuario_nombre?: string
}

export interface DireccionPublic {
  id: number
  usuario_id: number
  calle: string
  numero: string
  piso: string | null
  departamento: string | null
  ciudad: string
  alias: string
  principal: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface DireccionCreate {
  calle: string
  numero: string
  piso?: string
  departamento?: string
  ciudad: string
  alias: string
  principal: boolean
}

export interface PedidoPublic {
  id: number
  usuario_id: number
  usuario_nombre?: string
  fecha: string
  estado_codigo: string
  forma_pago_codigo: string
  direccion_id: number | null
  direccion?: DireccionPublic | null
  total: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  items: DetallePedidoPublic[]
  historial: HistorialEstadoPedidoPublic[]
}

export interface PaginatedPedidos {
  items: PedidoPublic[]
  total: number
  page: number
  page_size: number
  pages: number
}

export interface DetallePedidoCreate {
  producto_id: number
  cantidad: number
}

export interface PedidoCreate {
  forma_pago_codigo: string
  direccion_id?: number | null
  items: DetallePedidoCreate[]
}
