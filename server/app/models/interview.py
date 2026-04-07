"""Interview ORM model."""

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class Interview(Base):
    __tablename__ = "interviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject = Column(String(255), nullable=False)
    difficulty = Column(String(20), nullable=True)
    status = Column(String(20), nullable=False, default="ongoing")
    total_questions = Column(Integer, nullable=False, default=0)
    overall_score = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    start_time = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    duration_minutes = Column(Integer, nullable=False, default=15)

    questions = relationship("Question", back_populates="interview", cascade="all, delete-orphan")
    answers = relationship("Answer", back_populates="interview", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Interview id={self.id} status={self.status}>"
