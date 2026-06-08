# Esquemas Pydantic / SQLModel para el módulo de Pedidos.
#
# Define los contratos de datos (entrada/salida) de la API de Pedidos:
#   PedidoCreate      → entrada para crear un pedido
#   PedidoPublic      → salida (respuesta HTTP)
#   PedidoEstadoUpdate → entrada para cambiar estado (FSM)

from sqlmodel import SQLModel, Field


class PedidoCreate(SQLModel):
    # Datos de entrada para crear un nuevo pedido
    descripcion: str        = Field(min_length=1, max_length=200)
    total:       float      = Field(default=0.0, ge=0.0)


class PedidoPublic(SQLModel):
    # Vista pública de un pedido en respuestas HTTP
    id:          int
    descripcion: str
    total:       float
    estado:      str
    usuario_id:  int | None


class PedidoEstadoUpdate(SQLModel):
    # Datos de entrada para avanzar el estado de un pedido en la FSM
    nuevo_estado: str        = Field(min_length=1, max_length=50)
    motivo:       str | None = Field(default=None, max_length=200)
