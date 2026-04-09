"""Database operations for interviews, questions, and answers."""

from typing import List, Optional

from sqlalchemy.orm import Session, joinedload

from app.models.answer import Answer
from app.models.interview import Interview
from app.models.question import Question


# ── Interview ────────────────────────────────────────────────

def create_interview(
    db: Session,
    subject: str,
    difficulty: Optional[str] = None,
    total_questions: int = 0,
    user_id: Optional[int] = None,
    duration_minutes: int = 15,
) -> Interview:
    interview = Interview(
        user_id=user_id,
        subject=subject,
        difficulty=difficulty,
        status="ongoing",
        total_questions=total_questions,
        duration_minutes=duration_minutes,
    )
    db.add(interview)
    db.commit()
    db.refresh(interview)
    return interview


def get_interview_by_id(db: Session, interview_id: int) -> Optional[Interview]:
    return (
        db.query(Interview)
        .options(joinedload(Interview.questions), joinedload(Interview.answers))
        .filter(Interview.id == interview_id)
        .first()
    )


def get_interviews_by_user(db: Session, user_id: int) -> List[Interview]:
    return (
        db.query(Interview)
        .options(joinedload(Interview.questions), joinedload(Interview.answers))
        .filter(Interview.user_id == user_id)
        .order_by(Interview.created_at.desc())
        .all()
    )


def update_interview_status(
    db: Session,
    interview_id: int,
    status: str,
    overall_score: Optional[float] = None,
) -> Optional[Interview]:
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        return None
    interview.status = status
    if overall_score is not None:
        interview.overall_score = overall_score
    db.commit()
    db.refresh(interview)
    return interview


# ── Questions ────────────────────────────────────────────────

def save_question(
    db: Session,
    interview_id: int,
    question_text: str,
    expected_answer: Optional[str] = None,
    difficulty: Optional[str] = None,
    order_index: int = 0,
) -> Question:
    question = Question(
        interview_id=interview_id,
        question_text=question_text,
        expected_answer=expected_answer,
        difficulty=difficulty,
        order_index=order_index,
    )
    db.add(question)
    db.commit()
    db.refresh(question)
    return question


def save_questions_bulk(
    db: Session,
    interview_id: int,
    questions_data: List[dict],
) -> List[Question]:
    db_questions = []
    for idx, q in enumerate(questions_data):
        question = Question(
            interview_id=interview_id,
            question_text=str(q.get("question_text", "")).strip(),
            expected_answer=str(q.get("answer_text", "")).strip() or None,
            difficulty=q.get("difficulty"),
            order_index=idx,
        )
        db.add(question)
        db_questions.append(question)
    db.commit()
    for q in db_questions:
        db.refresh(q)
    return db_questions


def get_questions_by_interview(db: Session, interview_id: int) -> List[Question]:
    return (
        db.query(Question)
        .filter(Question.interview_id == interview_id)
        .order_by(Question.order_index)
        .all()
    )


def get_question_by_id(db: Session, question_id: int) -> Optional[Question]:
    return db.query(Question).filter(Question.id == question_id).first()


# ── Answers ──────────────────────────────────────────────────

def get_answer_for_question(db: Session, interview_id: int, question_id: int) -> Optional[Answer]:
    return db.query(Answer).filter(
        Answer.interview_id == interview_id, 
        Answer.question_id == question_id
    ).first()

def save_answer(
    db: Session,
    interview_id: int,
    question_id: int,
    user_answer: str,
    score: Optional[float] = None,
    feedback: Optional[str] = None,
) -> Answer:
    answer = get_answer_for_question(db, interview_id, question_id)
    if answer:
        answer.user_answer = user_answer
        if score is not None:
             answer.score = score
        if feedback is not None:
             answer.feedback = feedback
    else:
        answer = Answer(
            interview_id=interview_id,
            question_id=question_id,
            user_answer=user_answer,
            score=score,
            feedback=feedback,
        )
        db.add(answer)
    db.commit()
    db.refresh(answer)
    return answer


def get_answers_by_interview(db: Session, interview_id: int) -> List[Answer]:
    return (
        db.query(Answer)
        .filter(Answer.interview_id == interview_id)
        .order_by(Answer.created_at)
        .all()
    )


def count_answers_for_interview(db: Session, interview_id: int) -> int:
    return db.query(Answer).filter(Answer.interview_id == interview_id).count()
