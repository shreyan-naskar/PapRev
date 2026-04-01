# PapRev

PapRev is a starter pre-submission paper review system for research manuscripts. It lets you upload a PDF or submit manuscript text, runs a review pipeline, and shows structured feedback in a browser UI before formal peer review.

The project currently uses:

- a React frontend
- an Express backend with MongoDB persistence
- a FastAPI RAG service
- Socket.io for live progress updates

It is designed to run in simple local starter mode without login/logout.

## Current State

What works now:

- anonymous paper submission, no auth required
- PDF upload and text-draft submission
- MongoDB-backed persistence for papers, jobs, and reports
- live job progress updates over Socket.io
- a FastAPI RAG pipeline that can use Gemini
- automatic fallback to the local Node review pipeline if the RAG service fails
- dashboard/history view for previous submissions
- uploaded PDF preview and structured review display in the frontend

What is still starter-grade:

- no production auth or multi-user separation
- no advanced vector ingestion pipeline
- no robust deployment/setup automation
- no comprehensive tests
- optional integrations like Qdrant, GROBID, Ollama, and Tavily are best-effort, not required

## Architecture

PapRev has three main parts:

### Frontend

Location: `frontend/`

Responsibilities:

- upload PDFs or submit text drafts
- show live progress for active jobs
- render structured feedback, findings, recommendations, and sources
- show dashboard/history of previously processed papers

Key files:

- `frontend/src/app.jsx`
- `frontend/src/pages/Upload.jsx`
- `frontend/src/pages/Review.jsx`
- `frontend/src/pages/Dashboard.jsx`
- `frontend/src/components/review/FeedbackPanel.jsx`

### Backend

Location: `backend/`

Responsibilities:

- accept paper submissions
- persist papers/jobs/reports in MongoDB
- dispatch review jobs to the FastAPI RAG service
- receive progress/completion webhooks
- fall back to the local Node review pipeline when RAG fails
- emit live Socket.io progress events to the frontend

Key files:

- `backend/src/app.js`
- `backend/src/server.js`
- `backend/src/services/jobWorkflowService.js`
- `backend/src/services/reviewOrchestratorService.js`
- `backend/src/services/ragService.js`
- `backend/src/controllers/webhookController.js`

### RAG Service

Location: `rag-service/`

Responsibilities:

- parse manuscript input
- chunk text
- retrieve supporting context
- run a Gemini-backed review path when configured
- aggregate a structured report
- send progress and completion back to the backend

Key files:

- `rag-service/main.py`
- `rag-service/core/parser.py`
- `rag-service/core/retriever.py`
- `rag-service/core/reviewer.py`
- `rag-service/core/report.py`

## Review Flow

The current review flow is:

1. The frontend submits a text draft or uploaded PDF to the backend.
2. The backend stores a `Paper` and `ReviewJob` in MongoDB.
3. The backend dispatches the job to the FastAPI RAG service.
4. The RAG service emits progress updates back to the backend webhook.
5. The backend forwards progress updates to the frontend through Socket.io.
6. The RAG service generates a report and posts it back to the backend.
7. The backend stores the report and marks the job complete.
8. If the RAG service fails, the backend falls back to the local Node review pipeline and still tries to produce a report.

## RAG Behavior

The FastAPI RAG service is Gemini-first.

### Gemini path

If `GEMINI_API_KEY` is set in `rag-service/.env`, the Python reviewer attempts to use Gemini for dimension-level review generation.

### Fallback behavior

If the RAG service is unavailable, or if the RAG pipeline fails, the backend falls back to the local Node review pipeline in:

- `backend/src/services/reviewOrchestratorService.js`

That local pipeline can still produce heuristic review output and optionally use the backend Gemini path if configured there.

### Optional integrations

The following are optional and can be left blank for a basic local trial:

- `TAVILY_API_KEY`
- `QDRANT_URL`
- `GROBID_URL`
- `OLLAMA_URL`

If they are configured and reachable, the RAG service will attempt to use them. If they are not available, the starter pipeline continues in a simplified mode.

## API Endpoints

### System

- `GET /api/v1/health`
- `GET /api/v1/capabilities`

### Papers

- `GET /api/papers`
- `GET /api/papers/:paperId`
- `POST /api/papers/text`
- `POST /api/papers/upload`

### Jobs

- `GET /api/jobs/:jobId`

### Reports

- `GET /api/reports/:paperId`

### Webhooks

- `POST /api/internal/progress`
- `POST /api/webhook/review-complete`

### Legacy review endpoints

These still exist for the older backend-only flow:

- `GET /api/v1/reviews/capabilities`
- `POST /api/v1/reviews`
- `POST /api/v1/reviews/upload`

## Environment Variables

### Frontend

File: `frontend/.env`

```env
VITE_API_BASE_URL=http://localhost:6069
VITE_SOCKET_URL=http://localhost:6069
```

### Backend

File: `backend/.env`

```env
PORT=6069
NODE_ENV=development
CORS_ORIGIN=*
PUBLIC_BASE_URL=http://localhost:6069

MONGODB_URI=mongodb://127.0.0.1:27017/paprev

RAG_SERVICE_URL=http://localhost:8000
INTERNAL_WEBHOOK_SECRET=replace_with_your_shared_secret

GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
GEMINI_EMBEDDING_MODEL=gemini-embedding-001

HTTP_TIMEOUT_MS=12000
MAX_RETRIEVED_PAPERS=8
```

### RAG Service

File: `rag-service/.env`

```env
INTERNAL_WEBHOOK_SECRET=replace_with_the_same_shared_secret

GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash

TAVILY_API_KEY=

QDRANT_URL=
QDRANT_COLLECTION=paprev-knowledge-base

GROBID_URL=

OLLAMA_URL=
OLLAMA_EMBED_MODEL=nomic-embed-text
```

## Minimal Local Trial Setup

For the simplest successful run, you need:

- MongoDB running
- backend running on `http://localhost:6069`
- FastAPI RAG service running on `http://localhost:8000`
- frontend running with Vite or served from backend `frontend/dist`

You do not need these for the minimal trial:

- Qdrant
- GROBID
- Ollama
- Tavily

You only need a valid Gemini key in `rag-service/.env` if you want the RAG service itself to use Gemini.

## How To Run

### 1. Backend

From `backend/`:

```bash
npm install
npm run dev
```

### 2. Frontend

From `frontend/`:

```bash
npm install
npm run dev
```

### 3. RAG Service

From `rag-service/`:

```bash
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 4. Open the app

If using Vite frontend:

```text
http://localhost:5173/
```

If using the backend-served built frontend:

```text
http://localhost:6069/
```

## Notes

- If the RAG service is not reachable, the backend will fall back to the local Node review pipeline.
- If the frontend shows stale or confusing data after major config changes, submit a fresh job rather than reusing an old one.
- The current UI now exposes whether a completed report came from:
  - `rag-service`
  - `backend-fallback`

## Current Limitations

- no production auth
- no role/user separation
- no production-safe secret management
- no robust retry/dead-letter job system
- no complete observability or test coverage
- optional retrieval providers are not mandatory and may silently degrade to simpler behavior if unavailable
