from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Session, select

from app.core.base_repository import BaseRepository
from app.modules.categorias.model import Categoria


class CategoriaRepository(BaseRepository[Categoria]):
    """Repositorio para operaciones de consulta y persistencia de categorías."""

    def __init__(self, session: Session):
        super().__init__(Categoria, session)

    def get_all_active(self) -> list[Categoria]:
        """Retorna todas las categorías que no han sido eliminadas lógicamente."""
        return list(
            self.session.exec(
                select(Categoria).where(Categoria.deleted_at.is_(None))
            ).all()
        )

    def get_all(self) -> list[Categoria]:
        """Retorna todas las categorías incluyendo las eliminadas lógicamente."""
        return list(self.session.exec(select(Categoria)).all())

    def get_by_id_active(self, cat_id: int) -> Categoria | None:
        """Retorna una categoría activa por ID o None si no existe o está eliminada."""
        return self.session.exec(
            select(Categoria)
            .where(Categoria.id == cat_id)
            .where(Categoria.deleted_at.is_(None))
        ).first()

    def get_by_nombre(self, nombre: str) -> Categoria | None:
        """Busca una categoría activa por nombre exacto."""
        return self.session.exec(
            select(Categoria)
            .where(Categoria.nombre == nombre)
            .where(Categoria.deleted_at.is_(None))
        ).first()

    def has_active_products(self, categoria_id: int) -> bool:
        """Verifica si la categoría tiene al menos un producto activo asociado."""
        from app.modules.productos.model import ProductoCategoria, Producto

        return (
            self.session.exec(
                select(ProductoCategoria)
                .join(Producto, ProductoCategoria.producto_id == Producto.id)
                .where(ProductoCategoria.categoria_id == categoria_id)
                .where(Producto.deleted_at.is_(None))
            ).first()
            is not None
        )

    def soft_delete(self, categoria: Categoria) -> None:
        """Marca la categoría como eliminada registrando la fecha de borrado lógico."""
        categoria.deleted_at = datetime.now(timezone.utc)
        self.session.add(categoria)
        self.session.flush()

    def get_by_id(self, cat_id: int) -> Categoria | None:
        """Retorna una categoría por ID sin filtrar por estado de eliminación."""
        return self.session.get(Categoria, cat_id)

    def activate(self, categoria: Categoria) -> None:
        """Reactiva una categoría eliminada lógicamente, limpiando su deleted_at."""
        categoria.deleted_at = None
        self.session.add(categoria)
        self.session.flush()

    def list_filtered(
        self,
        parent_id: Optional[int] = None,
        page: int = 1,
        page_size: int = 10,
    ) -> tuple[list[Categoria], int]:
        """Retorna una página de categorías activas, opcionalmente filtradas por categoría padre."""
        stmt = select(Categoria).where(Categoria.deleted_at.is_(None))
        if parent_id is not None:
            if parent_id == -1:
                stmt = stmt.where(Categoria.parent_id.is_(None))
            else:
                stmt = stmt.where(Categoria.parent_id == parent_id)
        
        stmt = stmt.order_by(Categoria.nombre.asc())
        all_items = list(self.session.exec(stmt).all())
        total = len(all_items)
        offset = (page - 1) * page_size
        return all_items[offset : offset + page_size], total
