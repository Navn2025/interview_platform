import os
from functools import lru_cache

from dotenv import load_dotenv
from pydantic import BaseModel, Field

load_dotenv()


class Settings(BaseModel):
    app_name: str = "Question Agent Backend"
    app_env: str = Field(default_factory=lambda: os.getenv("APP_ENV", "development"))
    pinecone_api_key: str | None = Field(default_factory=lambda: os.getenv("PINECONE_API_KEY"))
    pinecone_index_name: str = Field(default_factory=lambda: os.getenv("PINECONE_INDEX_NAME", "qdataset"))
    google_model_name: str = Field(default_factory=lambda: os.getenv("GOOGLE_MODEL_NAME", "gemini-3.1-flash-lite-preview"))
    embeddings_model_name: str = Field(default_factory=lambda: os.getenv("EMBEDDINGS_MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2"))


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
