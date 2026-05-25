from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Session, select

from app.core.base_repository import BaseRepository
from app.modules.categorias.model import Categoria


class CategoriaRepository(BaseRepository[Categoria]):
    def __init__(self, session: Session):
        super().__init__(Categoria, session)

    def get_all_active(self) -> list[Categoria]:
        return list(
            self.session.exec(
                select(Categoria).where(Categoria.deleted_at.is_(None))
            ).all()
        )

    def get_all(self) -> list[Categoria]:
        """Obtener TODAS las categorías incluyendo eliminadas (para vista de admin)."""
        return list(self.session.exec(select(Categoria)).all())

    def get_by_id_active(self, cat_id: int) -> Categoria | None:
        return self.session.exec(
            select(Categoria)
            .where(Categoria.id == cat_id)
            .where(Categoria.deleted_at.is_(None))
        ).first()

    def get_by_nombre(self, nombre: str) -> Categoria | None:
        return self.session.exec(
            select(Categoria)
            .where(Categoria.nombre == nombre)
            .where(Categoria.deleted_at.is_(None))
        ).first()

    def has_active_products(self, categoria_id: int) -> bool:
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
        categoria.deleted_at = datetime.now(timezone.utc)
        self.session.add(categoria)
        self.session.flush()

    def get_by_id(self, cat_id: int) -> Categoria | None:
        """Obtener categoría por ID sin filtrar por deleted_at."""
        return self.session.get(Categoria, cat_id)

    def activate(self, categoria: Categoria) -> None:
        """Reactiva una categoría previamente desactivada."""
        categoria.deleted_at = None
        self.session.add(categoria)
        self.session.flush()

    def list_filtered(
        self,
        parent_id: Optional[int] = None,
        page: int = 1,
        page_size: int = 10,
    ) -> tuple[list[Categoria], int]:
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
