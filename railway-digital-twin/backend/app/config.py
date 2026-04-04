import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    database_url: str = "postgresql+asyncpg://railway:railway_secret@localhost:5432/railway_twin"
    redis_url: str = "redis://localhost:6379/0"
    jwt_secret: str = "change-me-to-a-random-secret-string"
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 60
    
    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()
