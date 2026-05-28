# Fast Food — Frontend

Aplicación React unificada para el sistema de pedidos de Fast Food. Combina en una sola SPA tanto la interfaz de clientes (catálogo, carrito, checkout, mis pedidos) como el panel de administración (gestión de insumos, productos, categorías, pedidos y usuarios). La navegación y las funcionalidades visibles se adaptan dinámicamente según el rol del usuario autenticado.

---

## Stack tecnológico

| Tecnología | Versión | Rol en el proyecto |
|---|---|---|
| React | 18 | Biblioteca de interfaz de usuario |
| TypeScript | 5 | Tipado estático |
| Vite | 5 | Bundler y servidor de desarrollo |
| TanStack Query | v5 | Caché de datos remotos y estados de carga/error |
| Zustand | v5 | Estado global del cliente (auth, carrito, UI) |
| Axios | 1 | Cliente HTTP con interceptores JWT |
| React Router | v6 | Enrutamiento declarativo con guards de rol |
| Tailwind CSS | 3 | Estilos utilitarios (AdminUsuariosPage) |
| CSS custom properties | — | Sistema de diseño centralizado (index.css) |

---

## Instalación y ejecución local

```bash
# Desde la carpeta frontend/
npm install
npm run dev
```

El servidor de desarrollo se levanta en `http://localhost:5173`. Las peticiones a `/api/v1/` y `/ws/` son proxeadas al backend FastAPI según la configuración de Vite.

Cuentas de prueba disponibles:
- `admin@fastfood.com` — rol ADMIN (acceso total)
- `stock@fastfood.com` — rol STOCK (insumos y productos)
- `pedidos@fastfood.com` — rol PEDIDOS (gestión de pedidos)
- `cliente@fastfood.com` — rol CLIENT (catálogo, carrito, mis pedidos)

---

## Estructura del proyecto

```
frontend/
├── index.html                  Punto de entrada HTML
├── vite.config.ts              Configuración de Vite y proxy al backend
├── tsconfig.json               Configuración de TypeScript
├── package.json                Dependencias y scripts
└── src/
    ├── main.tsx                Punto de montaje de React y QueryClient
    ├── App.tsx                 Router principal con guards de autenticación y rol
    ├── index.css               Estilos globales y custom properties CSS
    ├── types.ts                Interfaces TypeScript principales de toda la app
    ├── types/
    │   └── index.ts            Interfaces TypeScript alternativas (módulo legacy)
    ├── api/                    Capa de acceso a la API REST del backend
    ├── stores/                 Stores de estado global con Zustand
    ├── hooks/                  Custom hooks reutilizables
    ├── components/             Componentes de UI compartidos entre páginas
    └── pages/                  Páginas completas mapeadas a rutas
```

---

## Descripción de cada archivo

### `src/main.tsx`

Punto de entrada de la aplicación React. Crea la instancia de `QueryClient` con configuración por defecto (retry 1, staleTime 30 s) y monta el árbol de componentes en el elemento `#root` del DOM, envolviendo todo en `StrictMode` y `QueryClientProvider`.

---

### `src/App.tsx`

Define el router completo de la aplicación usando React Router v6. Contiene tres componentes internos:

- **`RequireAuth`**: guard que redirige al `/login` si el usuario no tiene token activo.
- **`RequireRole`**: guard que redirige a `/` si el usuario no posee ninguno de los roles requeridos por la ruta.
- **`DefaultRedirect`**: redirige al usuario a la página inicial correcta según sus roles: clientes van a `/catalogo`, ADMIN/PEDIDOS a `/admin/pedidos`, y STOCK a `/ingredientes`.

El componente principal `App` define el árbol de `Routes` con todas las rutas protegidas anidadas bajo el `Layout`.

---

### `src/types.ts`

Archivo de tipos principal que centraliza todas las interfaces TypeScript usadas en la aplicación. Incluye:

- Tipos de autenticación: `LoginResponse`, `UserPublic`
- Tipos del dominio: `Categoria`, `CategoriaTree`, `Ingrediente`, `UnidadMedida`, `Producto`
- Tipos para formularios: `CategoriaCreate`, `IngredienteCreate/Update`, `ProductoCreate/Update`
- Tipos de pedidos: `PedidoPublic`, `DetallePedidoPublic`, `HistorialEstadoPedidoPublic`
- Tipos de carrito: `CartItem`
- Tipos de dirección: `DireccionPublic`, `DireccionCreate/Update`
- Tipos de paginación: `PaginatedIngredientes`, `PaginatedProductos`, `PaginatedPedidos`
- Tipos de filtros: `FiltrosIngrediente`, `FiltrosProducto`

---

### `src/types/index.ts`

Módulo de tipos alternativo/legacy con un subconjunto de interfaces. Contiene versiones más simples de `Ingrediente`, `LoginRequest`, `TokenResponse` y `FiltrosIngrediente`. Existe por compatibilidad histórica; la fuente de verdad es `src/types.ts`.

---

## API Layer (`src/api/`)

Cada archivo de la capa API exporta funciones async que encapsulan las peticiones HTTP al backend. Todas usan la instancia `apiClient` de Axios configurada en `client.ts`.

### `src/api/client.ts`

Configura la instancia global de Axios (`apiClient`) con:
- `baseURL: '/'` para que el proxy de Vite redirija al backend.
- **Interceptor de request**: inyecta el `Authorization: Bearer <token>` del store en cada petición saliente.
- **Interceptor de response**: detecta errores 401 y ejecuta el flujo de renovación de token con el `refresh_token` almacenado en `sessionStorage`. Si la renovación falla, cierra la sesión y redirige al login. Implementa una cola de espera para peticiones concurrentes durante el refresh.

También exporta `saveRefreshToken`, `getRefreshToken` y `clearRefreshToken` para gestionar el refresh token en `sessionStorage`.

### `src/api/auth.ts`

- **`login(email, password)`**: llama a `POST /api/v1/auth/login`, decodifica el JWT para extraer el `sub` y los roles, obtiene los datos del usuario con `GET /api/v1/auth/me` y guarda todo en el auth store y el refresh token en sessionStorage.
- **`logout()`**: llama a `POST /api/v1/auth/logout` con el refresh token, luego limpia el store y sessionStorage.

### `src/api/categorias.ts`

CRUD completo de categorías:
- `fetchCategorias()` — GET paginado de categorías activas
- `fetchCategoriasAll()` — GET todas (activas + inactivas)
- `fetchCategoriasTree()` — GET árbol jerárquico completo
- `createCategoria(data)` — POST crear categoría
- `updateCategoria(id, data)` — PUT actualizar categoría
- `deleteCategoria(id)` — DELETE baja lógica
- `activateCategoria(id)` — POST reactivar categoría

### `src/api/ingredientes.ts`

CRUD completo de ingredientes más exportación Excel:
- `fetchIngredientes(filtros)` — GET paginado con filtros de nombre y alérgeno
- `fetchIngredientesAll()` — GET todos sin paginar
- `createIngrediente(data)` — POST crear ingrediente
- `updateIngrediente(id, data)` — PATCH actualización parcial
- `deleteIngrediente(id)` — DELETE baja lógica
- `activateIngrediente(id)` — POST reactivar
- `exportExcel()` — GET blob y descarga automática del archivo `.xlsx`
- `getExcelUrl()` — retorna la URL directa con token para descarga directa

### `src/api/productos.ts`

CRUD completo de productos más funciones de disponibilidad y exportación:
- `fetchProductos(filtros)` — GET paginado con filtros
- `fetchProductosAll()` — GET todos sin filtros
- `fetchProducto(id)` — GET detalle de un producto
- `createProducto(data)` — POST crear producto con ingredientes
- `updateProducto(id, data)` — PUT actualizar producto completo
- `updateStock(id, data)` — PATCH actualizar stock y disponibilidad
- `updateDisponibilidad(id, data)` — PATCH actualizar solo disponibilidad
- `deleteProducto(id)` — DELETE baja lógica
- `activateProducto(id)` — POST reactivar
- `exportProductosExcel()` — GET blob y descarga automática del `.xlsx`

### `src/api/pedidos.ts`

Gestión de pedidos:
- `createPedido(data)` — POST crear pedido desde el carrito
- `fetchPedidos(estado, page, page_size)` — GET listado paginado (para cliente: sus pedidos; para admin: todos)
- `fetchPedido(id)` — GET detalle de un pedido con historial
- `patchPedidoEstado(id, estado)` — PATCH cambiar estado (transición FSM)
- `cancelarPedido(id)` — POST cancelar pedido

### `src/api/direcciones.ts`

CRUD de direcciones de entrega del usuario:
- `fetchDirecciones()` — GET lista de direcciones del usuario autenticado
- `createDireccion(data)` — POST crear nueva dirección
- `updateDireccion(id, data)` — PUT actualizar dirección
- `deleteDireccion(id)` — DELETE eliminar dirección

### `src/api/unidades.ts`

CRUD de unidades de medida:
- `fetchUnidades()` — GET lista completa
- `fetchUnidad(id)` — GET detalle de una unidad
- `createUnidad(data)` — POST crear unidad
- `updateUnidad(id, data)` — PUT actualizar unidad
- `deleteUnidad(id)` — DELETE eliminar unidad

### `src/api/usuarios.ts`

Gestión de usuarios (requiere rol ADMIN):
- `fetchUsuarios()` — GET lista de todos los usuarios con sus roles
- `assignRole(userId, role)` — POST asignar un rol a un usuario
- `removeRole(userId, role)` — DELETE quitar un rol de un usuario

---

## Stores (`src/stores/`)

### `src/stores/authStore.ts`

Store de autenticación persistido en `localStorage` (clave `auth-storage`). Almacena el JWT, userId, email, nombre y array de roles del usuario. Expone:

- `setAuth(...)`: guarda los datos al iniciar sesión.
- `logout()`: limpia todo el estado.
- `isAuthenticated()`: retorna `true` si hay token activo.
- `isAdmin()`: retorna `true` si el usuario tiene el rol `ADMIN`.
- `hasRole(role)`: retorna `true` si el usuario posee el rol indicado.

### `src/stores/cartStore.ts`

Store del carrito de compras persistido en `localStorage` (clave `cart-storage`). Mantiene la lista de `CartItem` (producto + cantidad + personalizacion). Expone:

- `addItem(producto, cantidad, personalizacion)`: agrega un item o incrementa su cantidad si ya existe.
- `removeItem(productoId)`: elimina un item del carrito.
- `updateCantidad(productoId, cantidad)`: actualiza la cantidad; si es ≤ 0, elimina el item.
- `clearCart()`: vacía el carrito.
- `total()`: calcula el precio total sumando precio × cantidad de cada item.
- `itemCount()`: retorna la suma de cantidades de todos los items.

### `src/stores/uiStore.ts`

Store liviano de estado de la interfaz (no persistido). Controla si el drawer del carrito está abierto:

- `openCart()`: abre el drawer del carrito.
- `closeCart()`: cierra el drawer del carrito.
- `toggleCart()`: invierte el estado del drawer.

---

## Hooks (`src/hooks/`)

### `src/hooks/usePedidosWebSocket.ts`

Hook personalizado que establece y mantiene una conexión WebSocket al endpoint `/ws/pedidos`. Al recibir mensajes de tipo `NEW_PEDIDO` o `PEDIDO_UPDATED`, invalida automáticamente las queries de TanStack Query correspondientes (`pedidos`, `admin-pedidos`, `pedido-detalle`) para forzar la recarga de datos sin acción del usuario. Implementa reconexión automática cada 3 segundos si la conexión se pierde. El hook se limpia correctamente al desmontar el componente.

---

## Componentes (`src/components/`)

### `src/components/Layout.tsx`

Shell principal de la aplicación. Renderiza la barra de navegación superior con:
- Logo y nombre de la app (diferencia entre "Fast Food" para clientes y "Fast Food Admin" para staff).
- Links de navegación condicionales según el rol del usuario autenticado.
- Botón del carrito con badge de cantidad (solo para clientes).
- Avatar con la inicial del nombre del usuario y sus roles.
- Botón de cierre de sesión.
- El `<Outlet />` de React Router donde se renderizan las páginas hijas.
- El `<CarritoDrawer />` cuando el drawer está abierto.

### `src/components/CarritoDrawer.tsx`

Panel lateral derecho (drawer) que muestra los productos en el carrito. Permite:
- Ver nombre, precio unitario y cantidad de cada item.
- Incrementar o decrementar la cantidad de cada item.
- Eliminar un item del carrito.
- Ver el total del carrito.
- Navegar al checkout.
- Vaciar el carrito completo.

Se cierra al hacer clic en el overlay exterior.

### `src/components/CategoriaModal.tsx`

Modal de formulario para crear o editar una categoría. En modo edición pre-carga los datos actuales. Permite seleccionar una categoría padre de la lista (excluyendo la categoría que se está editando para evitar auto-referencia). Usa `useMutation` para crear (`POST`) o actualizar (`PUT`) e invalida el caché de queries al completar.

### `src/components/CategoriaTreeModal.tsx`

Modal que visualiza el árbol jerárquico completo de categorías en formato horizontal. Encuentra la raíz absoluta de la categoría seleccionada y renderiza el árbol completo con nodos expandibles/colapsables, líneas conectoras y el nodo seleccionado resaltado en verde. Expande automáticamente el camino desde la raíz hasta el nodo seleccionado al abrirse.

### `src/components/ConfirmDialog.tsx`

Diálogo de confirmación genérico y reutilizable para acciones destructivas (baja lógica, cancelación). Recibe el mensaje (puede ser JSX), el label del botón de confirmación, el color del botón (`danger` o `primary`) y callbacks para confirmar o cancelar. Muestra un spinner si la acción está en progreso.

### `src/components/IngredienteModal.tsx`

Modal de formulario para crear o editar un insumo/ingrediente. Campos: nombre (obligatorio), descripción con contador de caracteres, checkbox de alérgeno y cantidad de stock. El campo nombre y el checkbox de alérgeno están deshabilitados para el rol STOCK (solo ADMIN puede modificarlos). Usa `useMutation` y invalida el caché de queries al completar.

### `src/components/ProductoModal.tsx`

Modal de formulario completo para crear o editar un producto. Incluye: nombre, descripción, precio base, unidad de venta, URL de imagen, checkbox de disponibilidad, selección de categorías por checkbox, y gestión de ingredientes de receta con cantidad, unidad de medida y flag de removible. Muestra en tiempo real el stock máximo fabricable basado en el stock actual de cada ingrediente. Advierte visualmente si algún ingrediente no tiene stock suficiente.

### `src/components/ProductoStockModal.tsx`

Modal simplificado de gestión rápida de disponibilidad de un producto, diseñado para el rol STOCK. Solo permite cambiar el checkbox `disponible` sin acceder al formulario completo del producto.

---

## Páginas (`src/pages/`)

### `src/pages/LoginPage.tsx`

Página de inicio de sesión con formulario de email y contraseña. Llama a la función `login()` de la API, y en caso de éxito redirige a `/`. Muestra errores del backend en un bloque de alerta rojo. Diseño de tarjeta centrada sobre fondo oscuro degradado.

### `src/pages/CatalogoPage.tsx`

Catálogo de productos disponibles para clientes. Muestra una grilla de tarjetas (`ProductoCard`) con imagen o inicial, nombre, precio formateado en ARS, badges de alérgenos y botón "Agregar" que añade el producto al carrito y abre el drawer. Permite filtrar por nombre (con búsqueda en tiempo real con Enter) y categoría. Incluye paginación. Los productos sin stock o no disponibles muestran el botón deshabilitado.

### `src/pages/CheckoutPage.tsx`

Página de finalización del pedido para clientes. Divide la vista en dos columnas: a la izquierda los pasos (selección de dirección + forma de pago) y a la derecha el resumen del pedido con total. Permite seleccionar una dirección existente o crear una nueva con un formulario inline. Formas de pago disponibles: Efectivo y MercadoPago. Al confirmar, crea el pedido via API, limpia el carrito y redirige a "Mis Pedidos".

### `src/pages/MisPedidosPage.tsx`

Historial de pedidos del cliente con vista de detalle al costado. La lista muestra los pedidos paginados con estado coloreado. Al seleccionar uno, el panel derecho muestra los ítems, dirección de entrega, forma de pago, total y el historial de transiciones de estado. Permite cancelar pedidos en estado PENDIENTE o CONFIRMADO. Se actualiza en tiempo real via WebSocket.

### `src/pages/AdminPedidosPage.tsx`

Panel de administración de pedidos para los roles ADMIN y PEDIDOS. Muestra una tabla paginada de todos los pedidos del sistema con filtro por estado. Al seleccionar un pedido, el panel derecho muestra el detalle completo con cliente, productos, dirección, forma de pago, total, historial de estados (audit trail) y los botones de transición de la máquina de estados (FSM) según el estado actual. Se actualiza en tiempo real via WebSocket.

### `src/pages/IngredientesPage.tsx`

Gestión de insumos para los roles ADMIN y STOCK. Tabla completa con columnas de ID, nombre, descripción, stock, indicador de alérgeno, estado (activo/inactivo) y fecha de alta. Filtros por nombre y tipo alérgeno. Paginación con elipsis. El rol ADMIN puede crear, editar y dar de baja; el rol STOCK solo puede editar el stock. Exportación a Excel disponible para ambos roles. Los registros dados de baja se muestran con fondo rojo y opacidad reducida.

### `src/pages/ProductosPage.tsx`

Gestión de productos para los roles ADMIN y STOCK. Tabla completa con columnas de ID, nombre, descripción, precio, stock calculado, disponibilidad, estado y fecha de alta. Filtros por nombre, categoría y disponibilidad. Paginación con elipsis. El rol ADMIN puede crear, editar completo y dar de baja; el rol STOCK puede solo cambiar la disponibilidad via el modal rápido. Exportación a Excel disponible para ambos roles.

### `src/pages/CategoriasPage.tsx`

Gestión de categorías para el rol ADMIN. Tabla con columnas de ID, nombre, descripción, botón de árbol jerárquico, estado (activo/inactivo), indicador de uso y fecha de alta. Filtros por nombre. Paginación con elipsis. Permite crear, editar, dar de baja y reactivar categorías. Las categorías con relaciones jerárquicas muestran el botón "Ver árbol" que abre el `CategoriaTreeModal`. Las categorías en uso (asignadas a productos) no se pueden dar de baja y se muestran como "Bloqueado".

### `src/pages/AdminUsuariosPage.tsx`

Gestión de usuarios para el rol ADMIN. Tabla de todos los usuarios registrados con columnas de nombre, email y una columna de checkbox por cada rol disponible (ADMIN, STOCK, PEDIDOS, CLIENT). Al marcar o desmarcar un checkbox se asigna o elimina el rol inmediatamente via la API. El administrador no puede quitarse su propio rol ADMIN para proteger el acceso.

---

## Navegación por rol

| Ruta | CLIENT | STOCK | PEDIDOS | ADMIN |
|---|:---:|:---:|:---:|:---:|
| `/catalogo` | SI | — | — | SI |
| `/checkout` | SI | — | — | — |
| `/mis-pedidos` | SI | — | — | — |
| `/ingredientes` | — | SI | — | SI |
| `/productos` | — | SI | — | SI |
| `/categorias` | — | — | — | SI |
| `/usuarios` | — | — | — | SI |
| `/admin/pedidos` | — | — | SI | SI |

Al iniciar sesión, cada rol es redirigido automáticamente a su página de inicio por defecto:
- **CLIENT** → `/catalogo`
- **ADMIN** / **PEDIDOS** → `/admin/pedidos`
- **STOCK** → `/ingredientes`
