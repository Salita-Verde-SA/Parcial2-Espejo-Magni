from datetime import datetime
from typing import Optional

from sqlalchemy import func
from sqlmodel import Session, select, col

from app.core.base_repository import BaseRepository
from app.modules.ingredientes.model import Ingrediente


class IngredienteRepository(BaseRepository[Ingrediente]):
    """Repositorio para operaciones de consulta y persistencia de ingredientes."""

    def __init__(self, session: Session):
        super().__init__(Ingrediente, session)

    def list_filtered(
        self,
        nombre:      Optional[str],
        es_alergeno: Optional[bool],
        page:        int,
        page_size:   int,
    ) -> tuple[list[Ingrediente], int]:
        """Retorna una página de ingredientes activos filtrados por nombre o condición de alérgeno."""
        stmt = select(Ingrediente).where(Ingrediente.deleted_at == None)  # noqa: E711

        if nombre:
            stmt = stmt.where(col(Ingrediente.nombre).ilike(f"%{nombre}%"))
        if es_alergeno is not None:
            stmt = stmt.where(Ingrediente.es_alergeno == es_alergeno)

        all_items = list(self.session.exec(stmt.order_by(Ingrediente.nombre)).all())
        total = len(all_items)
        offset = (page - 1) * page_size
        paginated = all_items[offset : offset + page_size]

        return paginated, total

    def get_active_by_id(self, entity_id: int) -> Optional[Ingrediente]:
        """Retorna un ingrediente activo por ID o None si no existe o está eliminado."""
        return self.session.exec(
            select(Ingrediente).where(
                Ingrediente.id == entity_id,
                Ingrediente.deleted_at == None,  # noqa: E711
            )
        ).first()

    def get_by_nombre(self, nombre: str) -> Optional[Ingrediente]:
        """Busca un ingrediente activo por nombre exacto."""
        return self.session.exec(
            select(Ingrediente).where(
                Ingrediente.nombre == nombre,
                Ingrediente.deleted_at == None,  # noqa: E711
            )
        ).first()

    def exists_nombre_excluding(self, nombre: str, exclude_id: int) -> bool:
        """Verifica si existe otro ingrediente activo con el mismo nombre excluyendo el ID dado."""
        result = self.session.exec(
            select(Ingrediente).where(
                Ingrediente.nombre == nombre,
                Ingrediente.id != exclude_id,
                Ingrediente.deleted_at == None,  # noqa: E711
            )
        ).first()
        return result is not None

    def soft_delete(self, ingrediente: Ingrediente) -> Ingrediente:
        """Marca el ingrediente como eliminado lógicamente y retorna la instancia actualizada."""
        ingrediente.deleted_at = datetime.utcnow()
        self.session.add(ingrediente)
        self.session.flush()
        self.session.refresh(ingrediente)
        return ingrediente

    def get_all_active(self) -> list[Ingrediente]:
        """Retorna todos los ingredientes activos ordenados por nombre."""
        return list(self.session.exec(
            select(Ingrediente)
            .where(Ingrediente.deleted_at == None)  # noqa: E711
            .order_by(Ingrediente.nombre)
        ).all())

    def get_all(self) -> list[Ingrediente]:
        """Retorna todos los ingredientes incluyendo eliminados, ordenados por nombre."""
        return list(self.session.exec(
            select(Ingrediente).order_by(Ingrediente.nombre)
        ).all())

    def get_by_id(self, entity_id: int) -> Optional[Ingrediente]:
        """Retorna un ingrediente por ID sin filtrar por estado de eliminación."""
        return self.session.get(Ingrediente, entity_id)

    def activate(self, ingrediente: Ingrediente) -> Ingrediente:
        """Reactiva un ingrediente eliminado lógicamente limpiando su deleted_at."""
        ingrediente.deleted_at = None
        self.session.add(ingrediente)
        self.session.flush()
        self.session.refresh(ingrediente)
        return ingrediente
