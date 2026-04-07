from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.auth import router as auth_router
from app.api.routes.health import router as health_router
from app.api.routes.interview import router as interview_router

app = FastAPI(
    title="Question Agent Backend",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(interview_router, prefix="/api")


@app.on_event("startup")
def on_startup():
    from app.db.base import Base  # noqa: F401
    from app.db.session import engine
    Base.metadata.create_all(bind=engine)


@app.get("/")
def read_root() -> dict:
    return {"service": "question-agent-backend", "status": "running"}