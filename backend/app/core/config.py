from pydantic_settings import BaseSettings
from typing import List, Union
import os

class Settings(BaseSettings):
    # API Configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Maintenance Management"
    
    # Database Configuration
    DATABASE_URL: str = "mysql+pymysql://root:Admin%401234@localhost:3307/maintenance_db"
    
    # Security Configuration
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS Configuration
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "https://janssencmma.com",
        # Allow external access - you can specify specific IPs or use "*" for all origins
        "*",  # WARNING: Only use "*" in development. In production, specify exact origins.
    ]
    
    # File Upload Configuration
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB - allows high-quality images without compression
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
