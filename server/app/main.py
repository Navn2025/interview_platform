from fastapi import FastAPI

from app.api.routes.health import router as health_router
from app.api.routes.interview import router as interview_router

app = FastAPI(
    title="Question Agent Backend",
    version="1.0.0",
)

app.include_router(health_router, prefix="/api")
app.include_router(interview_router, prefix="/api")


@app.get("/")
def read_root() -> dict:
    return {"service": "question-agent-backend", "status": "running"}