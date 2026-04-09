# Question Agent (Saarthi Interview Platform)

Question Agent is a full-stack AI interview platform that:

- generates adaptive technical interview questions,
- streams them in real time over WebSocket,
- accepts candidate answers one-by-one,
- returns structured per-question feedback and an overall score.

It uses FastAPI + LangGraph on the backend and React + Vite on the frontend.

## What It Does

- Converts interview setup inputs (subject, difficulty, Bloom level, etc.) into a retrieval query.
- Retrieves related seed questions from Pinecone vector search.
- Generates fresh interview questions with controlled variation.
- Runs live interview sessions through WebSocket.
- Evaluates submitted answers with LLM-based scoring and guardrails.

## Tech Stack

### Backend

- Python, FastAPI, Uvicorn
- LangGraph / LangChain
- Google GenAI chat models (via LangChain integration)
- Pinecone vector store
- HuggingFace endpoint embeddings

### Frontend

- React 19
- Vite
- Native WebSocket client

## Repository Structure

```text
question_agent/
|-- client/
|   |-- src/
|   |-- package.json
|   `-- vite.config.js
|-- server/
|   |-- app/
|   |   |-- api/routes/
|   |   |-- core/
|   |   |-- db/
|   |   |-- graph/
|   |   |-- prompts/
|   |   |-- schemas/
|   |   |-- services/
|   |   `-- state/
|   |-- requirements.txt
|   `-- .env.example
`-- README.md
```

## Prerequisites

- Python 3.10+
- Node.js 18+
- npm 9+
- Pinecone index with interview question vectors
- API keys for model providers and embedding endpoints

## Environment Variables (Backend)

Create `server/.env` from `server/.env.example` and fill values.

Required for normal operation:

- `PINECONE_API_KEY`
- `PINECONE_INDEX_NAME` (default: `qdataset`)
- `HUGGINGFACEHUB_API_TOKEN` (for `HuggingFaceEndpointEmbeddings`)
- `GEMINI_API_KEY` and/or `GOOGLE_API_KEY` (recommended: set both to the same value)

Optional:

- `APP_ENV` (default: `development`)
- `GOOGLE_MODEL_NAME` (default: `gemini-3.1-flash-lite-preview`)
- `EMBEDDINGS_MODEL_NAME` (default: `sentence-transformers/all-MiniLM-L6-v2`)

## Local Setup

### 1. Backend Setup

From the `server` directory:

```bash
# Create venv
python3 -m venv .venv

# Activate (Windows PowerShell)
.\.venv\Scripts\Activate.ps1

# Activate (macOS/Linux)
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create env file
copy .env.example .env   # Windows
# cp .env.example .env   # macOS/Linux

# Run API
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend Setup

From the `client` directory:

```bash
npm install
npm run dev
```

Frontend default dev URL: `http://localhost:5173`

Backend default API URL: `http://127.0.0.1:8000`

WebSocket endpoint used by UI: `ws://127.0.0.1:8000/api/interview/ws`

## API Reference

### Health

- `GET /api/health`

Response:

```json
{ "status": "ok" }
```

### One-shot interview run

- `POST /api/interview/run`

Request body:

```json
{
  "subject": "Data Structures and Algorithms (DSA)",
  "subject_description": "Interview prep for software engineering",
  "query": "",
  "difficulty": "medium",
  "bloom_level": "L3 - Apply",
  "n": 5,
  "real_world_required": true,
  "enable_human_review": false,
  "human_answers": {}
}
```

Response includes:

- `query`
- `retrieved_questions`
- `generated_questions`
- `evaluation_report`

### Real-time interview flow (WebSocket)

- `WS /api/interview/ws`

Protocol summary:

1. Server sends `ready`.
2. Client sends start payload:
   - `{"type":"start","payload":{...}}`
   - or raw payload object.
3. Server sends `started` and then `question`.
4. Client sends answer messages:
   - `{"type":"answer","question_id":"1","answer":"..."}`
5. Server streams next question or final `result`.

Other messages:

- `{"type":"ping"}` -> `{"type":"pong"}`
- `{"type":"finish"}` -> force early evaluation and return `result`

## How The Backend Pipeline Works

The LangGraph flow runs these steps in order:

1. `generate_query`
2. `retrieve_questions`
3. `generate_variation_hint`
4. `generate_questions`
5. `human_review_answers`
6. `evaluate_human_answers`

This gives retrieval-grounded question generation plus structured answer evaluation.

## Frontend Highlights

- Interview setup panel (subject, difficulty, Bloom level, count).
- Real-time question stream with heartbeat and timeline.
- Submit, skip, or finish early actions.
- Evaluation panel with overall score, strengths, improvement areas, and per-question verdicts.

## Common Commands

### Backend

```bash
uvicorn app.main:app --reload
```

### Frontend

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

## Troubleshooting

- `No questions were generated`:
  - verify Pinecone index exists and has matching metadata fields (`subject`, `difficulty`, `bloom_level`).
- Auth/model errors at runtime:
  - confirm `.env` keys are set and loaded.
- WebSocket connection fails from UI:
  - verify backend is running on port 8000 and frontend WebSocket URL matches.

## Future Improvements

- Persist sessions in a database (instead of in-memory session map).
- Add automated tests for API routes and graph nodes.
- Add authentication and role-based access.
- Add Docker and CI pipeline.
