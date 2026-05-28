from datetime import datetime, timezone

from fastapi import HTTPException

from typing import Optional
from app.core.uow import UnitOfWork
from app.modules.categorias.model import (
    Categoria,
    CategoriaCreate,
    CategoriaPublic,
    CategoriaTree,
    CategoriaUpdate,
    PaginatedCategorias,
)


def _to_public(c: Categoria, uow: UnitOfWork) -> CategoriaPublic:
    """Convierte una Categoria en su representación pública indicando si está en uso."""
    in_use = uow.categorias.has_active_products(c.id) if c.id else False
    return CategoriaPublic(
        id=c.id,
        nombre=c.nombre,
        descripcion=c.descripcion,
        parent_id=c.parent_id,
        created_at=c.created_at,
        deleted_at=c.deleted_at,
        in_use=in_use,
    )


def list_categorias(
    parent_id: Optional[int],
    page: int,
    page_size: int,
    uow: UnitOfWork,
) -> PaginatedCategorias:
    """Retorna una página de categorías activas filtradas opcionalmente por padre."""
    with uow:
        items, total = uow.categorias.list_filtered(parent_id, page, page_size)
        public_items = [_to_public(c, uow) for c in items]
        pages = max(1, -(-total // page_size))
        return PaginatedCategorias(
            items=public_items,
            total=total,
            page=page,
            page_size=page_size,
            pages=pages,
        )


def list_categorias_all(uow: UnitOfWork) -> list[CategoriaPublic]:
    """Retorna todas las categorías incluyendo las eliminadas, para uso administrativo."""
    with uow:
        return [_to_public(c, uow) for c in uow.categorias.get_all()]


def get_tree(uow: UnitOfWork) -> list[CategoriaTree]:
    """Construye y retorna el árbol jerárquico de categorías activas."""
    with uow:
        cats = uow.categorias.get_all_active()
    nodes = {
        c.id: CategoriaTree(
            id=c.id,
            nombre=c.nombre,
            descripcion=c.descripcion,
            parent_id=c.parent_id,
        )
        for c in cats
    }
    roots = []
    for node in nodes.values():
        if node.parent_id and node.parent_id in nodes:
            nodes[node.parent_id].hijos.append(node)
        else:
            roots.append(node)
    return roots


def create_categoria(data: CategoriaCreate, uow: UnitOfWork) -> CategoriaPublic:
    """Crea una nueva categoría validando unicidad de nombre y existencia del padre."""
    with uow:
        if uow.categorias.get_by_nombre(data.nombre):
            raise HTTPException(status_code=409, detail="Ya existe una categoría con ese nombre")
        if data.parent_id:
            if not uow.categorias.get_by_id_active(data.parent_id):
                raise HTTPException(status_code=404, detail="Categoría padre no encontrada")
        cat = Categoria(
            nombre=data.nombre,
            descripcion=data.descripcion,
            parent_id=data.parent_id,
        )
        return _to_public(uow.categorias.add(cat), uow)


def update_categoria(cat_id: int, data: CategoriaUpdate, uow: UnitOfWork) -> CategoriaPublic:
    """Actualiza los campos de una categoría existente y retorna la versión actualizada."""
    with uow:
        cat = uow.categorias.get_by_id_active(cat_id)
        if not cat:
            raise HTTPException(status_code=404, detail="Categoría no encontrada")
        if data.nombre and data.nombre != cat.nombre and uow.categorias.get_by_nombre(data.nombre):
            raise HTTPException(status_code=409, detail="Ya existe una categoría con ese nombre")
        if data.nombre is not None:
            cat.nombre = data.nombre
        if data.descripcion is not None:
            cat.descripcion = data.descripcion
        if data.parent_id is not None:
            cat.parent_id = data.parent_id
        cat.updated_at = datetime.now(timezone.utc)
        return _to_public(uow.categorias.update(cat), uow)


def delete_categoria(cat_id: int, uow: UnitOfWork) -> None:
    """Elimina lógicamente una categoría si no tiene productos activos asociados."""
    with uow:
        cat = uow.categorias.get_by_id_active(cat_id)
        if not cat:
            existente = uow.categorias.get_by_id(cat_id)
            if existente and existente.deleted_at is not None:
                raise HTTPException(status_code=400, detail="La categoría ya está inactiva")
            raise HTTPException(status_code=404, detail="Categoría no encontrada")
        if uow.categorias.has_active_products(cat_id):
            raise HTTPException(
                status_code=409,
                detail="No se puede eliminar: la categoría tiene productos activos",
            )
        uow.categorias.soft_delete(cat)


def activate_categoria(cat_id: int, uow: UnitOfWork) -> CategoriaPublic:
    """Reactiva una categoría eliminada lógicamente y retorna su representación pública."""
    with uow:
        cat = uow.categorias.get_by_id(cat_id)
        if not cat:
            raise HTTPException(status_code=404, detail="Categoría no encontrada")
        if cat.deleted_at is None:
            raise HTTPException(status_code=400, detail="La categoría ya está activa")
        uow.categorias.activate(cat)
        return _to_public(cat, uow)
