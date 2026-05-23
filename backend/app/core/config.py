from pydantic import computed_field
# pyrefly: ignore [missing-import]
from pydantic_settings import BaseSettings
import os


class Settings(BaseSettings):
    postgres_user: str = "postgres"
    postgres_password: str = "password"
    postgres_db: str = "fastfood_db"
    postgres_host: str = "localhost"
    postgres_port: int = 5433

    @computed_field
    @property
    def DATABASE_URL(self) -> str:
        db_url = os.environ.get("DATABASE_URL")
        if db_url:
            return db_url
        return (
            f"postgresql://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    MP_ACCESS_TOKEN: str = ""
    MP_WEBHOOK_SECRET: str = ""

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


settings = Settings()