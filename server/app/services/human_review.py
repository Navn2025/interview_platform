from app.state.interview_state import State
def human_review_answers(state: State):
    generated = state.get("generated_questions", [])
    if not generated:
        return {}

    enable_prompt = bool(state.get("enable_human_review", True))
    provided = state.get("human_answers") or {}
    collected_answers = {}

    if enable_prompt:
        print("\nHUMAN ANSWER STEP")
        print("Answer each question below. Press Enter to submit blank if you want to skip.\n")

    for idx, item in enumerate(generated, start=1):
        if not isinstance(item, dict):
            continue

        qid = str(item.get("id", idx))
        prefilled = str(provided.get(qid, "")).strip()
        if prefilled:
            collected_answers[qid] = prefilled
            continue

        if not enable_prompt:
            collected_answers[qid] = ""
            continue

        question_text = str(item.get("question_text", "")).strip()
        print(f"Question {idx} (id={qid}):")
        print(question_text)
        answer = input("Your answer: ").strip()
        collected_answers[qid] = answer
        print("")

    return {"human_answers": collected_answers}