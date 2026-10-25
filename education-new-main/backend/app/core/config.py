import os
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Supabase Postgres Connection
    # Format: postgresql://postgres.zfyfhkhkxzgfencllpgv:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
    database_url: str = "sqlite:///./braingraph.db"

    # JWT / Auth Configuration
    secret_key: str = "dev-jwt-secret-key-change-in-production"
    jwt_secret_key: str = ""
    algorithm: str = "HS256"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # AI Configuration
    openai_api_key: str = ""
    ai_provider: str = "openai"

    # Application
    environment: str = "development"
    cors_origins: Union[str, List[str]] = "http://localhost:5173,http://127.0.0.1:5173"

    @property
    def effective_jwt_secret(self) -> str:
        return self.secret_key or self.jwt_secret_key

    @property
    def cors_origins_list(self) -> List[str]:
        if isinstance(self.cors_origins, list):
            return self.cors_origins
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )


settings = Settings()
