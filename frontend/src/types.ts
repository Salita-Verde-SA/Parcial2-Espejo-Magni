// ─── types.ts ─────────────────────────────────────────────────────────────────
// Definiciones de tipos TypeScript para toda la app.
// Cada interface describe la "forma" de un objeto que viene del backend
// o que se usa internamente. TypeScript usa esto para verificar en
// tiempo de compilación que los datos tienen los campos correctos.

// ─── Auth ─────────────────────────────────────────────────────────────────────

// Respuesta del endpoint POST /api/v1/auth/login
export interface LoginResponse {
  access_token: string    // JWT de corta duración (para autorizar requests)
  refresh_token: string   // Token de larga duración (para renovar el access_token)
  token_type: string      // Siempre "Bearer"
  expires_in: number      // Segundos hasta que vence el access_token
}

// ─── Usuario ──────────────────────────────────────────────────────────────────

// Datos públicos de un usuario (sin contraseña)
export interface UserPublic {
  id: number
  nombre: string
  apellido: string
  email: string
  disabled: boolean       // true si el usuario fue desactivado
  roles: string[]         // ej: ["ADMIN", "CLIENT"]
  created_at: string      // fecha ISO 8601
}

// ─── Categoría ────────────────────────────────────────────────────────────────

// Categoría plana (sin hijos)
export interface Categoria {
  id: number
  nombre: string
  descripcion: string | null   // null si no se cargó descripción
  parent_id: number | null     // null si es categoría raíz
  created_at: string
  deleted_at: string | null    // null = activo, no null = desactivado
  in_use: boolean             // true = tiene productos activos asociados
}

// Categoría en forma de árbol (con sub-categorías anidadas)
// Extiende Categoria agregando el array de hijos recursivo
export interface CategoriaTree extends Categoria {
  hijos: CategoriaTree[]       // puede estar vacío []
}

// Datos necesarios para crear una nueva categoría (sin id ni timestamps)
export interface CategoriaCreate {
  nombre: string
  descripcion?: string         // "?" = campo opcional
  parent_id?: number | null
}

// ─── Ingrediente ──────────────────────────────────────────────────────────────

export interface Ingrediente {
  id: number
  nombre: string
  descripcion: string | null
  es_alergeno: boolean         // si true → se muestra badge rojo de alérgeno
  stock_cantidad: number       // cantidad disponible en inventario
  created_at: string
  deleted_at: string | null    // null = activo, no null = desactivado
}

// Datos para crear un ingrediente nuevo
export interface IngredienteCreate {
  nombre: string
  descripcion?: string
  es_alergeno: boolean
  stock_cantidad?: number      // default 0
}

// Datos para actualizar un ingrediente (todos opcionales con "?")
// Permite enviar solo los campos que cambiaron (PATCH parcial)
export interface IngredienteUpdate {
  nombre?: string
  descripcion?: string
  es_alergeno?: boolean
  stock_cantidad?: number
}

// Parámetros de filtro para la pantalla de Insumos
export interface FiltrosIngrediente {
  nombre: string
  es_alergeno: string    // "" | "true" | "false" (string para el <select>)
  page: number
  page_size: number
}

// Respuesta paginada del endpoint GET /api/v1/ingredientes/
export interface PaginatedIngredientes {
  items: Ingrediente[]   // la lista de esta página
  total: number          // total de registros en la base de datos
  page: number           // página actual
  page_size: number      // cuántos por página
  pages: number          // total de páginas
}

// ─── Unidad de Medida ─────────────────────────────────────────────────────────

export interface UnidadMedida {
  id: number
  nombre: string
  simbolo: string
  tipo: string  // masa, volumen, unidad, area
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

// ─── Producto ─────────────────────────────────────────────────────────────────

// Vista resumida del ingrediente dentro de un producto
export interface IngredienteResumen {
  id: number
  nombre: string
  es_alergeno: boolean
  cantidad: number           // cantidad de este ingrediente en el producto
  unidad_medida_id: number   // ID de la unidad de medida
  simbolo: string            // símbolo de la unidad (ej: "g", "kg", "u")
  es_removible: boolean     // si true → el cliente puede quitarlo del pedido
  stock_insumo: number      // stock actual del ingrediente en inventario
}

// Input para especificar ingrediente con cantidad al crear/editar producto
export interface IngredienteCantidadInput {
  ingrediente_id: number
  cantidad: number
  unidad_medida_id: number
  es_removible: boolean
}

export interface UnidadMedida {
  id: number
  nombre: string
  simbolo: string   // ej: "kg", "g", "L", "u"
  tipo: string       // "masa" | "volumen" | "unidad" | "area"
}

export interface Producto {
  id: number
  nombre: string
  descripcion: string | null
  precio_base: string          // viene como string del backend (decimal exacto)
  unidad_venta_id: number | null  // ID de la unidad de venta (nullable)
  unidad_venta: UnidadMedida | null
  stock_cantidad: number
  disponible: boolean          // false → botón "Agregar" deshabilitado
  imagen_url: string | null    // null → se muestra la inicial del nombre
  created_at: string
  deleted_at: string | null    // null = activo, no null = desactivado
  categorias: number[]         // IDs de las categorías a las que pertenece
  ingredientes: IngredienteResumen[]
}

// Datos para crear un producto nuevo
export interface ProductoCreate {
  nombre: string
  descripcion?: string
  precio_base: number
  unidad_venta_id?: number | null
  disponible: boolean
  imagen_url?: string
  categoria_ids: number[]    // IDs de categorías
  ingredientes: IngredienteCantidadInput[]  // Lista de ingredientes con cantidad
}

// Datos para actualizar un producto (todos opcionales)
export interface ProductoUpdate {
  nombre?: string
  descripcion?: string
  precio_base?: number
  unidad_venta_id?: number | null
  disponible?: boolean
  imagen_url?: string
  categoria_ids?: number[]
  ingredientes?: IngredienteCantidadInput[]  // Lista de ingredientes con cantidad
}

// Parámetros de filtro para el Catálogo
export interface FiltrosProducto {
  nombre: string
  categoria_id: number | null
  disponible: string      // "" | "true" | "false"
  page: number
  page_size: number
}

// Respuesta paginada del endpoint GET /api/v1/productos/
export interface PaginatedProductos {
  items: Producto[]
  total: number
  page: number
  page_size: number
  pages: number
}

// ─── Carrito ──────────────────────────────────────────────────────────────────

// Un ítem dentro del carrito de compras (estado local, no va a la BD todavía)
export interface CartItem {
  producto: Producto
  cantidad: number
  personalizacion: number[]   // IDs de ingredientes removidos por el cliente
}

// ─── Pedido ───────────────────────────────────────────────────────────────────

export interface DetallePedidoPublic {
  id: number
  pedido_id: number
  producto_id: number
  cantidad: number
  precio_unitario: string
  producto_nombre: string
}

// Un registro del historial de estados de un pedido (append-only)
export interface HistorialEstadoPedidoPublic {
  id: number
  pedido_id: number
  estado_anterior_codigo: string | null
  estado_nuevo_codigo: string
  fecha: string
  usuario_id: number
  usuario_nombre?: string
}

// Pedido completo con sus ítems e historial
export interface PedidoPublic {
  id: number
  usuario_id: number
  usuario_nombre?: string
  fecha: string
  estado_codigo: string         // estado actual (PENDIENTE, CONFIRMADO, etc.)
  forma_pago_codigo: string     // MERCADOPAGO, EFECTIVO, etc.
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

// Datos para crear un ítem al hacer un pedido
export interface DetallePedidoCreate {
  producto_id: number
  cantidad: number
}

// Datos para crear un pedido nuevo
export interface PedidoCreate {
  forma_pago_codigo: string
  direccion_id?: number | null
  items: DetallePedidoCreate[]
}

// Formas de pago disponibles (seeded en la BD)
export interface FormaPago {
  codigo: string
  descripcion: string | null
}

// Estado del ciclo de vida de un pedido
export interface EstadoPedido {
  codigo: string
  descripcion: string
}

// ─── Dirección ────────────────────────────────────────────────────────────────

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

// ─── Dashboard ────────────────────────────────────────────────────────────────

// Datos estadísticos para una pantalla de resumen (no implementada aún)
export interface DashboardData {
  total_pedidos: number
  total_productos: number
  total_usuarios: number
  pedidos_por_estado: Record<string, number>  // { "PENDIENTE": 5, "ENTREGADO": 12 }
}
