/** Respuesta del endpoint de login con los tokens de acceso y refresco. */
export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

/** Datos públicos de un usuario del sistema, incluyendo sus roles asignados. */
export interface UserPublic {
  id: number
  nombre: string
  apellido: string
  email: string
  disabled: boolean
  roles: string[]
  created_at: string
}

/** Representa una categoría del menú con soporte para jerarquía (parent_id) y borrado lógico. */
export interface Categoria {
  id: number
  nombre: string
  descripcion: string | null
  parent_id: number | null
  created_at: string
  deleted_at: string | null
  in_use: boolean
}

/** Extiende Categoria con el array de hijos directos para representar el árbol jerárquico completo. */
export interface CategoriaTree extends Categoria {
  hijos: CategoriaTree[]
}

/** Datos requeridos para crear o actualizar una categoría. */
export interface CategoriaCreate {
  nombre: string
  descripcion?: string
  parent_id?: number | null
}

/** Representa un ingrediente/insumo con información de stock, alérgeno y borrado lógico. */
export interface Ingrediente {
  id: number
  nombre: string
  descripcion: string | null
  es_alergeno: boolean
  stock_cantidad: number
  created_at: string
  deleted_at: string | null
}

/** Datos requeridos para crear un nuevo ingrediente. */
export interface IngredienteCreate {
  nombre: string
  descripcion?: string
  es_alergeno: boolean
  stock_cantidad?: number
}

/** Datos opcionales para actualizar parcialmente un ingrediente existente. */
export interface IngredienteUpdate {
  nombre?: string
  descripcion?: string
  es_alergeno?: boolean
  stock_cantidad?: number
}

/** Parámetros de filtrado para la búsqueda de ingredientes. */
export interface FiltrosIngrediente {
  nombre: string
  es_alergeno: string
  page: number
  page_size: number
}

/** Respuesta paginada del endpoint de ingredientes. */
export interface PaginatedIngredientes {
  items: Ingrediente[]
  total: number
  page: number
  page_size: number
  pages: number
}

/** Representa una unidad de medida utilizada para ingredientes y productos. */
export interface UnidadMedida {
  id: number
  nombre: string
  simbolo: string
  tipo: string
  created_at: string
}

/** Datos requeridos para crear una nueva unidad de medida. */
export interface UnidadMedidaCreate {
  nombre: string
  simbolo: string
  tipo: string
}

/** Datos opcionales para actualizar parcialmente una unidad de medida existente. */
export interface UnidadMedidaUpdate {
  nombre?: string
  simbolo?: string
  tipo?: string
}

/** Resumen de un ingrediente asociado a un producto, incluyendo cantidad por receta, unidad y stock disponible. */
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

/** Input para asociar un ingrediente a un producto con su cantidad, unidad y si es removible por el cliente. */
export interface IngredienteCantidadInput {
  ingrediente_id: number
  cantidad: number
  unidad_medida_id: number
  es_removible: boolean
}

/** Representa un producto del menú con precio, stock calculado, categorías, ingredientes y borrado lógico. */
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

/** Datos requeridos para crear un nuevo producto del menú. */
export interface ProductoCreate {
  nombre: string
  descripcion?: string
  precio_base: number
  unidad_venta_id?: number | null
  disponible: boolean
  imagen_url?: string
  categoria_ids: number[]
  ingredientes: IngredienteCantidadInput[]
}

/** Datos opcionales para actualizar parcialmente un producto existente. */
export interface ProductoUpdate {
  nombre?: string
  descripcion?: string
  precio_base?: number
  unidad_venta_id?: number | null
  disponible?: boolean
  imagen_url?: string
  categoria_ids?: number[]
  ingredientes?: IngredienteCantidadInput[]
}

/** Parámetros de filtrado para la búsqueda de productos. */
export interface FiltrosProducto {
  nombre: string
  categoria_id: number | null
  disponible: string
  page: number
  page_size: number
}

/** Respuesta paginada del endpoint de productos. */
export interface PaginatedProductos {
  items: Producto[]
  total: number
  page: number
  page_size: number
  pages: number
}

/** Item del carrito de compras que combina un producto con su cantidad y posibles ingredientes removidos. */
export interface CartItem {
  producto: Producto
  cantidad: number
  personalizacion: number[]
}

/** Detalle de un ítem dentro de un pedido confirmado. */
export interface DetallePedidoPublic {
  id: number
  pedido_id: number
  producto_id: number
  cantidad: number
  precio_unitario: string
  producto_nombre: string
}

/** Registro de historial de cambios de estado de un pedido (audit trail). */
export interface HistorialEstadoPedidoPublic {
  id: number
  pedido_id: number
  estado_anterior_codigo: string | null
  estado_nuevo_codigo: string
  fecha: string
  usuario_id: number
  usuario_nombre?: string
}

/** Representación pública de un pedido con sus ítems, historial de estados y dirección de entrega. */
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

/** Respuesta paginada del endpoint de pedidos. */
export interface PaginatedPedidos {
  items: PedidoPublic[]
  total: number
  page: number
  page_size: number
  pages: number
}

/** Input de un ítem al crear un pedido: producto y cantidad. */
export interface DetallePedidoCreate {
  producto_id: number
  cantidad: number
}

/** Datos requeridos para crear un nuevo pedido desde el checkout. */
export interface PedidoCreate {
  forma_pago_codigo: string
  direccion_id?: number | null
  items: DetallePedidoCreate[]
}

/** Representa una forma de pago disponible en el sistema. */
export interface FormaPago {
  codigo: string
  descripcion: string | null
}

/** Representa un estado del pedido en la máquina de estados. */
export interface EstadoPedido {
  codigo: string
  descripcion: string
}

/** Representación pública de una dirección de entrega de un usuario. */
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

/** Datos requeridos para crear una nueva dirección de entrega. */
export interface DireccionCreate {
  calle: string
  numero: string
  piso?: string
  departamento?: string
  ciudad: string
  alias: string
  principal: boolean
}

/** Datos opcionales para actualizar parcialmente una dirección de entrega existente. */
export interface DireccionUpdate {
  calle?: string
  numero?: string
  piso?: string
  departamento?: string
  ciudad?: string
  alias?: string
  principal?: boolean
}

/** Datos agregados del dashboard administrativo. */
export interface DashboardData {
  total_pedidos: number
  total_productos: number
  total_usuarios: number
  pedidos_por_estado: Record<string, number>
}
