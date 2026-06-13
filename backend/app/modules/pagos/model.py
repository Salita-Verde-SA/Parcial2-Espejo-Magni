"""
Modelo de Pago (v7) — registro de transacciones MercadoPago.

Capa: Model. Sin imports de capas superiores.
"""
from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional

from sqlalchemy import Column, Numeric
from sqlmodel import SQLModel, Field


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Pago(SQLModel, table=True):
    __tablename__ = "pago"

    id: Optional[int] = Field(default=None, primary_key=True)
    pedido_id: int = Field(foreign_key="pedido.id", index=True)
    # Datos devueltos por MercadoPago
    mp_payment_id: Optional[int] = Field(default=None, unique=True)
    mp_status: str = Field(default="pending", max_length=30)
    mp_status_detail: Optional[str] = Field(default=None, max_length=100)
    transaction_amount: Decimal = Field(sa_column=Column(Numeric(10, 2), nullable=False))
    payment_method_id: Optional[str] = Field(default=None, max_length=50)
    # external_reference = referencia del pedido enviada a MP (mapea webhook → pedido)
    external_reference: str = Field(unique=True, max_length=100)
    # idempotency_key (UUID generado por backend) evita cobros duplicados por reintento
    idempotency_key: str = Field(unique=True, max_length=100)
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)


class PagoRead(SQLModel):
    id: int
    pedido_id: int
    mp_payment_id: Optional[int] = None
    mp_status: str
    mp_status_detail: Optional[str] = None
    transaction_amount: Decimal
    payment_method_id: Optional[str] = None
    external_reference: str
    created_at: datetime
