# Utilidades de seguridad centralizadas.
#
# Responsabilidades:
#   - Hashing de contraseñas usando bcrypt (a través de passlib)
#   - Generación y validación de JWT (firma HS256 con python-jose)
#
# Motivación:
#   - Evitar duplicación de lógica de seguridad entre módulos
#   - Permitir reutilización (routers, seeds, tests, etc.)
#   - Mantener separación de capas

# Manejo de fechas para expiración de tokens (timezone-aware UTC)
from datetime import datetime, timedelta, timezone

# Librería para JWT (encode/decode + manejo de errores)
from jose import JWTError, jwt

# Contexto de hashing (abstracción sobre bcrypt)
from passlib.context import CryptContext

# Configuración central (SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES)
from app.core.config import settings


# ─────────────────────────────────────────────────────────────────────────────
# HASHING DE CONTRASEÑAS (bcrypt)
# ─────────────────────────────────────────────────────────────────────────────

# Configura el contexto de hashing:
# - "bcrypt" → algoritmo seguro para contraseñas
# - deprecated="auto" → permite migraciones futuras de algoritmo
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    # Recibe una contraseña en texto plano y devuelve su hash bcrypt.
    # bcrypt incluye salt automáticamente (cada hash del mismo input es distinto).
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    # Verifica si una contraseña en texto plano coincide con un hash almacenado.
    # Internamente extrae el salt del hash, recalcula y compara de forma segura
    # (protegido contra timing attacks).
    return pwd_context.verify(plain, hashed)


# ─────────────────────────────────────────────────────────────────────────────
# JWT (JSON Web Tokens)
# ─────────────────────────────────────────────────────────────────────────────

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    # Genera un JWT firmado con HS256.
    #
    # Parámetros:
    #   data: payload base (ej: {"sub": username, "role": role})
    #   expires_delta: override opcional del tiempo de expiración
    #
    # Retorna un token JWT firmado (string).

    # Copia defensiva del payload (evita mutación externa)
    to_encode = data.copy()

    # Define expiración: usa valor custom si viene, sino la config global
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    # Agrega claims estándar al payload
    to_encode.update({
        "type": "access",  # Distingue access vs refresh (buena práctica)
        "exp": expire      # Claim estándar JWT (expiración)
    })

    # Firma el token con la clave secreta usando HS256
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    # Decodifica y valida un JWT.
    #
    # Validaciones implícitas de jwt.decode():
    #   - Firma válida
    #   - Algoritmo permitido
    #   - Expiración (claim exp)
    #
    # Validación adicional:
    #   - "type" == "access" (evita usar refresh token como access)
    #
    # Retorna:
    #   dict  → payload válido
    #   None  → token inválido (cualquier error)

    try:
        # Decodifica y valida firma + expiración
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )

        # Validación de tipo de token (defensa extra contra reuso de tokens)
        if payload.get("type") != "access":
            return None

        return payload

    except JWTError:
        # Cualquier problema (firma inválida, expirado, formato incorrecto, etc.)
        return None
