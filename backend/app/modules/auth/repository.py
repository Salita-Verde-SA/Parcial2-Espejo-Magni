from datetime import datetime, timezone

from sqlmodel import Session, select

from app.core.base_repository import BaseRepository
from app.modules.auth.model import RefreshToken


class RefreshTokenRepository(BaseRepository[RefreshToken]):
    """Repositorio para operaciones de persistencia de refresh tokens."""

    def __init__(self, session: Session):
        super().__init__(RefreshToken, session)

    def get_by_hash(self, token_hash: str) -> RefreshToken | None:
        """Busca un refresh token por su hash SHA-256."""
        stmt = select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        return self.session.exec(stmt).first()

    def revoke(self, token: RefreshToken) -> None:
        """Marca un refresh token como revocado registrando la fecha actual."""
        token.revoked_at = datetime.now(timezone.utc)
        self.session.add(token)
        self.session.flush()

    def revoke_all_for_user(self, usuario_id: int) -> None:
        """Revoca todos los refresh tokens activos de un usuario."""
        now = datetime.now(timezone.utc)
        tokens = self.session.exec(
            select(RefreshToken)
            .where(RefreshToken.usuario_id == usuario_id)
            .where(RefreshToken.revoked_at.is_(None))
        ).all()
        for t in tokens:
            t.revoked_at = now
            self.session.add(t)
        self.session.flush()
