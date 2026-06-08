# Repositorio base genérico.
#
# Provee operaciones CRUD fundamentales sobre cualquier modelo SQLModel.
# Cada módulo hereda de BaseRepository[T] y agrega queries específicas.
#
# Capa: Repository
# Conoce a: Model, Session
# NO conoce a: Service, Router
#
# T es un TypeVar que se reemplaza por el modelo concreto al heredar.
# Ejemplo: class UsuarioRepository(BaseRepository[Usuario])

from typing import TypeVar, Generic, Type

from sqlmodel import SQLModel, Session, select

# TypeVar genérico: T debe ser una subclase de SQLModel (tabla)
T = TypeVar("T", bound=SQLModel)


class BaseRepository(Generic[T]):
    # Repositorio genérico con CRUD base para cualquier modelo

    def __init__(self, model: Type[T], session: Session):
        self.model = model     # La clase del modelo (no una instancia)
        self.session = session # Sesión de BD inyectada

    def get_by_id(self, entity_id: int) -> T | None:
        # Busca por clave primaria. Retorna None si no existe.
        return self.session.get(self.model, entity_id)

    def get_all(self) -> list[T]:
        # SELECT * FROM tabla. Retorna lista vacía si no hay registros.
        return list(self.session.exec(select(self.model)).all())

    def add(self, entity: T) -> T:
        # INSERT. Usa flush en lugar de commit (el UoW se encarga del commit).
        # Refresh actualiza el objeto con valores generados por BD (ej: id autoincremental).
        self.session.add(entity)
        self.session.flush()
        self.session.refresh(entity)
        return entity

    def update(self, entity: T) -> T:
        # UPDATE. session.add() en SQLModel hace upsert.
        self.session.add(entity)
        self.session.flush()
        self.session.refresh(entity)
        return entity

    def delete(self, entity: T) -> None:
        # DELETE. Elimina la entidad de la sesión (pendiente de flush).
        self.session.delete(entity)
        self.session.flush()
