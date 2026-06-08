# Router CRUD de Categorías.
#
# HTTP puro: parsear request, validar schema Pydantic, delegar al Service,
# serializar response con response_model. No contiene lógica de negocio.
#
# Capa: Router
# Conoce a: Service (vía UoW)
# NO conoce a: Repository, Model (solo esquemas para response_model)

from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlmodel import Session

from app.core.database import get_session
from app.core.deps import get_current_active_user
from app.modules.usuarios.schemas import UserPublic
from app.modules.categorias.schemas import CategoriaCreate, CategoriaUpdate, CategoriaPublic
from app.modules.categorias.service import CategoriaService

# Router con prefijo /api/v1/categorias
router = APIRouter(prefix="/api/v1/categorias", tags=["categorias"])


def get_categoria_service(session: Session = Depends(get_session)) -> CategoriaService:
    # Factory: inyecta la sesión de BD en el service
    return CategoriaService(session)


@router.get("/", response_model=list[CategoriaPublic])
def list_categorias(
    _user: Annotated[UserPublic, Depends(get_current_active_user)],
    svc: CategoriaService = Depends(get_categoria_service),
):
    # GET /api/v1/categorias — lista todas las categorías
    # Requiere autenticación (cualquier rol activo)
    return svc.list_all()


@router.get("/{categoria_id}", response_model=CategoriaPublic)
def get_categoria(
    categoria_id: int,
    _user: Annotated[UserPublic, Depends(get_current_active_user)],
    svc: CategoriaService = Depends(get_categoria_service),
):
    # GET /api/v1/categorias/{id} — obtiene una categoría por ID
    return svc.get_by_id(categoria_id)


@router.post("/", response_model=CategoriaPublic, status_code=status.HTTP_201_CREATED)
def create_categoria(
    cat_in: CategoriaCreate,
    _user: Annotated[UserPublic, Depends(get_current_active_user)],
    svc: CategoriaService = Depends(get_categoria_service),
):
    # POST /api/v1/categorias — crea una nueva categoría
    return svc.create(cat_in)


@router.patch("/{categoria_id}", response_model=CategoriaPublic)
def update_categoria(
    categoria_id: int,
    cat_in: CategoriaUpdate,
    _user: Annotated[UserPublic, Depends(get_current_active_user)],
    svc: CategoriaService = Depends(get_categoria_service),
):
    # PATCH /api/v1/categorias/{id} — actualiza parcialmente una categoría
    return svc.update(categoria_id, cat_in)


@router.delete("/{categoria_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_categoria(
    categoria_id: int,
    _user: Annotated[UserPublic, Depends(get_current_active_user)],
    svc: CategoriaService = Depends(get_categoria_service),
):
    # DELETE /api/v1/categorias/{id} — elimina una categoría
    # Retorna 204 No Content (sin body)
    svc.delete(categoria_id)
