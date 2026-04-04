from langchain_core.messages import HumanMessage, SystemMessage

from app.prompts.evaluation import EVALUATION_SYSTEM_PROMPT, EVALUATION_USER_PROMPT
from app.services.llm import llm
from app.state.interview_state import State


def evaluate_human_answers(state: State):
    import json

    generated = state.get("generated_questions", [])
    human_answers = state.get("human_answers") or {}

    if not generated:
        return {
            "evaluation_report": {
                "overall_score": 0,
                "overall_assessment": "No generated questions available for evaluation.",
                "strengths": [],
                "improvement_areas": ["Generate questions before evaluation."],
                "per_question": []
            }
        }

    records = []
    for idx, item in enumerate(generated, start=1):
        if not isinstance(item, dict):
            continue
        qid = str(item.get("id", idx))
        records.append({
            "id": qid,
            "question_text": str(item.get("question_text", "")).strip(),
            "reference_answer": str(item.get("answer_text", "")).strip(),
            "human_answer": str(human_answers.get(qid, "")).strip()
        })

    response = llm.invoke([
        SystemMessage(content=EVALUATION_SYSTEM_PROMPT),
        HumanMessage(content=EVALUATION_USER_PROMPT.format(
            records_json=json.dumps(records, ensure_ascii=False)
        ))
    ])

    content = response.content
    if isinstance(content, str):
        raw_text = content.strip()
    elif isinstance(content, list):
        parts = []
        for entry in content:
            if isinstance(entry, dict) and "text" in entry:
                parts.append(entry["text"])
            else:
                parts.append(str(entry))
        raw_text = "".join(parts).strip()
    else:
        raw_text = str(content).strip()

    try:
        report = json.loads(raw_text)
    except json.JSONDecodeError:
        start = raw_text.find("{")
        end = raw_text.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise ValueError("Model did not return valid JSON for evaluation report.")
        report = json.loads(raw_text[start:end + 1])

    if not isinstance(report, dict):
        raise ValueError("Evaluation report must be a JSON object.")

    per_question_raw = report.get("per_question", [])
    by_id = {}
    if isinstance(per_question_raw, list):
        for item in per_question_raw:
            if isinstance(item, dict):
                by_id[str(item.get("id", ""))] = item

    normalized = []
    for rec in records:
        qid = rec["id"]
        model_item = by_id.get(qid, {})
        verdict = str(model_item.get("verdict", "incorrect")).strip().lower()
        human_answer = rec["human_answer"]
        token_count = len([t for t in human_answer.split() if t.strip()])

        score = model_item.get("score", 0)
        try:
            score = int(score)
        except Exception:
            score = 0
        score = max(0, min(10, score))

        # Hard guardrails to prevent inflated scores for wrong/blank answers.
        if token_count == 0:
            score = 0
            verdict = "incorrect"
        elif token_count <= 2 and verdict != "correct":
            score = 0
            verdict = "incorrect"
        elif verdict in {"incorrect", "wrong", "irrelevant"}:
            score = 0
            verdict = "incorrect"

        normalized.append({
            "id": qid,
            "score": score,
            "verdict": verdict if verdict in {"correct", "partially_correct", "incorrect"} else "incorrect",
            "correctness": str(model_item.get("correctness", "")).strip(),
            "coverage": str(model_item.get("coverage", "")).strip(),
            "feedback": str(model_item.get("feedback", "")).strip(),
            "expected_points": model_item.get("expected_points", []) if isinstance(model_item.get("expected_points", []), list) else []
        })

    total = sum(item["score"] for item in normalized)
    overall_score = int(round((total / (10 * len(normalized))) * 100)) if normalized else 0

    report["per_question"] = normalized
    report["overall_score"] = overall_score

    if overall_score == 0 and normalized:
        report["overall_assessment"] = "All submitted answers were incorrect, blank, or insufficiently supported."

    return {"evaluation_report": report}