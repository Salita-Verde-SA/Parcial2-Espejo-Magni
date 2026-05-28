import hashlib
import secrets
from datetime import datetime, timedelta, timezone

# pyrefly: ignore [missing-import]
import jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], bcrypt__rounds=12, deprecated="auto")


def hash_password(plain: str) -> str:
    """Genera el hash bcrypt de una contraseña en texto plano."""
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    """Verifica que una contraseña en texto plano coincida con su hash."""
    return pwd_context.verify(plain, hashed)


def create_access_token(user_id: int, roles: list[str]) -> str:
    """Crea un JWT de acceso con el ID de usuario y sus roles."""
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {
        "sub": str(user_id),
        "roles": roles,
        "type": "access",
        "exp": expire,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token() -> tuple[str, str]:
    """Genera un refresh token aleatorio y retorna el par (token_raw, hash_sha256)."""
    raw = secrets.token_hex(32)
    token_hash = hashlib.sha256(raw.encode()).hexdigest()
    return raw, token_hash


def hash_token(raw: str) -> str:
    """Retorna el hash SHA-256 de un token en texto plano."""
    return hashlib.sha256(raw.encode()).hexdigest()


def decode_access_token(token: str) -> dict | None:
    """Decodifica y valida un JWT de acceso, retornando el payload o None si es inválido."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "access":
            return None
        return payload
    except jwt.PyJWTError:
        return None
