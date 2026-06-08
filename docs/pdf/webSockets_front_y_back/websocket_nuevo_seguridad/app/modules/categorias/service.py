# Service de Categoría — lógica de negocio.
#
# Stateless, orquesta operaciones sobre los repositorios a través del UoW.
# Lanza HTTPException. No hace commit/rollback directamente.
#
# Capa: Service
# Conoce a: UoW, Repository (indirectamente vía UoW)
# NO conoce a: Router

from fastapi import HTTPException, status
from sqlmodel import Session

from app.modules.categorias.models import Categoria
from app.modules.categorias.schemas import CategoriaCreate, CategoriaUpdate, CategoriaPublic
from app.modules.categorias.unit_of_work import CategoriaUnitOfWork


class CategoriaService:
    # Lógica de negocio para CRUD de categorías

    def __init__(self, session: Session) -> None:
        # Recibe la sesión de BD inyectada por FastAPI
        self._session = session

    def list_all(self) -> list[CategoriaPublic]:
        # Lista todas las categorías sin filtros
        with CategoriaUnitOfWork(self._session) as uow:
            categorias = uow.categorias.get_all()
            # Convierte modelos SQLModel a esquemas Pydantic (serialización)
            result = [CategoriaPublic.model_validate(c) for c in categorias]
        return result

    def get_by_id(self, categoria_id: int) -> CategoriaPublic:
        # Obtiene una categoría por ID. Lanza 404 si no existe.
        with CategoriaUnitOfWork(self._session) as uow:
            categoria = uow.categorias.get_by_id(categoria_id)
            if not categoria:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Categoría no encontrada",
                )
            result = CategoriaPublic.model_validate(categoria)
        return result

    def create(self, cat_in: CategoriaCreate) -> CategoriaPublic:
        # Crea una nueva categoría. Valida que el nombre sea único.
        with CategoriaUnitOfWork(self._session) as uow:
            # Verifica unicidad del nombre antes de crear
            if uow.categorias.get_by_nombre(cat_in.nombre):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Ya existe una categoría con ese nombre",
                )
            # Convierte el esquema de entrada a modelo y lo persiste
            categoria = Categoria.model_validate(cat_in)
            uow.categorias.add(categoria)
            result = CategoriaPublic.model_validate(categoria)
        return result

    def update(self, categoria_id: int, cat_in: CategoriaUpdate) -> CategoriaPublic:
        # Actualización parcial de una categoría (PATCH)
        with CategoriaUnitOfWork(self._session) as uow:
            categoria = uow.categorias.get_by_id(categoria_id)
            if not categoria:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Categoría no encontrada",
                )

            # exclude_unset=True → solo incluye los campos enviados en el request
            update_data = cat_in.model_dump(exclude_unset=True)

            # Si se actualiza el nombre, verificar que no haya duplicados
            if "nombre" in update_data:
                if uow.categorias.exists_nombre_excluding(
                    update_data["nombre"], categoria_id
                ):
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="Ya existe una categoría con ese nombre",
                    )

            # Aplica cada campo actualizado al modelo existente
            for key, value in update_data.items():
                setattr(categoria, key, value)

            uow.categorias.update(categoria)
            result = CategoriaPublic.model_validate(categoria)
        return result

    def delete(self, categoria_id: int) -> None:
        # Elimina una categoría por ID. Lanza 404 si no existe.
        with CategoriaUnitOfWork(self._session) as uow:
            categoria = uow.categorias.get_by_id(categoria_id)
            if not categoria:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Categoría no encontrada",
                )
            uow.categorias.delete(categoria)
