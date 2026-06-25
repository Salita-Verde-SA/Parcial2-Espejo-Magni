from pydantic import BaseModel
from typing import Optional

class PagoCreate(BaseModel):
    pedido_id: int

class PagoResponse(BaseModel):
    init_point: str

class PagoConfirmar(BaseModel):
    pedido_id: int
