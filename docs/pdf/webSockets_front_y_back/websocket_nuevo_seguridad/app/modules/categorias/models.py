# Modelo de Categoría — tabla 'categoria' en PostgreSQL.
#
# CRUD simple protegido por JWT.
# Cualquier usuario autenticado puede leer; crear/editar/borrar requiere auth.

from sqlmodel import SQLModel, Field


class Categoria(SQLModel, table=True):
    # SQLModel con table=True genera la tabla 'categoria' automáticamente

    id:          int | None = Field(default=None, primary_key=True)
    # nombre único con índice para búsquedas rápidas y validación de unicidad
    nombre:      str        = Field(index=True, unique=True)
    # descripción opcional del contenido de la categoría
    descripcion: str        = Field(default="")
