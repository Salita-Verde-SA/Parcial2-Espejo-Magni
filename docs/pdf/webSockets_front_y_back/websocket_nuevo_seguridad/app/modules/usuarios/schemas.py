# Esquemas Pydantic / SQLModel para el módulo de Usuarios.
#
# Define los contratos de datos:
#   UserCreate   → entrada para registro
#   UserPublic   → salida (oculta hashed_password)
#   Token        → respuesta del endpoint /token

from sqlmodel import SQLModel, Field
from pydantic import EmailStr


class UserCreate(SQLModel):
    # Datos requeridos para registrar un nuevo usuario
    username:  str                           # Nombre de usuario único
    full_name: str                           # Nombre completo visible
    email:     EmailStr                      # Email válido (validado por Pydantic)
    password:  str = Field(min_length=8)     # Mínimo 8 caracteres por seguridad


class UserPublic(SQLModel):
    # Vista pública del usuario — excluye hashed_password deliberadamente
    # para evitar exponer datos sensibles en respuestas HTTP
    id:        int
    username:  str
    full_name: str
    email:     str
    role:      str
    disabled:  bool


class Token(SQLModel):
    # Respuesta del endpoint /api/v1/auth/token
    access_token: str      # JWT firmado
    token_type:   str = "bearer"  # Tipo estándar OAuth2
    expires_in:   int      # Tiempo de vida en segundos
