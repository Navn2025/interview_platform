from app.db.pinecone import get_vector_store
from app.state.interview_state import State


def retrieve_questions(state: State):
    vector_store = get_vector_store()
    results = vector_store.similarity_search(
        state.get("query", ""),
        # "DSA",
        k=state.get("n", 5),
        filter={
            "subject": {"$eq": state["subject"]},
            "difficulty": {"$eq": state["difficulty"]},
            "bloom_level": {"$eq": state["bloom_level"]},
        }
    )

    formatted_results = []

    for doc in results:
        formatted_results.append({
            "question": doc.metadata.get("question_text", ""),
            "answer": doc.metadata.get("answer_text", "")
        })
    return {
        "retrieved_questions": formatted_results
    }