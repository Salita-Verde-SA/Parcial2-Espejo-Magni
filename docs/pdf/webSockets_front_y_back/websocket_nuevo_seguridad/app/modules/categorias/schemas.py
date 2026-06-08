# Esquemas Pydantic / SQLModel para el módulo de Categorías.
#
# Define los contratos de datos:
#   CategoriaCreate → entrada para crear
#   CategoriaUpdate → entrada para actualizar (parcial, todos opcionales)
#   CategoriaPublic → salida (respuesta HTTP)

from sqlmodel import SQLModel, Field


class CategoriaCreate(SQLModel):
    # Datos para crear una nueva categoría
    nombre:      str = Field(min_length=1, max_length=100)
    # descripción opcional, hasta 500 caracteres
    descripcion: str = Field(default="", max_length=500)


class CategoriaUpdate(SQLModel):
    # Datos para actualización parcial.
    # Todos los campos son opcionales (solo se envían los que cambian).
    nombre:      str | None = Field(default=None, min_length=1, max_length=100)
    descripcion: str | None = Field(default=None, max_length=500)


class CategoriaPublic(SQLModel):
    # Vista pública de la categoría en respuestas HTTP
    id:          int
    nombre:      str
    descripcion: str
