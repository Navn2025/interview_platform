import os
from functools import lru_cache

from typing import Optional
from dotenv import load_dotenv
from pydantic import BaseModel, Field

load_dotenv()


class Settings(BaseModel):
    app_name: str = "Question Agent Backend"
    app_env: str = Field(default_factory=lambda: os.getenv("APP_ENV", "development"))
    pinecone_api_key: Optional[str] = Field(default_factory=lambda: os.getenv("PINECONE_API_KEY"))
    pinecone_index_name: str = Field(default_factory=lambda: os.getenv("PINECONE_INDEX_NAME", "qdataset"))
    google_model_name: str = Field(default_factory=lambda: os.getenv("GOOGLE_MODEL_NAME", "gemini-3.1-flash-lite-preview"))
    embeddings_model_name: str = Field(default_factory=lambda: os.getenv("EMBEDDINGS_MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2"))
    database_url: str = Field(default_factory=lambda: os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/interview_platform"))
    secret_key: Optional[str] = Field(default_factory=lambda: os.getenv("SECRET_KEY"))
    algorithm: str = Field(default_factory=lambda: os.getenv("ALGORITHM", "HS256"))
    access_token_expire_minutes: int = Field(default_factory=lambda: int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")))
    google_client_id: Optional[str] = Field(default_factory=lambda: os.getenv("GOOGLE_CLIENT_ID"))
    google_client_secret: Optional[str] = Field(default_factory=lambda: os.getenv("GOOGLE_CLIENT_SECRET"))
    frontend_url: str = Field(default_factory=lambda: os.getenv("FRONTEND_URL", "http://localhost:5173"))


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    settings = Settings()
    if not settings.secret_key:
        raise RuntimeError("SECRET_KEY not set")
    return settings
