import json
import random
import uuid
from langchain_core.messages import HumanMessage, SystemMessage

from app.prompts.question_generation import QUESTION_GENERATION_SYSTEM_PROMPT, QUESTION_GENERATION_USER_PROMPT
from app.services.llm import question_llm
from app.state.interview_state import State

def generate_questions(state: State):

    n = state.get("n", 5)
    difficulty = state.get("difficulty", "medium")
    bloom_level = state.get("bloom_level", "L3 - Apply")
    real_world_required = bool(state.get("real_world_required", False))

    generation_run_id = uuid.uuid4().hex[:12]
    variation_hints = state.get("variation_hints") or []

    if not variation_hints:
        variation_hints = [
            "switch to a different industry and operational bottleneck",
            "change failure mode and recovery constraints",
            "focus on throughput optimization under strict latency",
            "use memory-cost tradeoff with scale constraints",
            "introduce edge-case heavy production behavior",
            "reframe around reliability and degraded-mode handling",
        ]
        random.shuffle(variation_hints)
        variation_hints = variation_hints[:n]

    variation_hints_text = "\n".join(f"- {hint}" for hint in variation_hints)



    response = question_llm.invoke([
        SystemMessage(content=QUESTION_GENERATION_SYSTEM_PROMPT.format(
            N=n,
            true_or_false=str(real_world_required).lower()
        )),
        HumanMessage(content=QUESTION_GENERATION_USER_PROMPT.format(
            subject=state.get("subject", ""),
            subject_description=state.get("subject_description") or "",
            difficulty=difficulty,
            bloom_level=bloom_level,
            true_or_false=real_world_required,
            N=n,
            generation_run_id=generation_run_id,
            variation_hints=variation_hints_text,
            retrieved_questions=state.get("retrieved_questions", [])
        ))
    ])

    raw_content = response.content
    if isinstance(raw_content, str):
        raw_text = raw_content.strip()
    elif isinstance(raw_content, list):
        parts = []
        for item in raw_content:
            if isinstance(item, dict) and "text" in item:
                parts.append(item["text"])
            else:
                parts.append(str(item))
        raw_text = "".join(parts).strip()
    else:
        raw_text = str(raw_content).strip()

    try:
        results = json.loads(raw_text)
    except json.JSONDecodeError:
        start = raw_text.find("[")
        end = raw_text.rfind("]")
        if start == -1 or end == -1 or end <= start:
            raise ValueError("Model did not return a valid JSON array for generated questions.")
        results = json.loads(raw_text[start:end + 1])

    if not isinstance(results, list):
        raise ValueError("Generated questions output must be a JSON array.")

    # Ensure answer_text is always present; fallback to matched retrieved answer when missing.
    answer_lookup = {
        item.get("question", ""): item.get("answer", "")
        for item in state.get("retrieved_questions", [])
        if isinstance(item, dict)
    }
    for item in results:
        if not isinstance(item, dict):
            continue
        answer_text = str(item.get("answer_text", "")).strip()
        if not answer_text:
            original_q = item.get("original_question", "")
            item["answer_text"] = answer_lookup.get(original_q, "")

    return {
        "generated_questions": results
    }