import random
import re
from langchain_core.messages import HumanMessage, SystemMessage

from app.prompts.variation import VARIATION_HINT_SYSTEM_PROMPT, VARIATION_HINT_USER_PROMPT
from app.services.llm import llm
from app.state.interview_state import State

def generate_variation_hint(state: State):

    n = max(1, int(state.get("n", 5)))
    difficulty_key = str(state.get("difficulty", "medium")).lower()

    fallback_hints_by_difficulty = {
        "easy": [
            "Use a familiar domain with one simple operational constraint and clear objective.",
            "Keep scenario straightforward with direct requirement and one practical limitation.",
            "Choose basic workflow context and ask for a single optimization decision.",
            "Use a small-scale setting with one edge case and explicit expected behavior.",
            "Frame a direct use-case with one trade-off and clear success criterion.",
            "Anchor in common system context with minimal constraints and concrete prompt.",
        ],
        "medium": [
            "Switch industry and require multi-step reasoning with latency-cost trade-off.",
            "Reframe workflow around scaling choice plus reliability versus throughput compromise.",
            "Use distributed component context with edge case and performance trade-off.",
            "Introduce concurrent workload and force balancing consistency against response time.",
            "Add pipeline stages with failure handling and optimization under moderate constraints.",
            "Require evaluating two approaches using measurable constraints and practical trade-offs.",
        ],
        "hard": [
            "Model high-scale traffic with failure cascades and strict optimization targets.",
            "Use distributed architecture with consistency constraints, hotspots, and recovery strategy.",
            "Introduce partial outages, backpressure, and cost-latency-reliability optimization tension.",
            "Frame sharding and caching decisions under skewed load and strict SLO limits.",
            "Require resilience design for degraded mode with quantified throughput constraints.",
            "Force architecture trade-offs under memory, latency, cost, and failure-mode pressure.",
        ],
    }

    selected_fallback = fallback_hints_by_difficulty.get(
        difficulty_key,
        fallback_hints_by_difficulty["medium"]
    )

    try:
        response = llm.invoke([
            SystemMessage(content=VARIATION_HINT_SYSTEM_PROMPT.format(n=n)),
            HumanMessage(content=VARIATION_HINT_USER_PROMPT.format(
                subject=state.get("subject", ""),
                difficulty=state.get("difficulty", "medium"),
                bloom_level=state.get("bloom_level", "L3 - Apply"),
                query=state.get("query", ""),
                retrieved_question_count=len(state.get("retrieved_questions", [])),
                n=n
            ))
        ])

        content = response.content
        if isinstance(content, str):
            raw_text = content.strip()
        elif isinstance(content, list):
            parts = []
            for item in content:
                if isinstance(item, dict) and "text" in item:
                    parts.append(item["text"])
                else:
                    parts.append(str(item))
            raw_text = "".join(parts).strip()
        else:
            raw_text = str(content).strip()

        hints = []
        for line in raw_text.splitlines():
            cleaned = line.strip()
            cleaned = re.sub(r"^\s*[-*]\s*", "", cleaned)
            cleaned = re.sub(r"^\s*\d+[\).:-]\s*", "", cleaned)
            if cleaned and cleaned not in hints:
                hints.append(cleaned)
    except Exception:
        hints = []

    if len(hints) < n:
        random.shuffle(selected_fallback)
        for hint in selected_fallback:
            if hint not in hints:
                hints.append(hint)
            if len(hints) == n:
                break

    if len(hints) < n:
        all_fallback = (
            fallback_hints_by_difficulty["easy"]
            + fallback_hints_by_difficulty["medium"]
            + fallback_hints_by_difficulty["hard"]
        )
        random.shuffle(all_fallback)
        for hint in all_fallback:
            if hint not in hints:
                hints.append(hint)
            if len(hints) == n:
                break

    hints = hints[:n]
    return {
        "variation_hint": hints[0],
        "variation_hints": hints
    }

