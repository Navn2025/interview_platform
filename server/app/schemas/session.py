"""Pydantic schemas for interview session persistence."""

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ── Request schemas ──────────────────────────────────────────

class StartInterviewRequest(BaseModel):
    subject: str
    subject_description: Optional[str] = None
    query: Optional[str] = None
    difficulty: str = "medium"
    bloom_level: str = "L3 - Apply"
    n: int = Field(default=5, ge=1, le=20)
    real_world_required: bool = False


class SubmitAnswerRequest(BaseModel):
    interview_id: int
    question_id: int
    answer: str


# ── Nested response schemas ──────────────────────────────────

class QuestionOut(BaseModel):
    id: int
    question_text: str
    expected_answer: Optional[str] = None
    difficulty: Optional[str] = None
    order_index: int

    class Config:
        from_attributes = True


class AnswerOut(BaseModel):
    id: int
    question_id: int
    user_answer: str
    score: Optional[float] = None
    feedback: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── Top-level response schemas ───────────────────────────────

class StartInterviewResponse(BaseModel):
    interview_id: int
    status: str
    total_questions: int
    current_question: QuestionOut


class SubmitAnswerResponse(BaseModel):
    interview_id: int
    answered_question_id: int
    score: Optional[float] = None
    feedback: Optional[str] = None
    is_complete: bool
    next_question: Optional[QuestionOut] = None
    evaluation: Optional[Dict[str, Any]] = None


class InterviewDetailResponse(BaseModel):
    id: int
    subject: str
    difficulty: Optional[str] = None
    status: str
    total_questions: int
    overall_score: Optional[float] = None
    created_at: datetime
    questions: List[QuestionOut] = Field(default_factory=list)
    answers: List[AnswerOut] = Field(default_factory=list)

    class Config:
        from_attributes = True


# ── Schema aliases requested by user ─────────────────────────

class QuestionCreate(BaseModel):
    interview_id: int
    question_text: str
    expected_answer: Optional[str] = None
    difficulty: Optional[str] = None
    order_index: int = 0


class AnswerCreate(BaseModel):
    interview_id: int
    question_id: int
    user_answer: str
    score: Optional[float] = None
    feedback: Optional[str] = None


class AnswerResponse(AnswerOut):
    """Alias for AnswerOut with from_attributes support."""
    pass
