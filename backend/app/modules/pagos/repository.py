from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Session, select

from app.core.base_repository import BaseRepository
from app.modules.pagos.model import Pago


class PagoRepository(BaseRepository[Pago]):
    def __init__(self, session: Session):
        super().__init__(Pago, session)

    def get_by_pedido(self, pedido_id: int) -> Optional[Pago]:
        stmt = select(Pago).where(Pago.pedido_id == pedido_id)
        return self.session.exec(stmt).first()

    def get_by_external_reference(self, external_reference: str) -> Optional[Pago]:
        stmt = select(Pago).where(Pago.external_reference == external_reference)
        return self.session.exec(stmt).first()

    def get_by_idempotency_key(self, key: str) -> Optional[Pago]:
        stmt = select(Pago).where(Pago.idempotency_key == key)
        return self.session.exec(stmt).first()

    def touch(self, pago: Pago) -> Pago:
        pago.updated_at = datetime.now(timezone.utc)
        return self.update(pago)
