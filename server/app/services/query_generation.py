from langchain_core.messages import HumanMessage, SystemMessage

from app.prompts.query import QUERY_SYSTEM_PROMPT, USER_QUERY_PROMPT
from app.services.llm import llm
from app.state.interview_state import State


def generate_query(state: State):
    response = llm.invoke([
        SystemMessage(content=QUERY_SYSTEM_PROMPT),
        HumanMessage(content=USER_QUERY_PROMPT.format(
            subject=state["subject"],
            subject_description=state["subject_description"],
            difficulty=state["difficulty"],
            bloom_level=state["bloom_level"],
            query=state.get("query", "")
        ))
    ])

    content = response.content
    if isinstance(content, str):
        query = content.strip()
    elif isinstance(content, list):
        parts = []
        for item in content:
            if isinstance(item, dict) and "text" in item:
                parts.append(item["text"])
            else:
                parts.append(str(item))
        query = "".join(parts).strip()
    else:
        query = str(content).strip()

    return {
        "query": query
    }