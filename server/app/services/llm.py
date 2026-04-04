from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_huggingface import HuggingFaceEndpointEmbeddings
from app.core.config import get_settings

settings = get_settings()

llm=ChatGoogleGenerativeAI(
    model=settings.google_model_name
)
embeddings=HuggingFaceEndpointEmbeddings(
    model=settings.embeddings_model_name
)
question_llm = ChatGoogleGenerativeAI(
        model=settings.google_model_name,
        temperature=1.15,
        top_p=0.95,
    )