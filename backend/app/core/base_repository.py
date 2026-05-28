"""
Repositorio base genérico.

Provee operaciones CRUD fundamentales sobre cualquier modelo SQLModel.
Cada módulo hereda de BaseRepository[T] y puede agregar queries específicas.

Capa: Repository
Conoce a: Model, Session
NO conoce a: Service, Router
"""

from typing import TypeVar, Generic, Type

from sqlmodel import SQLModel, Session, select

T = TypeVar("T", bound=SQLModel)


class BaseRepository(Generic[T]):
    """Repositorio genérico con CRUD base."""

    def __init__(self, model: Type[T], session: Session):
        """Inicializa el repositorio con el modelo y la sesión de base de datos."""
        self.model = model
        self.session = session

    def get_by_id(self, entity_id: int) -> T | None:
        """Retorna la entidad con el ID indicado o None si no existe."""
        return self.session.get(self.model, entity_id)

    def get_all(self) -> list[T]:
        """Retorna todas las entidades del modelo."""
        return list(self.session.exec(select(self.model)).all())

    def add(self, entity: T) -> T:
        """Persiste una nueva entidad y retorna la instancia actualizada."""
        self.session.add(entity)
        self.session.flush()  # flush, no commit — el UoW hace commit
        self.session.refresh(entity)
        return entity

    def update(self, entity: T) -> T:
        """Actualiza una entidad existente y retorna la instancia refrescada."""
        self.session.add(entity)
        self.session.flush()
        self.session.refresh(entity)
        return entity

    def delete(self, entity: T) -> None:
        """Elimina permanentemente una entidad de la base de datos."""
        self.session.delete(entity)
        self.session.flush()
