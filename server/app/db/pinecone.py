import os
from functools import lru_cache

from langchain_pinecone import PineconeVectorStore
from pinecone import Pinecone
from app.core.config import get_settings
from app.services.llm import embeddings


@lru_cache(maxsize=1)
def get_vector_store() -> PineconeVectorStore:
    settings = get_settings()
    pinecone_api_key = settings.pinecone_api_key or os.getenv("PINECONE_API_KEY")
    if not pinecone_api_key:
        raise ValueError("PINECONE_API_KEY is not set.")

    pc = Pinecone(api_key=pinecone_api_key)
    index = pc.Index(settings.pinecone_index_name)
    return PineconeVectorStore(index=index, embedding=embeddings)