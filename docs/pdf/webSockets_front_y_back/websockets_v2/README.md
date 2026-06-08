# Restaurant Order System — Frontend

SPA React para la gestión de pedidos de restaurante en tiempo real mediante WebSockets. Construida con React 19, TypeScript, Vite 8 y Tailwind CSS v4.

## Stack

| Tecnología | Versión | Uso |
|---|---|---|
| React | 19 | UI y estado local |
| TypeScript | 6 | Tipado estático |
| Vite | 8 | Bundler y dev server |
| Tailwind CSS | 4 | Estilos (vite plugin, sin postcss) |
| React Router | 7 | Enrutado SPA |
| Zustand | 5 | Estado global (auth) |

## Requisitos previos

- Node.js 20+
- pnpm (recomendado) o npm
- Backend FastAPI corriendo en `http://localhost:8000`

## Instalación y desarrollo

```bash
pnpm install
pnpm dev
```

La app queda disponible en `http://localhost:5173`.

```bash
pnpm build      # Build de producción
pnpm preview    # Previsualizar el build
pnpm lint       # ESLint
```

## Arquitectura

```
src/
├── api/               # Funciones fetch hacia la API REST
│   ├── authApi.ts
│   └── pedidosApi.ts
├── components/
│   └── layout/        # AppLayout (nav + outlet), AuthLayout
├── hooks/
│   └── useWebSocket.ts  # Hook WS con reconexión + backoff exponencial
├── modules/
│   ├── auth/          # Login, Register
│   ├── dashboard/     # Dashboard por rol
│   ├── pedidos/       # ClientePage, CajeroPage, KdsPage
│   └── admin/         # AdminPage (gestión de todos los pedidos)
├── router/
│   ├── AppRouter.tsx  # Definición de rutas
│   └── ProtectedRoute.tsx
├── stores/
│   └── useAuthStore.ts  # Zustand: usuario autenticado
└── types/
    └── api.ts         # Tipos compartidos (PedidoEstado, UserRole, etc.)
```

## Roles y páginas

| Rol | Páginas accesibles |
|---|---|
| `user` | Dashboard, `/pedidos/cliente` |
| `pedidos` | Dashboard, `/pedidos/cliente`, `/pedidos/cajero`, `/pedidos/kds` |
| `cocina` | Dashboard, `/pedidos/cliente`, `/pedidos/kds` |
| `admin` | Todo lo anterior + `/admin` |

## WebSocket

La conexión WS se establece en `ws://localhost:8000/api/v1/cocina/ws`. La cookie httpOnly de JWT se envía automáticamente en el handshake — no requiere headers adicionales.

El hook `useWebSocket` gestiona:
- **Reconexión automática** con backoff exponencial (`1s → 2s → 4s … máx 30s`)
- **Evento sintético `WS_CONNECTED`** emitido al abrirse el socket para que las páginas recarguen datos y re-suscriban pedidos activos
- **Compatibilidad con React StrictMode** (cierra limpiamente si el socket está en estado `CONNECTING`)

### Eventos entrantes

| Evento | Descripción |
|---|---|
| `NUEVO_PEDIDO` | Un cliente creó un pedido nuevo |
| `PEDIDO_CONFIRMADO` | Cajero confirmó un pedido |
| `PEDIDO_EN_PREPARACION` | Pedido enviado a cocina |
| `PEDIDO_LISTO` | Cocina marcó el pedido como listo |
| `PEDIDO_ENTREGADO` | Cajero entregó el pedido |
| `PEDIDO_CANCELADO` | Pedido cancelado |

### Suscripción a pedidos individuales

```json
{ "action": "subscribe", "order_id": 42 }
```

## FSM de estados de pedido

```
pendiente → confirmado → preparando → listo → entregado
     ↓            ↓
  cancelado    cancelado
```

| Transición | Rol habilitado |
|---|---|
| `pendiente → confirmado` | `pedidos`, `admin` |
| `confirmado → preparando` | `pedidos`, `admin` |
| `preparando → listo` | `cocina`, `admin` |
| `listo → entregado` | `pedidos`, `admin` |
| `* → cancelado` | `pedidos`, `admin` |

## Variables de entorno

No se necesitan variables de entorno para desarrollo local. La URL base de la API y del WS están definidas directamente en `src/api/` y `src/hooks/useWebSocket.ts`. Para producción, refactorizar usando `import.meta.env.VITE_API_URL`.
