# Modelo de datos de Pedido.
#
# Define la entidad física 'pedido' que se mapea directamente a la
# tabla correspondiente en la base de datos PostgreSQL utilizando SQLModel.

from sqlmodel import SQLModel, Field


class Pedido(SQLModel, table=True):
    # SQLModel con table=True genera la tabla 'pedido' automáticamente

    # Identificador único autoincremental (clave primaria)
    id:          int | None = Field(default=None, primary_key=True)
    # Contenido textual del pedido (descripción de los artículos)
    descripcion: str        = Field(default="")
    # Valor total de la venta del pedido
    total:       float      = Field(default=0.0)
    # Estado en el ciclo de vida del pedido (FSM).
    # Valores posibles: pendiente, confirmado, preparando, enviado, entregado, cancelado
    estado:      str        = Field(default="pendiente")
    # Clave foránea al usuario que creó/posee el pedido
    usuario_id:  int | None = Field(default=None, foreign_key="usuario.id")
