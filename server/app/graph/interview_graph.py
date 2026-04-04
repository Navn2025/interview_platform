from langgraph.graph import StateGraph, START, END
from app.services.answer_evaluation import evaluate_human_answers
from app.services.human_review import human_review_answers
from app.services.query_generation import generate_query
from app.services.question_generation import generate_questions
from app.services.question_retrieval import retrieve_questions
from app.services.variation_generation import generate_variation_hint
from app.state.interview_state import State


def build_graph():
	builder = StateGraph(State)
	builder.add_node("generate_query", generate_query)
	builder.add_node("retrieve_questions", retrieve_questions)
	builder.add_node("generate_variation_hint", generate_variation_hint)
	builder.add_node("generate_questions", generate_questions)
	builder.add_node("human_review_answers", human_review_answers)
	builder.add_node("evaluate_human_answers", evaluate_human_answers)

	builder.add_edge(START, "generate_query")
	builder.add_edge("generate_query", "retrieve_questions")
	builder.add_edge("retrieve_questions", "generate_variation_hint")
	builder.add_edge("generate_variation_hint", "generate_questions")
	builder.add_edge("generate_questions", "human_review_answers")
	builder.add_edge("human_review_answers", "evaluate_human_answers")
	builder.add_edge("evaluate_human_answers", END)
	return builder.compile()


graph = build_graph()