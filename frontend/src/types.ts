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

export interface CategoriaTree extends Categoria {
  hijos: CategoriaTree[]
}

export interface CategoriaCreate {
  nombre: string
  descripcion?: string
  parent_id?: number | null
}

export interface Ingrediente {
  id: number
  nombre: string
  descripcion: string | null
  es_alergeno: boolean
  es_terminado: boolean
  stock_cantidad: number
  costo_unitario: string
  created_at: string
  deleted_at: string | null
}

export interface IngredienteCreate {
  nombre: string
  descripcion?: string
  es_alergeno: boolean
  es_terminado: boolean
  stock_cantidad?: number
  costo_unitario?: number
}

export interface IngredienteUpdate {
  nombre?: string
  descripcion?: string
  es_alergeno?: boolean
  es_terminado?: boolean
  stock_cantidad?: number
  costo_unitario?: number
}

export interface FiltrosIngrediente {
  nombre: string
  es_alergeno: string
  page: number
  page_size: number
}

export interface PaginatedIngredientes {
  items: Ingrediente[]
  total: number
  page: number
  page_size: number
  pages: number
}

export interface UnidadMedida {
  id: number
  nombre: string
  simbolo: string
  tipo: string
  created_at: string
}

export interface UnidadMedidaCreate {
  nombre: string
  simbolo: string
  tipo: string
}

export interface UnidadMedidaUpdate {
  nombre?: string
  simbolo?: string
  tipo?: string
}

export interface IngredienteResumen {
  id: number
  nombre: string
  es_alergeno: boolean
  es_terminado: boolean
  cantidad: number
  unidad_medida_id: number
  simbolo: string
  es_removible: boolean
  stock_insumo: number
  costo_unitario: number
}

export interface IngredienteCantidadInput {
  ingrediente_id: number
  cantidad: number
  unidad_medida_id: number
  es_removible: boolean
}

export interface Producto {
  id: number
  nombre: string
  descripcion: string | null
  precio_base: string
  margen_ganancia: string
  costo_total: string
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

export interface ProductoCreate {
  nombre: string
  descripcion?: string
  precio_base: number
  margen_ganancia: number
  unidad_venta_id?: number | null
  disponible: boolean
  imagen_url?: string
  categoria_ids: number[]
  ingredientes: IngredienteCantidadInput[]
}

export interface ProductoUpdate {
  nombre?: string
  descripcion?: string
  precio_base?: number
  margen_ganancia?: number
  unidad_venta_id?: number | null
  disponible?: boolean
  imagen_url?: string
  categoria_ids?: number[]
  ingredientes?: IngredienteCantidadInput[]
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
  personalizacion: number[]
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
  descuento: string
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
  descuento?: number
  items: DetallePedidoCreate[]
}

export interface FormaPago {
  codigo: string
  descripcion: string | null
}

export interface EstadoPedido {
  codigo: string
  descripcion: string
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

export interface DireccionUpdate {
  calle?: string
  numero?: string
  piso?: string
  departamento?: string
  ciudad?: string
  alias?: string
  principal?: boolean
}

export interface DashboardData {
  total_pedidos: number
  total_productos: number
  total_usuarios: number
  pedidos_por_estado: Record<string, number>
}
