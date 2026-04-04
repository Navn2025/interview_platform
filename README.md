# Question Agent Backend

This backend follows a production-style FastAPI package layout with clear separation of concerns.

## Folder Structure

- app/
  - api/
    - routes/
      - health.py
      - interview.py
  - core/
    - config.py
  - db/
    - pinecone.py
  - graph/
    - interview_graph.py
  - prompts/
  - schemas/
  - services/
  - state/
  - main.py
- tests/
- requirements.txt
- .env.example

## Run

1. Create and activate a virtual environment.
2. Install dependencies:
   pip install -r requirements.txt
3. Copy environment template and set secrets:
   copy .env.example .env
4. Start server:
   uvicorn app.main:app --reload

## API

- GET /api/health
- POST /api/interview/run
- WS /api/interview/ws

## WebSocket Protocol

Connect to `/api/interview/ws`.

1. Server sends `ready`.
2. Client sends either:

- `{"type":"start","payload":{...InterviewRequest...}}`
- or direct payload object (same fields as InterviewRequest).

3. Server sends `started`, then first `question`.
4. Client sends answers:

- `{"type":"answer","answer":"..."}`
- optional: `question_id`.

5. Server sends next `question` until complete, then sends `result`.

Optional messages:

- `{"type":"ping"}` -> server replies `pong`
- `{"type":"finish"}` -> force early evaluation with submitted answers
