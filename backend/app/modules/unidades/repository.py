from datetime import datetime, timezone

from sqlmodel import Session, select

from app.core.base_repository import BaseRepository
from app.modules.unidades.model import UnidadMedida


class UnidadMedidaRepository(BaseRepository[UnidadMedida]):
    def __init__(self, session: Session):
        super().__init__(UnidadMedida, session)

    def get_all(self) -> list[UnidadMedida]:
        """Get all unidades ordenadas por tipo y nombre."""
        return list(
            self.session.exec(
                select(UnidadMedida).order_by(UnidadMedida.tipo, UnidadMedida.nombre)
            ).all()
        )

    def get_by_id(self, unidad_id: int) -> UnidadMedida | None:
        return self.session.get(UnidadMedida, unidad_id)

    def get_by_nombre(self, nombre: str) -> UnidadMedida | None:
        return self.session.exec(
            select(UnidadMedida).where(UnidadMedida.nombre == nombre)
        ).first()

    def get_by_simbolo(self, simbolo: str) -> UnidadMedida | None:
        return self.session.exec(
            select(UnidadMedida).where(UnidadMedida.simbolo == simbolo)
        ).first()

    def exists_nombre_excluding(self, nombre: str, exclude_id: int) -> bool:
        return (
            self.session.exec(
                select(UnidadMedida)
                .where(UnidadMedida.nombre == nombre)
                .where(UnidadMedida.id != exclude_id)
            ).first()
            is not None
        )

    def exists_simbolo_excluding(self, simbolo: str, exclude_id: int) -> bool:
        return (
            self.session.exec(
                select(UnidadMedida)
                .where(UnidadMedida.simbolo == simbolo)
                .where(UnidadMedida.id != exclude_id)
            ).first()
            is not None
        )

    def is_used_in_productos(self, unidad_id: int) -> bool:
        from app.modules.productos.model import Producto

        return (
            self.session.exec(
                select(Producto)
                .where(Producto.unidad_venta_id == unidad_id)
                .where(Producto.deleted_at.is_(None))
            ).first()
            is not None
        )

    def is_used_in_recetas(self, unidad_id: int) -> bool:
        from app.modules.productos.model import ProductoIngrediente

        return (
            self.session.exec(
                select(ProductoIngrediente)
                .where(ProductoIngrediente.unidad_medida_id == unidad_id)
            ).first()
            is not None
        )