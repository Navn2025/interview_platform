from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field


class InterviewRequest(BaseModel):
    subject: str
    subject_description: Optional[str] = None
    query: Optional[str] = None
    difficulty: Literal["easy", "medium", "hard"] = "medium"
    bloom_level: Literal[
        "L1 - Remember",
        "L2 - Understand",
        "L3 - Apply",
        "L4 - Analyze",
        "L5 - Evaluate",
        "L6 - Create",
        "L7 - Innovate",
        "Mixed",
    ] = "L3 - Apply"
    n: int = Field(default=5, ge=1, le=20)
    real_world_required: bool = False
    enable_human_review: bool = False
    human_answers: Dict[str, str] = Field(default_factory=dict)


class InterviewResponse(BaseModel):
    query: Optional[str] = None
    retrieved_questions: List[dict] = Field(default_factory=list)
    generated_questions: List[dict] = Field(default_factory=list)
    evaluation_report: Dict[str, Any] = Field(default_factory=dict)
