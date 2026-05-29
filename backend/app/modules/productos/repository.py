from datetime import datetime, timezone
from decimal import Decimal

from sqlmodel import Session, select

from app.core.base_repository import BaseRepository
from app.modules.productos.model import (
    Producto,
    ProductoCategoria,
    ProductoIngrediente,
)
from app.modules.ingredientes.model import Ingrediente


class ProductoRepository(BaseRepository[Producto]):
    def __init__(self, session: Session):
        super().__init__(Producto, session)

    def list_filtered(
        self,
        nombre: str = "",
        categoria_id: int | None = None,
        disponible: str = "",
        page: int = 1,
        page_size: int = 10,
    ) -> tuple[list[Producto], int]:
        stmt = select(Producto).where(Producto.deleted_at.is_(None))
        if nombre:
            stmt = stmt.where(Producto.nombre.ilike(f"%{nombre}%"))
        if disponible == "true":
            stmt = stmt.where(Producto.disponible.is_(True))
        elif disponible == "false":
            stmt = stmt.where(Producto.disponible.is_(False))
        if categoria_id:
            stmt = stmt.join(
                ProductoCategoria,
                ProductoCategoria.producto_id == Producto.id,
            ).where(ProductoCategoria.categoria_id == categoria_id)
        all_items = list(self.session.exec(stmt).all())
        total = len(all_items)
        offset = (page - 1) * page_size
        return all_items[offset : offset + page_size], total

    def get_by_id_active(self, producto_id: int) -> Producto | None:
        stmt = (
            select(Producto)
            .where(Producto.id == producto_id)
            .where(Producto.deleted_at.is_(None))
        )
        return self.session.exec(stmt).first()

    def get_all_active(self) -> list[Producto]:
        return list(
            self.session.exec(
                select(Producto).where(Producto.deleted_at.is_(None))
            ).all()
        )

    def get_all(self) -> list[Producto]:
        return list(self.session.exec(select(Producto)).all())

    def get_categoria_ids(self, producto_id: int) -> list[int]:
        stmt = select(ProductoCategoria.categoria_id).where(
            ProductoCategoria.producto_id == producto_id
        )
        return list(self.session.exec(stmt).all())

    def get_ingredientes(self, producto_id: int) -> list[dict]:
        pi_stmt = select(ProductoIngrediente).where(
            ProductoIngrediente.producto_id == producto_id
        )
        relaciones = list(self.session.exec(pi_stmt).all())
        
        if not relaciones:
            return []
        
        ing_ids = [r.ingrediente_id for r in relaciones]
        ing_stmt = select(Ingrediente).where(
            Ingrediente.id.in_(ing_ids),
            Ingrediente.deleted_at.is_(None)
        )
        ingredientes = {i.id: i for i in self.session.exec(ing_stmt).all()}
        
        from app.modules.unidades.model import UnidadMedida
        unidad_ids = list(set(r.unidad_medida_id for r in relaciones if r.unidad_medida_id))
        unidades = {}
        if unidad_ids:
            unid_stmt = select(UnidadMedida).where(UnidadMedida.id.in_(unidad_ids))
            for u in self.session.exec(unid_stmt).all():
                unidades[u.id] = u.simbolo
        
        result = []
        for rel in relaciones:
            ing = ingredientes.get(rel.ingrediente_id)
            if ing:
                cantidad = rel.cantidad
                cantidad_val = float(cantidad) if cantidad and float(cantidad) > 0 else 1.0
                result.append({
                    "id": ing.id,
                    "nombre": ing.nombre,
                    "es_alergeno": ing.es_alergeno,
                    "es_terminado": ing.es_terminado,
                    "cantidad": cantidad_val,
                    "unidad_medida_id": rel.unidad_medida_id,
                    "simbolo": unidades.get(rel.unidad_medida_id, ""),
                    "es_removible": rel.es_removible,
                    "stock_insumo": ing.stock_cantidad or 0,
                    "costo_unitario": float(ing.costo_unitario) if ing.costo_unitario else 0.0,
                })
        
        return result

    def set_categorias(self, producto_id: int, categoria_ids: list[int]) -> None:
        existing = self.session.exec(
            select(ProductoCategoria).where(
                ProductoCategoria.producto_id == producto_id
            )
        ).all()
        for pc in existing:
            self.session.delete(pc)
        self.session.flush()
        for cid in categoria_ids:
            self.session.add(
                ProductoCategoria(producto_id=producto_id, categoria_id=cid)
            )
        self.session.flush()

    def set_ingredientes(
        self, producto_id: int, ingredientes: list[dict]
    ) -> None:
        existing = self.session.exec(
            select(ProductoIngrediente).where(
                ProductoIngrediente.producto_id == producto_id
            )
        ).all()
        for pi in existing:
            self.session.delete(pi)
        self.session.flush()
        for ing in ingredientes:
            self.session.add(
                ProductoIngrediente(
                    producto_id=producto_id,
                    ingrediente_id=ing["ingrediente_id"],
                    cantidad=ing.get("cantidad", Decimal("1")),
                    unidad_medida_id=ing["unidad_medida_id"],
                    es_removible=ing.get("es_removible", False),
                )
            )
        self.session.flush()

    def soft_delete(self, producto: Producto) -> None:
        producto.deleted_at = datetime.now(timezone.utc)
        self.session.add(producto)
        self.session.flush()

    def get_by_id(self, producto_id: int) -> Producto | None:
        return self.session.get(Producto, producto_id)

    def activate(self, producto: Producto) -> None:
        producto.deleted_at = None
        self.session.add(producto)
        self.session.flush()

    def get_ingrediente_stocks(self, producto_id: int) -> list[tuple[int, int, float]]:
        stmt = (
            select(Ingrediente.id, Ingrediente.stock_cantidad, ProductoIngrediente.cantidad)
            .join(
                ProductoIngrediente,
                ProductoIngrediente.ingrediente_id == Ingrediente.id,
            )
            .where(ProductoIngrediente.producto_id == producto_id)
            .where(Ingrediente.deleted_at.is_(None))
        )
        rows = self.session.exec(stmt).all()
        result = []
        for ing_id, stock, cantidad in rows:
            if ing_id is not None:
                cantidad_necesaria = float(cantidad) if cantidad and float(cantidad) > 0 else 1.0
                result.append((ing_id, stock or 0, cantidad_necesaria))
        return result

    def get_ingrediente_costos(self, producto_id: int) -> Decimal:
        """Calcula el costo total del producto sumando (costo_unitario × cantidad) de cada ingrediente."""
        stmt = (
            select(Ingrediente.costo_unitario, ProductoIngrediente.cantidad)
            .join(
                ProductoIngrediente,
                ProductoIngrediente.ingrediente_id == Ingrediente.id,
            )
            .where(ProductoIngrediente.producto_id == producto_id)
            .where(Ingrediente.deleted_at.is_(None))
        )
        rows = self.session.exec(stmt).all()
        costo_total = Decimal("0")
        for costo, cantidad in rows:
            if costo and cantidad:
                costo_total += Decimal(str(costo)) * Decimal(str(cantidad))
        return costo_total