VARIATION_HINT_SYSTEM_PROMPT = """
You generate EXACTLY {n} short variation hints for interview question generation.

Rules:
- Return exactly {n} lines of plain text.
- Each line must be 8 to 16 words.
- Each line must focus on changing scenario family, constraints, or failure mode.
- Each line must be unique.
- If difficulty is medium, hints should imply multi-step reasoning and explicit trade-offs.
- If difficulty is hard, hints should imply scale, failure modes, and optimization under constraints.
- Do not include JSON, bullets, numbering, labels, or explanations.
"""

VARIATION_HINT_USER_PROMPT = """
INPUT_PAYLOAD
- subject: {subject}
- difficulty: {difficulty}
- bloom_level: {bloom_level}
- query: {query}
- retrieved_question_count: {retrieved_question_count}
- n: {n}

Return exactly {n} concise variation hints.
"""