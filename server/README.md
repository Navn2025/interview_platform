# Question Agent Backend (Saarthi Interview Platform)

The backend engine for the **Saarthi Interview Platform**, built with **Python, FastAPI, and LangGraph**. It serves as an AI agent designed to retrieve, generate, curate, and evaluate technical interview questions dynamically in real-time.

## Features at Current
- **FastAPI Real-Time WebSocket API:** Live, two-way communication channel (`/api/interview/ws`) handling ping-pong heartbeats, starting interviews, receiving answers, and concluding the session dynamically.
- **LangGraph Agent Workflow:** Integrates a state-machine driven LLM pipeline containing distinct execution nodes:
  1. `generate_query`: Refines the user's initial configuration.
  2. `retrieve_questions`: Fetches seed context via vector search.
  3. `generate_variation_hint`: Creates unique permutations of the original context.
  4. `generate_questions`: Prepares the final specific interview question set.
  5. `human_review_answers` & `evaluate_human_answers`: Awaits candidate answers via WebSocket and generates a rich, highly detailed evaluation report.
- **Vector Search (Pinecone):** Connects to a Pinecone instance leveraging `sentence-transformers` via HuggingFace for retrieving context-relevant programming questions.
- **Google GenAI Support:** Uses LangChain integrations with Gemini chat models for high-quality conversational output and scoring metrics.

## Project Structure
- `api/routes/`: FastAPI routers mapping for health checks (`/api/health`) and interview endpoints (`/api/interview/run` & `/api/interview/ws`).
- `graph/`: The core LangGraph node definitions (`retrieve`, `generate`, `evaluate`) and compiler logic structuring the AI decision tree.
- `prompts/`: Contains structured prompt templates tailored strictly for technical interviews.
- `schemas/`: Pydantic data models for request payload validation and strictly-typed output parsing.
- `core/` & `state/`: Application settings, LLM initialization, and the LangGraph State typing declarations.
- `main.py`: Application entry point setting up the comprehensive web server.

## Local Development
1. Create a virtual environment and activate it:
   ```bash
   python -m venv .venv
   
   # On Windows:
   .\.venv\Scripts\Activate.ps1
   
   # On macOS/Linux:
   source .venv/bin/activate
   ```
2. Install the necessary dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set environment variables. Copy `.env.example` to `.env` and fill the variables providing your specific API keys:
   - `PINECONE_API_KEY`
   - `HUGGINGFACEHUB_API_TOKEN`
   - `GEMINI_API_KEY` or `GOOGLE_API_KEY`
4. Run the API using Uvicorn:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

## What's Remaining (Future Work)
- **Database Persistence:** Replacing an in-memory session object tracking mechanism with a robust remote database (using SQLAlchemy + PostgreSQL) to persist question banks, candidate answers, and results over time.
- **Authentication & RBAC:** Securing the WebSocket and HTTP endpoints using JWT/OAuth2, ensuring only registered users can take an interview and allowing quota tracking.
- **Streaming Generation:** Advancing the WebSocket system to stream AI evaluation tokens back to the frontend chunk-by-chunk for reduced perceived latency.
- **Dynamic Multi-turn Follow-ups:** Modifying the LangGraph state loop to allow the LLM to actively ask follow-up questions if the user's initial answer is vague, rather than adhering to a strict linear list.
- **Automated Testing & CI/CD:** Introduce `pytest` suites to validate endpoint reliability and LangGraph logic transitions, integrated into GitHub Actions.
- **Containerization:** Finalize `Dockerfile` and `docker-compose.yml` for unified deployment of the AI service.
