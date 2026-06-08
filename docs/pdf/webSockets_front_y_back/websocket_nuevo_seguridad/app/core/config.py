# Configuración centralizada leída desde variables de entorno.
#
# Usa pydantic-settings para leer automáticamente del archivo .env.
# Adopta el patrón de variables individuales de PostgreSQL con @computed_field
# para construir DATABASE_URL automáticamente.
#
# Variables requeridas en .env:
#   SECRET_KEY → clave para firmar JWT (mínimo 32 caracteres)
#
# Opcionales con defaults:
#   POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, POSTGRES_HOST, POSTGRES_PORT
#   ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES

from pydantic import computed_field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ─── Base de datos PostgreSQL ──────────────────────────────────────────
    # Valores por defecto para desarrollo local
    postgres_user:     str = "postgres"
    postgres_password: str = "password"
    postgres_db:       str = "seguridad_jwt_db"
    postgres_host:     str = "localhost"
    postgres_port:     int = 5432

    # @computed_field + @property:
    # Calcula dinámicamente la URL de conexión concatenando los campos individuales.
    # Se incluye en serialización (model_dump / JSON) gracias a @computed_field.
    @computed_field
    @property
    def DATABASE_URL(self) -> str:
        # Construye: postgresql://user:password@host:port/dbname
        return (
            f"postgresql://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    # ─── JWT ───────────────────────────────────────────────────────────────
    SECRET_KEY: str                    # Obligatorio — sin valor por defecto
    ALGORITHM:  str = "HS256"          # Algoritmo de firma HMAC-SHA256
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30  # Token expira en 30 minutos

    model_config = {
        "env_file":          ".env",         # Lee variables desde .env
        "env_file_encoding": "utf-8",
        "extra":             "ignore",       # Ignora variables extra (ej. DATABASE_URL literal)
    }


# Instancia global — importar desde aquí en toda la app.
# Las importaciones usan: from app.core.config import settings
settings = Settings()
