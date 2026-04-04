from dataclasses import dataclass, field
import uuid
from typing import Any

from anyio import to_thread
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect

from app.schemas.interview import InterviewRequest, InterviewResponse
from app.services.answer_evaluation import evaluate_human_answers

router = APIRouter(prefix="/interview", tags=["interview"])


@dataclass
class InterviewSession:
    session_id: str
    questions: list[dict]
    answers: dict[str, str] = field(default_factory=dict)
    index: int = 0

    def _question_id_at(self, idx: int) -> str:
        question = self.questions[idx] if idx < len(self.questions) else {}
        return str(question.get("id", idx + 1))

    def current_question(self) -> dict[str, Any]:
        question = self.questions[self.index]
        return {
            "type": "question",
            "session_id": self.session_id,
            "index": self.index + 1,
            "total_questions": len(self.questions),
            "question_id": self._question_id_at(self.index),
            "question": question,
        }

    def submit_answer(self, answer: str, question_id: str | None = None) -> None:
        if self.index >= len(self.questions):
            return
        qid = question_id or self._question_id_at(self.index)
        self.answers[str(qid)] = answer
        self.index += 1

    def is_complete(self) -> bool:
        return self.index >= len(self.questions)


sessions: dict[str, InterviewSession] = {}


def _build_graph_state(payload: InterviewRequest) -> dict[str, Any]:
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


async def _run_graph(state: dict[str, Any]) -> dict[str, Any]:
    from app.graph.interview_graph import graph

    return await to_thread.run_sync(graph.invoke, state)


async def _run_evaluation(questions: list[dict], answers: dict[str, str]) -> dict[str, Any]:
    eval_state = {"generated_questions": questions, "human_answers": answers}
    result = await to_thread.run_sync(evaluate_human_answers, eval_state)
    return result.get("evaluation_report", {})


@router.post("/run", response_model=InterviewResponse)
async def run_interview(payload: InterviewRequest) -> InterviewResponse:
    try:
        state = await _run_graph(_build_graph_state(payload))
        return InterviewResponse(
            query=state.get("query"),
            retrieved_questions=state.get("retrieved_questions", []),
            generated_questions=state.get("generated_questions", []),
            evaluation_report=state.get("evaluation_report", {}),
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Interview run failed: {exc}") from exc


@router.websocket("/ws")
async def interview_ws(ws: WebSocket):
    await ws.accept()
    session_id: str | None = None

    try:
        await ws.send_json(
            {
                "type": "ready",
                "message": "Send {'type':'start','payload':{...}} or payload directly.",
            }
        )

        initial = await ws.receive_json()
        if isinstance(initial, dict) and initial.get("type") == "start":
            payload_data = initial.get("payload", {})
        else:
            payload_data = initial

        payload = InterviewRequest.model_validate(payload_data)
        graph_result = await _run_graph(_build_graph_state(payload))
        questions = graph_result.get("generated_questions", [])
        if not questions:
            await ws.send_json({"type": "error", "message": "No questions were generated."})
            return

        session_id = str(uuid.uuid4())
        session = InterviewSession(session_id=session_id, questions=questions)
        sessions[session_id] = session

        await ws.send_json(
            {
                "type": "started",
                "session_id": session_id,
                "total_questions": len(questions),
            }
        )
        await ws.send_json(session.current_question())

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
                evaluation_report = await _run_evaluation(session.questions, session.answers)
                await ws.send_json(
                    {
                        "type": "result",
                        "session_id": session.session_id,
                        "evaluation": evaluation_report,
                    }
                )
                break

            if msg_type != "answer":
                await ws.send_json(
                    {
                        "type": "error",
                        "message": "Unsupported message type. Use 'answer', 'finish', or 'ping'.",
                    }
                )
                continue

            if session.is_complete():
                await ws.send_json({"type": "error", "message": "All questions already answered."})
                continue

            answer = str(message.get("answer", "")).strip()
            question_id = message.get("question_id")
            session.submit_answer(answer=answer, question_id=str(question_id) if question_id else None)

            if session.is_complete():
                evaluation_report = await _run_evaluation(session.questions, session.answers)
                await ws.send_json(
                    {
                        "type": "result",
                        "session_id": session.session_id,
                        "evaluation": evaluation_report,
                    }
                )
                break

            await ws.send_json(session.current_question())

    except WebSocketDisconnect:
        pass
    except Exception as exc:
        await ws.send_json({"type": "error", "message": str(exc)})
    finally:
        if session_id:
            sessions.pop(session_id, None)