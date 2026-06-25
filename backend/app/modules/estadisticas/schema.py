from decimal import Decimal
from pydantic import BaseModel


class ResumenResponse(BaseModel):
    ventas_hoy: Decimal
    ticket_promedio: Decimal
    pedidos_activos: int
    ventas_mes: Decimal


class VentasPeriodoItem(BaseModel):
    periodo: str
    total_ventas: Decimal
    cantidad_pedidos: int


class ProductoTopItem(BaseModel):
    producto_id: int
    nombre: str
    cantidad_vendida: int
    ingresos: Decimal


class PedidosEstadoItem(BaseModel):
    estado_codigo: str
    cantidad: int


class IngresosFormaPagoItem(BaseModel):
    forma_pago_codigo: str
    total: Decimal
    cantidad: int
