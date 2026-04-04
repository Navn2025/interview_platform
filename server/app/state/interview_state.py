
from typing import List, TypedDict, Optional, Annotated, Literal

# from pinecone import ServerlessSpec, 
class State(TypedDict):
    subject: str
    subject_description: Optional[str]
    query: Optional[str]
    difficulty: Optional[Literal['easy', 'medium', 'hard']]
    bloom_level: Optional[Literal['L1 - Remember', 'L2 - Understand', 'L3 - Apply', 'L4 - Analyze', 'L5 - Evaluate', 'L6 - Create', 'L7 - Innovate', 'Mixed']]
    n: Optional[int]
    # mode: Optional[Literal['theoretical', 'practical', 'coding', 'system_design']]
    variation_hint: Optional[str]
    variation_hints: Optional[List[str]]
    real_world_required: Optional[bool]
    enable_human_review: Optional[bool]
    human_answers: Optional[dict]
    evaluation_report: Optional[dict]
    retrieved_questions: List[dict]
    generated_questions: List[dict]