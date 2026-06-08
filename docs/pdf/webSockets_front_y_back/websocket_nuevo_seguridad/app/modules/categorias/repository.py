# Repositorio de Categoría.
#
# Acceso a BD: queries sin lógica de negocio.
# Hereda de BaseRepository[Categoria] y agrega queries específicas.
#
# Capa: Repository
# Conoce a: Model (Categoria), Session
# NO conoce a: Service, Router

from sqlmodel import Session, select

from app.core.base_repository import BaseRepository
from app.modules.categorias.models import Categoria


class CategoriaRepository(BaseRepository[Categoria]):

    def __init__(self, session: Session):
        # Inicializa el repositorio base con el modelo Categoria
        super().__init__(Categoria, session)

    def get_by_nombre(self, nombre: str) -> Categoria | None:
        # Busca una categoría por su nombre exacto (único)
        # Se usa en create para validar que no haya duplicados
        return self.session.exec(
            select(Categoria).where(Categoria.nombre == nombre)
        ).first()

    def exists_nombre_excluding(self, nombre: str, exclude_id: int) -> bool:
        # Verifica si existe OTRA categoría con el mismo nombre
        # (excluyendo la categoría con ID = exclude_id)
        # Se usa en update para validar unicidad del nuevo nombre
        result = self.session.exec(
            select(Categoria).where(
                Categoria.nombre == nombre,
                Categoria.id != exclude_id,
            )
        ).first()
        return result is not None
