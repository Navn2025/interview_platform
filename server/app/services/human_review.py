from app.state.interview_state import State


def human_review_answers(state: State):
    """Pass-through node: collects pre-filled answers or assigns empty strings.

    NOTE: interactive prompt (print/input) removed — the web flow always sets
    enable_human_review=False, so answers come via the WebSocket/REST layer.
    """
    generated = state.get("generated_questions", [])
    if not generated:
        return {}

    provided = state.get("human_answers") or {}
    collected_answers = {}

    for idx, item in enumerate(generated, start=1):
        if not isinstance(item, dict):
            continue

        qid = str(item.get("id", idx))
        prefilled = str(provided.get(qid, "")).strip()
        collected_answers[qid] = prefilled

    return {"human_answers": collected_answers}