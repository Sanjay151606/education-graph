from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    supabase_url: str = ""
    supabase_key: str = ""
    supabase_jwt_secret: str = ""
    database_url: str = "sqlite:///./braingraph.db"

    jwt_secret_key: str = ""
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    openai_api_key: str = ""
    ai_provider: str = "openai"

    environment: str = "development"
    cors_origins: str = "http://localhost:5173"

    @property
    def effective_jwt_secret(self) -> str:
        return self.supabase_jwt_secret or self.jwt_secret_key

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
