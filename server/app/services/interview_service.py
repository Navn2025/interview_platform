"""Business logic for persisted interview sessions.

Orchestrates the AI pipeline with database persistence:
  route → service → repository (DB) + AI services (LLM)
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

from anyio import to_thread
from fastapi import HTTPException, status
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

from app.models.question import Question as QuestionModel
from app.repositories import interview_repository as repo
from app.schemas.interview import InterviewRequest
from app.schemas.session import QuestionOut
from app.services.answer_evaluation import evaluate_human_answers


# ── AI pipeline helpers ──────────────────────────────────────

def _build_graph_state(
    subject: str,
    subject_description: Optional[str],
    query: Optional[str],
    difficulty: str,
    bloom_level: str,
    n: int,
    real_world_required: bool,
) -> Dict[str, Any]:
    return {
        "subject": subject,
        "subject_description": subject_description,
        "query": query,
        "difficulty": difficulty,
        "bloom_level": bloom_level,
        "n": n,
        "real_world_required": real_world_required,
        "enable_human_review": False,
        "human_answers": {},
        "retrieved_questions": [],
        "generated_questions": [],
    }


async def _run_graph(state: Dict[str, Any]) -> Dict[str, Any]:
    from app.graph.interview_graph import graph

    return await to_thread.run_sync(graph.invoke, state)


async def _run_evaluation(
    questions: List[dict], answers: Dict[str, str]
) -> Dict[str, Any]:
    eval_state = {"generated_questions": questions, "human_answers": answers}
    result = await to_thread.run_sync(evaluate_human_answers, eval_state)
    return result.get("evaluation_report", {})


def is_interview_expired(interview) -> bool:
    """Centralized utility to accurately check timestamp expiration block"""
    if not interview.start_time:
        return False
    if interview.status in ["expired", "completed"]:
        return True
    ends_at = interview.start_time + timedelta(minutes=interview.duration_minutes)
    return datetime.now(timezone.utc) > ends_at


# ── Public service functions ─────────────────────────────────

async def start_interview(
    db: Session,
    subject: str,
    subject_description: Optional[str],
    query: Optional[str],
    difficulty: str,
    bloom_level: str,
    n: int,
    real_world_required: bool,
    user_id: Optional[int] = None,
) -> Tuple[int, List[QuestionModel]]:
    """Generate questions via AI, persist interview + questions, return DB records."""

    graph_state = _build_graph_state(
        subject=subject,
        subject_description=subject_description,
        query=query,
        difficulty=difficulty,
        bloom_level=bloom_level,
        n=n,
        real_world_required=real_world_required,
    )
    result = await _run_graph(graph_state)
    generated = result.get("generated_questions", [])

    if not generated:
        raise ValueError("AI pipeline produced no questions.")

    # Run blocking DB interactions in threadpool
    interview = await run_in_threadpool(
        repo.create_interview,
        db=db,
        subject=subject,
        difficulty=difficulty,
        total_questions=len(generated),
        user_id=user_id,
    )

    db_questions = await run_in_threadpool(
        repo.save_questions_bulk,
        db=db,
        interview_id=interview.id,
        questions_data=generated,
    )

    return interview.id, db_questions


async def submit_answer(
    db: Session,
    interview_id: int,
    question_id: int,
    user_answer: str,
    user_id: int,
) -> Tuple[bool, Optional[QuestionModel], Optional[Dict[str, Any]]]:
    """Save an answer. If interview is complete, run evaluation and return results.

    Returns:
        (is_complete, next_question_or_None, evaluation_or_None)
    """
    interview = await run_in_threadpool(repo.get_interview_by_id, db, interview_id)
    if not interview:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Interview {interview_id} not found.")
    if interview.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized access")
    if interview.status == "completed":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Interview {interview_id} is already completed.")

    questions = interview.questions
    
    if is_interview_expired(interview):
        if interview.status != "expired":
            await _evaluate_and_finalize(db, interview_id, questions, "expired")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Interview time has expired.")

    # Match question_id against eager loaded questions
    question = next((q for q in questions if q.id == question_id), None)
    if not question:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Question {question_id} does not belong to interview {interview_id}.")

    # Save the new answer in a threadpool to prevent blocking
    await run_in_threadpool(
        repo.save_answer,
        db=db,
        interview_id=interview_id,
        question_id=question_id,
        user_answer=user_answer,
    )

    # Re-fetch only answers directly rather than whole interview to get updated count and records cleanly without nested N+1 
    answers = await run_in_threadpool(repo.get_answers_by_interview, db, interview_id)
    is_complete = len(answers) >= len(questions)

    if is_complete:
        evaluation = await _evaluate_and_finalize(db, interview_id, questions)
        return True, None, evaluation

    # Find next unanswered question
    answered_ids = {a.question_id for a in answers}
    next_question = None
    for q in questions:
        if q.id not in answered_ids:
            next_question = q
            break

    return False, next_question, None


async def complete_interview(
    db: Session,
    interview_id: int,
) -> Dict[str, Any]:
    """Force-complete an interview: evaluate all answered questions."""
    interview = await run_in_threadpool(repo.get_interview_by_id, db, interview_id)
    if not interview:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Interview {interview_id} not found.")

    return await _evaluate_and_finalize(db, interview_id, interview.questions)


async def get_interview_detail(
    db: Session,
    interview_id: int,
    user_id: int,
) -> Optional[Any]:
    """Return full interview with questions and answers."""
    interview = await run_in_threadpool(repo.get_interview_by_id, db, interview_id)
    if interview and interview.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized access")
    return interview


# ── Internal helpers ─────────────────────────────────────────

async def _evaluate_and_finalize(
    db: Session,
    interview_id: int,
    questions: List[QuestionModel],
    final_status: str = "completed"
) -> Dict[str, Any]:
    """Run AI evaluation, persist scores, mark interview final status."""
    answers = await run_in_threadpool(repo.get_answers_by_interview, db, interview_id)

    # Build structures for the AI evaluator
    generated_for_eval = []
    human_answers_map = {}
    answer_by_qid = {a.question_id: a for a in answers}

    for q in questions:
        qid = str(q.id)
        generated_for_eval.append({
            "id": qid,
            "question_text": q.question_text,
            "answer_text": q.expected_answer or "",
        })
        ans = answer_by_qid.get(q.id)
        human_answers_map[qid] = ans.user_answer if ans else ""

    evaluation = await _run_evaluation(generated_for_eval, human_answers_map)

    # Persist per-question scores back to answer records
    per_question = evaluation.get("per_question", [])
    score_map = {}
    for item in per_question:
        try:
            score_map[int(item["id"])] = (
                float(item.get("score", 0)),
                str(item.get("feedback", "")),
            )
        except (ValueError, KeyError) as e:
            logger.warning("Failed to parse evaluation item: %s. Error: %s", item, e)
            continue

    def _update_scores_sync():
        for ans in answers:
            if ans.question_id in score_map:
                ans.score, ans.feedback = score_map[ans.question_id]
        db.commit()
        overall_score = float(evaluation.get("overall_score", 0))
        repo.update_interview_status(db, interview_id, final_status, overall_score)

    await run_in_threadpool(_update_scores_sync)

    return evaluation
