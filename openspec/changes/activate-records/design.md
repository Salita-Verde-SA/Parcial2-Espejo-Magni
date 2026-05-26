# Design: Agregar botón para activar registros

## Arquitectura

### Backend - Endpoints a agregar

```
POST /api/v1/categorias/{id}/activate  → Activa categoría desactivada
POST /api/v1/productos/{id}/activate   → Activa producto desactivado
POST /api/v1/ingredientes/{id}/activate → Activa ingrediente desactivado
```

### Backend - Cambios en repository

Cada repository necesita un método `activate()`:

```python
def activate(self, entity: Model) -> None:
    entity.deleted_at = None
    self.session.add(entity)
    self.session.flush()
```

### Frontend - API functions

Agregar funciones en los archivos api:

```typescript
// api/categorias.ts
export async function activateCategoria(id: number): Promise<Categoria>

// api/productos.ts  
export async function activateProducto(id: number): Promise<Producto>

// api/ingredientes.ts
export async function activateIngrediente(id: number): Promise<Ingrediente>
```

### Frontend - UI changes

**En cada página de CRUD:**

1. **Detectar si está activo**:
   - Leer el campo `deleted_at` del modelo
   - Si `deleted_at` es `null` → activo
   - Si `deleted_at` no es `null` → inactivo

2. **Cambiar botones según estado**:

   | Estado | Botón 1 | Botón 2 |
   |--------|---------|---------|
   | Activo | Editar | Baja |
   | Inactivo | Activar | — (vacío) |

3. **Mostrar badge de estado**:
   - En la columna de estado, mostrar "Activo" / "Inactivo"

## Detalles de implementación

### Backend - Repository

```python
# En categoria/repository.py, producto/repository.py, ingrediente/repository.py
def activate(self, entity: T) -> None:
    """Reactiva un registro previamente desactivado."""
    entity.deleted_at = None
    self.session.add(entity)
    self.session.flush()
```

### Backend - Service

```python
# En categoria/service.py
def activate_categoria(cat_id: int, uow: UnitOfWork) -> CategoriaPublic:
    with uow:
        cat = uow.categorias.get_by_id(cat_id)  # Sin filtro de deleted_at
        if not cat:
            raise HTTPException(status_code=404, detail="Categoría no encontrada")
        uow.categorias.activate(cat)
        return _to_public(cat)
```

### Backend - Router

```python
@router.post(
    "/{cat_id}/activate",
    response_model=CategoriaPublic,
    dependencies=[Depends(require_roles(["ADMIN"]))],
)
def activate(cat_id: int, uow: Annotated[UnitOfWork, Depends(get_uow)]):
    return activate_categoria(cat_id, uow)
```

### Frontend - Cambio en tipos

Los tipos deben incluir `deleted_at`:

```typescript
// En types.ts - verificar que ya existe
interface Producto {
  // ... campos existentes
  deleted_at: string | null
}
```

### Frontend - Cambio en páginas

**ProductosPage.tsx ejemplo:**

```tsx
// Determinar si el producto está activo o inactivo
const isActive = prod.deleted_at === null

// En la columna de acciones:
{isAdmin && (
  <td>
    <div className="td-actions">
      {isActive ? (
        <>
          <button onClick={() => handleEdit(prod)}>Editar</button>
          <button onClick={() => setDeleteTarget(prod)}>Baja</button>
        </>
      ) : (
        <button onClick={() => activateMutation.mutate(prod.id)}>
          Activar
        </button>
      )}
    </div>
  </td>
)}
```

## Notas

- El get_by_id del repository debe poder buscar también registros eliminados para permitir activarlos
- Necesitamos un método `get_by_id_with_deleted` o agregar un parámetro `include_deleted` al get_by_id existente
- Las tablas deben mostrar el estado (activo/inactivo) claramente