# Unit of Work del módulo Categorías.
# Expone el repositorio de categorías para operaciones atómicas.

from sqlmodel import Session
from app.core.unit_of_work import UnitOfWork
from app.modules.categorias.repository import CategoriaRepository


class CategoriaUnitOfWork(UnitOfWork):
    def __init__(self, session: Session) -> None:
        # Inicializa el UoW base y expone el repositorio de categorías
        super().__init__(session)
        self.categorias = CategoriaRepository(session)
