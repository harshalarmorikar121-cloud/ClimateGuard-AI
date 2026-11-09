import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "ClimateGuard AI"
    PROJECT_VERSION: str = "2.0.0"
    ENVIRONMENT: str = "production"
    
    # Database
    DATABASE_URL: str = "sqlite:///./climateguard.db"
    
    # Security & JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "climateguard-ai-super-secret-key-change-in-production-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8000",
        "*"
    ]
    
    # Notification & SMTP
    SMTP_HOST: str = os.getenv("SMTP_HOST", "")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    EMAIL_FROM: str = os.getenv("EMAIL_FROM", "alerts@climateguard.org")
    
    # Caching
    CACHE_TTL_MINUTES: int = 15

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
