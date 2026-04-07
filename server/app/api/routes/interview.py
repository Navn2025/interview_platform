"""Interview API routes.

Provides:
- REST endpoints for persisted interview flow (POST /start, POST /answer, GET /{id})
- WebSocket endpoint for real-time interview flow (unchanged, with optional DB persistence)
- Legacy POST /run endpoint (unchanged)
"""

from dataclasses import dataclass, field
import uuid
from typing import Any, Optional, List

from anyio import to_thread
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.security import decode_access_token
from app.db.session import SessionLocal, get_db
from app.models.user import User
from app.repositories import interview_repository as repo
from app.schemas.interview import InterviewRequest, InterviewResponse
from app.schemas.session import (
    InterviewDetailResponse,
    QuestionOut,
    StartInterviewRequest,
    StartInterviewResponse,
    SubmitAnswerRequest,
    SubmitAnswerResponse,
)
from app.services import interview_service
from app.services.answer_evaluation import evaluate_human_answers

router = APIRouter(prefix="/interview", tags=["interview"])


# ═══════════════════════════════════════════════════════════════
# REST ENDPOINTS (persisted)
# ═══════════════════════════════════════════════════════════════

@router.post("/start", response_model=StartInterviewResponse)
async def start_interview(
    payload: StartInterviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new interview, generate questions via AI, persist to DB, return first question."""
    try:
        interview_id, db_questions = await interview_service.start_interview(
            db=db,
            subject=payload.subject,
            subject_description=payload.subject_description,
            query=payload.query,
            difficulty=payload.difficulty,
            bloom_level=payload.bloom_level,
            n=payload.n,
            real_world_required=payload.real_world_required,
            user_id=current_user.id,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to start interview: {exc}") from exc

    first = db_questions[0]
    return StartInterviewResponse(
        interview_id=interview_id,
        status="ongoing",
        total_questions=len(db_questions),
        current_question=QuestionOut.model_validate(first),
    )


@router.post("/answer", response_model=SubmitAnswerResponse)
async def submit_answer(
    payload: SubmitAnswerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit an answer, persist it, return next question or evaluation results."""
    try:
        is_complete, next_q, evaluation = await interview_service.submit_answer(
            db=db,
            interview_id=payload.interview_id,
            question_id=payload.question_id,
            user_answer=payload.answer,
            user_id=current_user.id,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to submit answer: {exc}") from exc

    return SubmitAnswerResponse(
        interview_id=payload.interview_id,
        answered_question_id=payload.question_id,
        score=None,
        feedback=None,
        is_complete=is_complete,
        next_question=QuestionOut.model_validate(next_q) if next_q else None,
        evaluation=evaluation,
    )


@router.get("", response_model=List[InterviewDetailResponse])
async def get_interviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve abbreviated history of all interviews for the current user."""
    interviews = repo.get_interviews_by_user(db, current_user.id)
    return [InterviewDetailResponse.model_validate(interview) for interview in interviews]


@router.get("/{interview_id}", response_model=InterviewDetailResponse)
async def get_interview(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve full interview details with questions and answers."""
    interview = await interview_service.get_interview_detail(db, interview_id, current_user.id)
    if not interview:
        raise HTTPException(status_code=404, detail=f"Interview {interview_id} not found.")
    return InterviewDetailResponse.model_validate(interview)


# ═══════════════════════════════════════════════════════════════
# LEGACY REST ENDPOINT (unchanged)
# ═══════════════════════════════════════════════════════════════

@router.post("/run", response_model=InterviewResponse)
async def run_interview(
    payload: InterviewRequest,
    current_user: User = Depends(get_current_user)
) -> InterviewResponse:
    try:
        state = await _run_graph_legacy(_build_graph_state_legacy(payload))
        return InterviewResponse(
            query=state.get("query"),
            retrieved_questions=state.get("retrieved_questions", []),
            generated_questions=state.get("generated_questions", []),
            evaluation_report=state.get("evaluation_report", {}),
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Interview run failed: {exc}") from exc


# ═══════════════════════════════════════════════════════════════
# WEBSOCKET ENDPOINT (with DB persistence)
# ═══════════════════════════════════════════════════════════════

@router.websocket("/ws")
async def interview_ws(ws: WebSocket):
    await ws.accept()
    session_id: Optional[str] = None
    db_interview_id: Optional[int] = None
    current_user_id: Optional[int] = None

    # Allow token from query param (e.g. ?token=...)
    token = ws.query_params.get("token")
    if token:
        current_user_id = decode_access_token(token)

    try:
        await ws.send_json(
            {
                "type": "ready",
                "message": "Send {'type':'start','payload':{...}} to begin, {'type':'resume','interview_id':...} to continue, or payload directly. Include 'token' if not in query param.",
            }
        )

        initial = await ws.receive_json()
        
        # If token wasn't in query params, check the payload
        if not current_user_id and isinstance(initial, dict):
            token = initial.get("token")
            if token:
                current_user_id = decode_access_token(token)

        if not current_user_id:
            await ws.send_json({"type": "error", "message": "Unauthorized. Provide a valid token."})
            await ws.close(code=1008)
            return

        msg_type = initial.get("type") if isinstance(initial, dict) else "start"

        if msg_type == "resume":
            db_interview_id = initial.get("interview_id")
            if not db_interview_id:
                await ws.send_json({"type": "error", "message": "Missing 'interview_id' in resume payload."})
                await ws.close()
                return

            with SessionLocal() as db:
                interview_record = repo.get_interview_by_id(db, db_interview_id)
                if not interview_record or interview_record.user_id != current_user_id:
                    await ws.send_json({"type": "error", "message": "Interview not found or unauthorized."})
                    await ws.close()
                    return
                if interview_record.status == "completed":
                    await ws.send_json({"type": "error", "message": "Interview already completed."})
                    await ws.close()
                    return
                
                session_id = str(uuid.uuid4())
                db_questions = repo.get_questions_by_interview(db, db_interview_id)
                answers = repo.get_answers_by_interview(db, db_interview_id)
                
                await ws.send_json(
                    {
                        "type": "started",
                        "session_id": session_id,
                        "interview_id": db_interview_id,
                        "total_questions": len(db_questions),
                    }
                )
                
                # Check expiration immediately
                if interview_service.is_interview_expired(interview_record):
                    await ws.send_json({"type": "interview_ended", "reason": "time_up"})
                    try:
                        # Direct evaluation resolution
                        evaluation_report = await interview_service.complete_interview(db, db_interview_id)
                        await ws.send_json({"type": "result", "session_id": session_id, "evaluation": evaluation_report})
                    except Exception as e:
                        pass
                    await ws.close()
                    return

                answered_ids = {a.question_id for a in answers}
                next_q = next((q for q in db_questions if q.id not in answered_ids), None)
                if next_q:
                    idx = db_questions.index(next_q)
                    await ws.send_json({
                        "type": "question",
                        "index": idx + 1,
                        "total_questions": len(db_questions),
                        "question_id": str(next_q.id),
                        "question": QuestionOut.model_validate(next_q).model_dump()
                    })
                else:
                    try:
                        evaluation_report = await interview_service.complete_interview(db, db_interview_id)
                        await ws.send_json({"type": "result", "session_id": session_id, "evaluation": evaluation_report})
                    except Exception as e:
                        pass
        else:
            if isinstance(initial, dict) and initial.get("type") == "start":
                payload_data = initial.get("payload", {})
            else:
                payload_data = initial

            payload = InterviewRequest.model_validate(payload_data)

            # Generate questions via AI
            graph_result = await _run_graph_legacy(_build_graph_state_legacy(payload))
            questions = graph_result.get("generated_questions", [])
            if not questions:
                await ws.send_json({"type": "error", "message": "No questions were generated."})
                await ws.close()
                return

            # Persist to DB using a short-lived session context
            session_id = str(uuid.uuid4())
            with SessionLocal() as db:
                try:
                    interview_record = repo.create_interview(
                        db=db,
                        subject=payload.subject,
                        difficulty=payload.difficulty,
                        total_questions=len(questions),
                        user_id=current_user_id,
                    )
                    db_interview_id = interview_record.id
                    db_questions = repo.save_questions_bulk(db=db, interview_id=db_interview_id, questions_data=questions)
                except Exception as e:
                    await ws.send_json({"type": "error", "message": f"Database initialization failed: {e}"})
                    await ws.close()
                    return

            await ws.send_json(
                {
                    "type": "started",
                    "session_id": session_id,
                    "interview_id": db_interview_id,
                    "total_questions": len(questions),
                }
            )

            await ws.send_json({
                "type": "question",
                "index": 1,
                "total_questions": len(questions),
                "question_id": str(db_questions[0].id),
                "question": QuestionOut.model_validate(db_questions[0]).model_dump()
            })

        while True:
            message = await ws.receive_json()
            if not isinstance(message, dict):
                await ws.send_json({"type": "error", "message": "Message must be a JSON object."})
                continue

            msg_type = message.get("type")
            if msg_type == "ping":
                await ws.send_json({"type": "pong"})
                continue

            if msg_type == "finish":
                if db_interview_id:
                    with SessionLocal() as db:
                        try:
                            evaluation_report = await interview_service.complete_interview(
                                db=db, interview_id=db_interview_id
                            )
                            await ws.send_json({
                                "type": "result", 
                                "session_id": session_id, 
                                "evaluation": evaluation_report
                            })
                        except Exception as e:
                            await ws.send_json({"type": "error", "message": str(e)})
                break

            if msg_type != "answer":
                await ws.send_json(
                    {"type": "error", "message": "Unsupported message type. Use 'answer', 'finish', or 'ping'."}
                )
                continue

            # Fetch record and check expiration immediately inside short-lived session
            if not db_interview_id:
                continue

            with SessionLocal() as db:
                interview_record = repo.get_interview_by_id(db, db_interview_id)
                if interview_record and interview_service.is_interview_expired(interview_record):
                    # Signal client
                    await ws.send_json({
                        "type": "interview_ended", 
                        "reason": "time_up"
                    })
                    if interview_record.status != "expired":
                        db_questions = repo.get_questions_by_interview(db, db_interview_id)
                        try:
                            # Direct evaluation resolution
                            await interview_service.complete_interview(db, db_interview_id)
                            repo.update_interview_status(db, db_interview_id, "expired")
                        except Exception:
                            pass
                    break

            answer_text = str(message.get("answer", "")).strip()
            question_id = message.get("question_id")
            
            with SessionLocal() as db:
                try:
                    is_complete, next_q, evaluation = await interview_service.submit_answer(
                        db=db,
                        interview_id=db_interview_id,
                        question_id=int(question_id),
                        user_answer=answer_text,
                        user_id=current_user_id,
                    )
                except Exception as e:
                    await ws.send_json({"type": "error", "message": getattr(e, 'detail', str(e))})
                    continue

                if is_complete:
                    await ws.send_json(
                        {"type": "result", "session_id": session_id, "evaluation": evaluation}
                    )
                    break
                
                db_questions = repo.get_questions_by_interview(db, db_interview_id)
                idx = 0
                for i, q in enumerate(db_questions):
                    if q.id == next_q.id:
                        idx = i
                        break

                await ws.send_json({
                    "type": "question",
                    "index": idx + 1,
                    "total_questions": len(db_questions),
                    "question_id": str(next_q.id),
                    "question": QuestionOut.model_validate(next_q).model_dump()
                })

    except WebSocketDisconnect:
        pass
    except Exception as exc:
        try:
            await ws.send_json({"type": "error", "message": str(exc)})
        except Exception:
            pass


# ═══════════════════════════════════════════════════════════════
# PRIVATE HELPERS
# ═══════════════════════════════════════════════════════════════

# Redundant helper functions removed


def _build_graph_state_legacy(payload: InterviewRequest) -> dict:
    return {
        "subject": payload.subject,
        "subject_description": payload.subject_description,
        "query": payload.query,
        "difficulty": payload.difficulty,
        "bloom_level": payload.bloom_level,
        "n": payload.n,
        "real_world_required": payload.real_world_required,
        "enable_human_review": False,
        "human_answers": payload.human_answers,
        "retrieved_questions": [],
        "generated_questions": [],
    }


async def _run_graph_legacy(state: dict) -> dict:
    from app.graph.interview_graph import graph

    return await to_thread.run_sync(graph.invoke, state)


async def _run_evaluation_legacy(questions: list, answers: dict) -> dict:
    eval_state = {"generated_questions": questions, "human_answers": answers}
    result = await to_thread.run_sync(evaluate_human_answers, eval_state)
    return result.get("evaluation_report", {})