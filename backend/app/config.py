from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):

    # Database
    DATABASE_URL: str = ""

    # JWT
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # App
    APP_NAME: str = "Healix"
    DEBUG: bool = True
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    # Email
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )

    @property
    def allowed_origins_list(self) -> List[str]:
        return [
            o.strip()
            for o in self.ALLOWED_ORIGINS.split(",")
        ]


settings = Settings()