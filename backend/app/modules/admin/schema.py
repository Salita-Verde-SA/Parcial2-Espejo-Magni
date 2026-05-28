from pydantic import BaseModel
from typing import Dict

class DashboardData(BaseModel):
    total_pedidos: int
    total_productos: int
    total_usuarios: int
    pedidos_por_estado: Dict[str, int]
