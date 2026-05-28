# Backend — FastFood API

API REST construida con **FastAPI** y **SQLModel** sobre PostgreSQL. Implementa autenticación JWT con refresh tokens, control de acceso por roles (RBAC), patrón Unit of Work + Repository, soft delete en todas las entidades, máquina de estados para pedidos y actualizaciones en tiempo real via WebSockets.

---

## Arquitectura en capas

```
Router  →  Service  →  Repository  →  Base de datos
  ↑                        ↑
Deps (auth/roles)       Unit of Work (transacción)
```

Cada módulo sigue la misma estructura:

| Archivo | Responsabilidad |
|---------|----------------|
| `model.py` | Tablas SQLModel + schemas de entrada/salida (Pydantic) |
| `repository.py` | Queries a la base de datos. Sin lógica de negocio |
| `service.py` | Lógica de negocio. Orquesta repositorios dentro de un UoW |
| `router.py` | Endpoints HTTP. Valida permisos, llama al service, retorna respuesta |

---

## Estructura de archivos

```
backend/
├── app/
│   ├── main.py
│   ├── core/
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── security.py
│   │   ├── deps.py
│   │   ├── uow.py
│   │   ├── base_repository.py
│   │   └── websockets.py
│   ├── modules/
│   │   ├── auth/
│   │   ├── usuarios/
│   │   ├── roles/
│   │   ├── categorias/
│   │   ├── unidades/
│   │   ├── ingredientes/
│   │   ├── productos/
│   │   ├── pedidos/
│   │   └── admin/
│   └── db/
│       ├── seed.py
│       └── migrations/
├── requirements.txt
├── Dockerfile
└── docker-entrypoint.sh
```

---

## Archivos raíz

### `docker-entrypoint.sh`
Script de inicio del contenedor Docker. Ejecuta el seed de la base de datos (`python -m app.db.seed`) y luego levanta el servidor Uvicorn en `0.0.0.0:8000`. Se ejecuta cada vez que arranca el contenedor.

### `Dockerfile`
Build en dos etapas: `builder` compila las dependencias de psycopg2 (requiere headers de C), `production` copia solo los binarios necesarios sobre una imagen slim. Reduce el tamaño final de la imagen.

### `requirements.txt`
Dependencias del proyecto:
- `fastapi[standard]` — framework web y servidor ASGI
- `sqlmodel` — ORM sobre SQLAlchemy + validación Pydantic
- `psycopg2-binary` — driver PostgreSQL
- `PyJWT` — generación y validación de JWT
- `passlib[bcrypt]` — hashing de contraseñas
- `openpyxl` — exportación a Excel
- `pydantic-settings` — configuración desde variables de entorno
- `pytest` / `pytest-asyncio` — testing

---

## `app/main.py`
Punto de entrada de la aplicación FastAPI.

- **Lifespan**: al arrancar llama a `create_all_tables()` para crear las tablas si no existen.
- **CORS**: permite requests desde `localhost` en cualquier puerto (desarrollo). En producción restringir `allow_origins`.
- **Routers**: registra los 8 módulos funcionales.
- **WebSocket** `/ws/pedidos`: acepta conexiones y las mantiene abiertas. El `ConnectionManager` les hace broadcast cuando cambia un pedido.
- **Health check** `GET /health`: retorna `{"status": "ok"}`. Lo usan los healthchecks de Docker Compose.

---

## `app/core/`

### `config.py`
Clase `Settings` con `pydantic-settings`. Lee variables de entorno (o `.env`). Expone:
- `DATABASE_URL` — conexión PostgreSQL
- `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `REFRESH_TOKEN_EXPIRE_DAYS` — configuración JWT
- `MERCADOPAGO_ACCESS_TOKEN` / `PUBLIC_KEY` — placeholders para integración de pagos

### `database.py`
- Crea el `engine` SQLModel con la `DATABASE_URL`.
- Provee `get_session()` como generador (usado por FastAPI Depends).
- `create_all_tables()`: importa todos los modelos para que SQLModel los registre y llama a `metadata.create_all()`. Los imports son necesarios; sin ellos las tablas no se crean.

### `security.py`
Funciones criptográficas puras (sin I/O):
- `hash_password(plain)` / `verify_password(plain, hashed)` — bcrypt vía passlib
- `create_access_token(user_id, roles)` — JWT HS256 con expiración configurable
- `create_refresh_token()` — genera un token aleatorio de 64 bytes y retorna `(raw, sha256_hash)`. Solo el hash se guarda en la BD; el raw va al cliente.
- `decode_token(token)` — decodifica y valida el JWT; lanza HTTPException 401 si es inválido o expirado

### `deps.py`
Dependencias FastAPI inyectables en los routers:
- `get_current_user(token)` — extrae el Bearer token del header `Authorization` o de la cookie `access_token`. Decodifica el JWT y devuelve `(usuario, roles)`.
- `get_current_active_user()` — llama a `get_current_user` y verifica que el usuario no esté deshabilitado (`disabled=False`).
- `require_roles(roles_permitidos)` — factory que retorna una dependencia FastAPI. Si el usuario no tiene ninguno de los roles requeridos lanza HTTP 403. Se usa en el decorador `@router.X(..., dependencies=[Depends(require_roles(["ADMIN"]))])`.

### `uow.py`
Implementa el patrón **Unit of Work**. Agrupa todos los repositorios bajo una única sesión SQLModel y garantiza atomicidad:

```python
with uow:
    uow.pedidos.add(pedido)
    uow.ingredientes.update(ingrediente)
    # Si cualquier línea lanza excepción → rollback automático
    # Si todo va bien → commit automático al salir del bloque
```

`get_uow()` es la dependencia FastAPI que provee una instancia por request.

### `base_repository.py`
Clase genérica `BaseRepository[T]`. Todos los repositorios de módulos la extienden. Provee:
- `get_by_id(id)` — busca por PK
- `get_all()` — todos los registros
- `add(entity)` — `session.add()` + `flush()`
- `update(entity)` — `session.add()` + `flush()`
- `delete(entity)` — `session.delete()` + `flush()`

Los repositorios específicos sobreescriben o agregan métodos según las necesidades del dominio.

### `websockets.py`
`ConnectionManager`: mantiene la lista de conexiones WebSocket activas.
- `connect(ws)` — acepta la conexión y la agrega a la lista
- `disconnect(ws)` — la elimina de la lista
- `broadcast(message: dict)` — serializa a JSON y envía a todas las conexiones activas. Si una conexión falla al enviar, se desconecta automáticamente.

La instancia `manager` es un singleton importado por el router de pedidos y por `main.py`.

---

## `app/modules/auth/`
Gestión de autenticación con JWT + refresh tokens.

### `model.py`
- `RefreshToken` — tabla que persiste el hash SHA-256 del refresh token, `usuario_id`, `expires_at` y `revoked_at`. Nunca se guarda el token en claro.

### `repository.py`
- `get_by_hash(hash)` — busca un refresh token válido (no revocado y no expirado)
- `revoke(token)` — setea `revoked_at = now()`
- `revoke_all_for_user(usuario_id)` — revoca todos los tokens del usuario (logout global)

### `service.py`
- `register_user(data)` — crea el usuario, hashea la contraseña, asigna rol CLIENT automáticamente
- `login_user(email, password)` — valida credenciales con bcrypt, genera access token + refresh token, persiste el hash del refresh
- `refresh_tokens(refresh_token_raw)` — valida que el hash exista y no esté revocado, revoca el token usado (rotación), emite un par nuevo
- `logout_user(refresh_token_raw)` — revoca el refresh token del cliente

### `router.py`
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/v1/auth/register` | POST | Registro. Retorna access token + refresh token |
| `/api/v1/auth/login` | POST | Login. Setea cookie `access_token` (HttpOnly) |
| `/api/v1/auth/refresh` | POST | Rota el refresh token y emite nuevos tokens |
| `/api/v1/auth/logout` | POST | Revoca el refresh token y borra la cookie |
| `/api/v1/auth/me` | GET | Datos del usuario autenticado |

---

## `app/modules/usuarios/`
Gestión de usuarios.

### `model.py`
- `Usuario` — tabla principal. Campos: `email`, `nombre`, `apellido`, `password_hash`, `disabled`, `deleted_at`. La relación con roles se maneja via `UsuarioRol`.
- Schemas de entrada: `UserRegister`, `UserLogin`, `UserUpdate`
- Schemas de salida: `UserPublic` (sin password_hash), `PaginatedUsuarios`
- `Token`, `TokenRefresh` — modelos de respuesta de auth

### `repository.py`
- `get_by_email(email)` — búsqueda por email (case insensitive)
- `get_roles(usuario_id)` — retorna lista de strings con los códigos de rol
- `assign_role(usuario_id, rol_codigo)` — inserta en `UsuarioRol` si no existe
- `remove_role(usuario_id, rol_codigo)` — elimina de `UsuarioRol`
- `list_filtered(rol, page, page_size)` — paginación con filtro opcional por rol
- `soft_delete(usuario)` — setea `deleted_at = now()`

### `service.py`
- `get_user_or_404(id)` — helper que lanza 404 si no encuentra el usuario
- `set_disabled(usuario_id, disabled)` — habilita/deshabilita un usuario sin borrarlo

### `router.py`
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/v1/usuarios/me` | PATCH | El usuario autenticado actualiza su propio perfil |

---

## `app/modules/roles/`

### `model.py`
- `Rol` — tabla con `codigo` como PK (e.g. `"ADMIN"`, `"CLIENT"`) y `descripcion`
- `UsuarioRol` — tabla de unión entre `Usuario` y `Rol`. Permite que un usuario tenga múltiples roles.

No tiene router propio; los roles se gestionan desde el módulo `admin`.

---

## `app/modules/categorias/`
Gestión de categorías jerárquicas (árbol padre-hijo).

### `model.py`
- `Categoria` — `nombre`, `descripcion`, `parent_id` (FK a sí misma para subcategorías), `deleted_at`
- `CategoriaPublic` — incluye flag `in_use` (tiene productos activos asignados)
- `CategoriaTree` — representación recursiva con campo `children: list[CategoriaTree]`

### `repository.py`
- `get_all_active()` — solo las no eliminadas
- `get_all()` — incluye eliminadas (para vista admin)
- `has_active_products(categoria_id)` — verifica si tiene productos activos antes de permitir eliminación
- `soft_delete(cat)` / `activate(cat)` — baja/alta lógica
- `list_filtered(nombre, parent_id, page, page_size)` — búsqueda paginada

### `service.py`
- `get_tree()` — construye el árbol jerárquico: trae todas las categorías activas y las organiza en nodos padre→hijos recursivamente
- CRUD completo con validaciones: no se puede eliminar una categoría con productos activos, no se pueden crear nombres duplicados

### `router.py`
| Endpoint | Método | Roles |
|----------|--------|-------|
| `GET /api/v1/categorias/` | Paginado | Público |
| `GET /api/v1/categorias/all` | Con eliminadas | ADMIN |
| `GET /api/v1/categorias/tree` | Árbol jerárquico | Público |
| `POST /api/v1/categorias/` | Crear | ADMIN |
| `PUT /api/v1/categorias/{id}` | Editar | ADMIN |
| `DELETE /api/v1/categorias/{id}` | Baja lógica | ADMIN |
| `POST /api/v1/categorias/{id}/activate` | Reactivar | ADMIN |

---

## `app/modules/unidades/`
Unidades de medida usadas en ingredientes y productos (gramos, litros, unidades, etc.).

### `model.py`
- `UnidadMedida` — `nombre`, `simbolo`, `tipo` (MASA / VOLUMEN / UNIDAD / AREA)
- Schemas CRUD estándar

### `repository.py`
- `get_all()` — ordenadas por tipo y nombre
- `exists_nombre_excluding(nombre, id)` / `exists_simbolo_excluding(simbolo, id)` — validación de unicidad al editar
- `is_used_in_productos(id)` / `is_used_in_recetas(id)` — previene eliminación si está en uso

### `service.py`
CRUD completo. Antes de eliminar verifica que la unidad no esté referenciada en ningún producto ni receta.

### `router.py`
Endpoints estándar GET/POST/PUT/DELETE. Mutaciones requieren rol ADMIN.

---

## `app/modules/ingredientes/`
Insumos del negocio con control de stock y flag de alérgeno.

### `model.py`
- `Ingrediente` — `nombre`, `descripcion`, `stock_cantidad` (int), `es_alergeno` (bool), `deleted_at`
- `IngredientePublic`, `IngredienteCreate`, `IngredienteUpdate`
- `PaginatedIngredientes`

### `repository.py`
- `list_filtered(nombre, es_alergeno, page, page_size)` — búsqueda con ILIKE en nombre y filtro por alérgeno
- `get_active_by_id(id)` — solo activos
- `exists_nombre_excluding(nombre, id)` — unicidad al editar
- `soft_delete(ing)` / `activate(ing)` — baja/alta lógica

### `service.py`
- `IngredienteService` — clase con instancia de UoW inyectada
- `export_excel()` — genera un archivo Excel en memoria con todos los ingredientes activos. Aplica estilos: cabecera en negrita con fondo oscuro, columnas auto-ajustadas, badge visual para alérgenos.

### `router.py`
| Endpoint | Método | Roles |
|----------|--------|-------|
| `GET /api/v1/ingredientes/export` | Excel | ADMIN |
| `GET /api/v1/ingredientes/` | Paginado | ADMIN, STOCK |
| `GET /api/v1/ingredientes/all` | Con eliminados | ADMIN, STOCK |
| `POST /api/v1/ingredientes/` | Crear | ADMIN |
| `PUT /api/v1/ingredientes/{id}` | Editar | ADMIN |
| `DELETE /api/v1/ingredientes/{id}` | Baja lógica | ADMIN |
| `POST /api/v1/ingredientes/{id}/activate` | Reactivar | ADMIN |

---

## `app/modules/productos/`
Módulo más complejo. Maneja productos con categorías (M:N), receta de ingredientes (M:N con cantidad y unidad), stock calculado y disponibilidad.

### `model.py`
- `Producto` — `nombre`, `precio_base` (Numeric 10,2), `unidad_venta_id`, `stock_cantidad`, `disponible`, `imagen_url`, `deleted_at`
- `ProductoCategoria` — tabla de unión producto↔categoría
- `ProductoIngrediente` — tabla de unión producto↔ingrediente con `cantidad` (Numeric 10,3), `unidad_medida_id` y `es_removible`
- `IngredienteCantidadInput` — schema para definir la receta al crear/editar un producto
- `ProductoPublic` — respuesta enriquecida: incluye `categorias: list[int]` e `ingredientes: list[IngredienteResumen]` con stock del insumo
- `StockUpdate`, `DisponibilidadUpdate` — schemas para actualizaciones parciales
- `PaginatedProductos`

### `repository.py`
- `list_filtered(nombre, categoria_id, disponible, include_deleted, page, page_size)` — query paginado con joins opcionales
- `get_categoria_ids(producto_id)` — retorna los IDs de categorías asignadas
- `get_ingredientes(producto_id)` — retorna los ingredientes de la receta con su stock actual
- `set_categorias(producto_id, categoria_ids)` — reemplaza todas las asignaciones de categorías
- `set_ingredientes(producto_id, ingredientes)` — reemplaza la receta completa
- `get_ingrediente_stocks(producto_id)` — calcula cuántas unidades del producto se pueden producir en base al stock de cada ingrediente
- `soft_delete(prod)` / `activate(prod)`

### `service.py`
- `calcular_stock_producto(producto_id, uow)` — stock efectivo = `min(stock_ingrediente / cantidad_en_receta)` para cada ingrediente. Si el producto no tiene receta usa `producto.stock_cantidad` directo.
- `validar_stock_ingredientes(ingredientes_input, uow)` — verifica que haya suficiente stock de cada ingrediente antes de confirmar un pedido.
- `_enrich(producto, uow)` — construye `ProductoPublic` con categorías e ingredientes completos.
- CRUD completo con validación de nombre único.
- `export_excel()` — Excel con todos los productos activos, precio formateado y columna de disponibilidad.
- `update_stock(id, data)` — actualiza `stock_cantidad` y `disponible`.
- `update_disponibilidad(id, data)` — actualiza solo `disponible`.

### `router.py`
| Endpoint | Método | Roles |
|----------|--------|-------|
| `GET /api/v1/productos/export` | Excel | ADMIN |
| `GET /api/v1/productos/` | Paginado | Público |
| `GET /api/v1/productos/all` | Con eliminados | ADMIN, STOCK |
| `POST /api/v1/productos/` | Crear | ADMIN |
| `PUT /api/v1/productos/{id}` | Editar completo | ADMIN |
| `DELETE /api/v1/productos/{id}` | Baja lógica | ADMIN |
| `POST /api/v1/productos/{id}/activate` | Reactivar | ADMIN |
| `PATCH /api/v1/productos/{id}/stock` | Actualizar stock | ADMIN, STOCK |
| `PATCH /api/v1/productos/{id}/disponibilidad` | Cambiar disponibilidad | ADMIN, STOCK |

---

## `app/modules/pedidos/`
Módulo central del negocio. Gestiona direcciones de entrega, pedidos, historial de estados y pagos.

### `model.py`
- `EstadoPedido` — tabla de referencia: `PENDIENTE`, `CONFIRMADO`, `EN_PREP`, `EN_CAMINO`, `ENTREGADO`, `CANCELADO`
- `FormaPago` — tabla de referencia: `EFECTIVO`, `MERCADOPAGO`, `TARJETA`
- `DireccionEntrega` — dirección del usuario con campos calle/número/piso/depto/ciudad/alias y flag `principal`
- `Pedido` — estado actual, forma de pago, dirección, total (Numeric 10,2), timestamps
- `DetallePedido` — línea de pedido. Almacena **snapshot** de `precio_unitario` y `producto_nombre` al momento de la compra (inmutable, no se ve afectado por ediciones futuras al producto)
- `HistorialEstadoPedido` — registro append-only de cada transición de estado: estado anterior, estado nuevo, fecha, usuario que realizó el cambio. **Nunca se actualiza ni elimina.**
- `PedidoCreate` — input de creación con `forma_pago_codigo`, `direccion_id` e `items`
- `EstadoPedidoUpdate` — input para avanzar el estado
- `PedidoPublic` — respuesta enriquecida con dirección completa, items y historial

### `repository.py`
- `DireccionRepository.get_all_active_by_user(usuario_id)` — direcciones activas del usuario
- `DireccionRepository.clear_principal_except(usuario_id, except_id)` — quita el flag `principal` de todas las direcciones del usuario excepto una (para asegurar solo una principal)
- `PedidoRepository.get_detalles(pedido_id)` — items del pedido
- `PedidoRepository.get_historial(pedido_id)` — historial de estados ordenado por fecha
- `PedidoRepository.list_filtered(usuario_id, estado_codigo, page, page_size)` — si `usuario_id` es None lista todos (admin); si tiene valor filtra por usuario (cliente)
- `EstadoPedidoRepository`, `FormaPagoRepository` — repositorios de tablas de referencia

### `service.py`
La lógica más crítica del sistema:

**`_deduct_stock_ingredientes(pedido_id, uow)`**
Al confirmar un pedido (transición `PENDIENTE → CONFIRMADO`), descuenta el stock de cada ingrediente según la receta de cada producto pedido. Si el producto no tiene receta, descuenta directamente del `stock_cantidad` del producto. Lanza HTTP 400 si hay stock insuficiente.

**`_restore_stock_ingredientes(pedido_id, uow)`**
Operación inversa. Se ejecuta cuando un pedido se cancela desde `CONFIRMADO`, `EN_PREP` o `EN_CAMINO`. Devuelve el stock a los ingredientes.

**`_do_update_estado(pedido_id, nuevo_estado, usuario_id, uow)`**
Máquina de estados finitos (FSM). Valida que la transición sea válida según el diccionario:
```
PENDIENTE   → CONFIRMADO, CANCELADO
CONFIRMADO  → EN_PREP, CANCELADO
EN_PREP     → EN_CAMINO, CANCELADO
EN_CAMINO   → ENTREGADO, CANCELADO
ENTREGADO   → (ninguno)
CANCELADO   → (ninguno)
```
Si la transición es válida: actualiza el estado, registra en `HistorialEstadoPedido`, ejecuta los side effects de stock.

**`create_pedido(usuario_id, data, uow)`**
Valida dirección, valida stock de ingredientes, calcula el total, crea el `Pedido` y los `DetallePedido` (con snapshot de precio y nombre), registra el primer historial `PENDIENTE`.

**`cancelar_pedido_cliente(pedido_id, usuario_id, uow)`**
Los clientes solo pueden cancelar si el pedido les pertenece y está en `PENDIENTE` o `CONFIRMADO`.

### `router.py`
| Endpoint | Método | Roles | Descripción |
|----------|--------|-------|-------------|
| `GET /api/v1/direcciones/` | GET | Autenticado | Mis direcciones |
| `POST /api/v1/direcciones/` | POST | Autenticado | Nueva dirección |
| `PUT /api/v1/direcciones/{id}` | PUT | Autenticado | Editar dirección |
| `DELETE /api/v1/direcciones/{id}` | DELETE | Autenticado | Eliminar dirección |
| `PATCH /api/v1/direcciones/{id}/principal` | PATCH | Autenticado | Marcar como principal |
| `GET /api/v1/pedidos/` | GET | Autenticado | Lista (filtrada por rol) |
| `POST /api/v1/pedidos/` | POST | Autenticado | Crear pedido → broadcast WS |
| `GET /api/v1/pedidos/{id}` | GET | Autenticado | Detalle del pedido |
| `PATCH /api/v1/pedidos/{id}/estado` | PATCH | ADMIN, PEDIDOS | Avanzar FSM → broadcast WS |
| `POST /api/v1/pedidos/{id}/cancelar` | POST | Autenticado | Cancelar (cliente) → broadcast WS |

Los tres endpoints que modifican un pedido llaman a `manager.broadcast()` para notificar a todos los clientes WebSocket conectados.

---

## `app/modules/admin/`
Gestión de usuarios y roles para administradores.

### `service.py`
- `list_usuarios_admin(rol, page, page_size, uow)` — lista paginada de usuarios con filtro opcional por rol. Enriquece cada usuario con su lista de roles.
- `update_usuario_admin(usuario_id, data, uow)` — actualiza nombre, apellido o email. Valida que el email no esté en uso por otro usuario.
- `delete_usuario_admin(usuario_id, uow)` — soft delete. No permite eliminar al propio usuario autenticado.

### `router.py`
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `GET /api/v1/admin/usuarios` | GET | Lista paginada con filtro por rol |
| `PUT /api/v1/admin/usuarios/{id}` | PUT | Editar datos del usuario |
| `DELETE /api/v1/admin/usuarios/{id}` | DELETE | Baja lógica del usuario |
| `POST /api/v1/admin/usuarios/{id}/roles/{rol}` | POST | Asignar rol al usuario |
| `DELETE /api/v1/admin/usuarios/{id}/roles/{rol}` | DELETE | Quitar rol al usuario |

Todos los endpoints requieren rol `ADMIN`.

---

## `app/db/seed.py`
Población inicial de la base de datos. **Es idempotente**: usa una función `_upsert()` que inserta el registro solo si no existe (busca por campo clave antes de insertar), por lo que puede ejecutarse múltiples veces sin duplicar datos.

Crea en orden (respetando FK):

1. **Roles**: `ADMIN`, `STOCK`, `PEDIDOS`, `CLIENT`
2. **Estados de pedido**: los 6 estados del FSM
3. **Formas de pago**: `EFECTIVO`, `MERCADOPAGO`, `TARJETA`
4. **Unidades de medida**: gramos, kilogramos, mililitros, litros, unidades, porciones, tazas
5. **Categorías**: Hamburguesas, Bebidas, Postres, Combos, Ensaladas
6. **Ingredientes**: 12 insumos con stock inicial y flags de alérgeno correctos
7. **Usuarios de prueba**:
   - `admin@fastfood.com` / `admin123` → ADMIN
   - `stock@fastfood.com` / `stock123` → STOCK
   - `pedidos@fastfood.com` / `pedidos123` → PEDIDOS
   - `cliente@fastfood.com` / `cliente123` → CLIENT
8. **Productos**: 6 productos con recetas (ingredientes + cantidades), categorías asignadas y stock inicial

---

## Patrones de diseño aplicados

### Soft Delete
Todas las entidades de negocio tienen `deleted_at: Optional[datetime]`. En lugar de borrar filas, se setea esta fecha. Las queries usan `.where(Entidad.deleted_at == None)` para filtrar activos. Permite recuperar registros y mantener integridad referencial.

### Snapshot en DetallePedido
`DetallePedido` guarda `precio_unitario` y `producto_nombre` en el momento de la compra. Si después se edita el producto (precio o nombre), el historial de pedidos no se ve afectado.

### Historial append-only
`HistorialEstadoPedido` solo tiene INSERTs. Nunca se hace UPDATE ni DELETE sobre esta tabla. Es un audit trail inmutable.

### Unit of Work
El contexto `with uow:` garantiza que todas las operaciones dentro del bloque sean atómicas. Si cualquier línea lanza una excepción, el `__exit__` hace rollback automático. Evita estados inconsistentes (ej: pedido creado pero stock no descontado).

### Rotación de refresh tokens
Cada vez que se usa un refresh token para obtener nuevos tokens, el token anterior se revoca y se emite uno nuevo. Previene el reuso de tokens robados.
