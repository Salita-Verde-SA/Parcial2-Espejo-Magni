from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Column, String
from sqlmodel import SQLModel, Field


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class RefreshToken(SQLModel, table=True):
    __tablename__ = "refresh_token"

    id: Optional[int] = Field(default=None, primary_key=True)
    usuario_id: int = Field(foreign_key="usuario.id", index=True)
    token_hash: str = Field(sa_column=Column(String(64), nullable=False, index=True))
    expires_at: datetime
    created_at: datetime = Field(default_factory=_utcnow)
    revoked_at: Optional[datetime] = Field(default=None)
