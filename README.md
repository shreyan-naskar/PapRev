# PapRev

PapRev is an intelligent pre-submission paper review system for research manuscripts. The goal is to help authors catch structural gaps, weak methodology descriptions, unclear writing, and missing reviewer-facing components before formal peer review.

At the current stage, the project includes a functional backend and a lightweight browser-based frontend. The system provides a Gemini-backed review pipeline with Retrieval-Augmented Generation (RAG), heuristic fallback analysis, PDF upload plus manuscript text extraction, and a local UI for interacting with the review endpoints.

## What Has Been Built So Far

The backend currently supports:

- manuscript review from raw text or abstract input
- PDF upload and automatic text extraction
- manuscript structure analysis
- heuristic identification of likely weaknesses in the draft
- retrieval of relevant scholarly context from external literature sources
- retrieval of curated reporting and submission standards
- Gemini-based structured review generation when an API key is configured
- deterministic fallback review generation when Gemini is not configured or unavailable

The frontend currently supports:

- service health and capability inspection
- manuscript review from pasted text
- PDF manuscript upload
- rendering structured review output including readiness score, concerns, actions, questions, and evidence

## Current Backend Architecture

The backend is an Express application located in `backend/`.

Key modules:

- `backend/src/app.js`
  Sets up Express, middleware, health checks, and API routing.

- `backend/src/server.js`
  Starts the HTTP server and handles uncaught exceptions and unhandled promise rejections.

- `backend/src/controllers/reviewController.js`
  Handles review requests for both plain text and uploaded PDFs.

- `backend/src/routes/reviewRoutes.js`
  Exposes the review endpoints.

- `backend/src/services/manuscriptAnalysisService.js`
  Detects section presence, writing quality signals, and methodology-related gaps.

- `backend/src/services/retrievalService.js`
  Builds the retrieval query, fetches related literature from OpenAlex and Crossref, and selects curated submission standards.

- `backend/src/services/reviewHeuristicsService.js`
  Produces a rule-based review with readiness score, concerns, and revision suggestions.

- `backend/src/services/llmService.js`
  Integrates Gemini for structured JSON review generation and embeddings-based ranking.

- `backend/src/services/pdfExtractionService.js`
  Extracts manuscript text from uploaded PDF files using `pdf-parse`.

- `backend/src/middleware/uploadMiddleware.js`
  Handles PDF upload validation and in-memory file parsing with `multer`.

- `backend/src/data/submissionStandards.js`
  Contains curated reporting and publication standards used as part of the RAG context.

## Frontend Architecture

The frontend is a static single-page interface located in `frontend/src/` and served directly by the Express backend.

Key files:

- `frontend/src/index.html`
  Defines the review workbench, service status panel, and results layout.

- `frontend/src/styles.css`
  Provides the responsive visual design and presentation for the manuscript review interface.

- `frontend/src/app.js`
  Fetches health/capability data, submits text or PDF review requests, and renders the structured review response.

## Review Flow

The current review pipeline works like this:

1. A user submits either raw manuscript text or a PDF.
2. If a PDF is uploaded, the backend extracts text from it.
3. The manuscript is analyzed for:
   - missing core sections
   - methodology signals
   - readability issues
   - reproducibility and ethics cues
4. A retrieval query is generated from the manuscript title, discipline, venue, and analysis signals.
5. Relevant context is gathered from:
   - OpenAlex
   - Crossref
   - curated reporting standards
6. A heuristic review is created.
7. If `GEMINI_API_KEY` is configured, Gemini generates a richer structured review grounded in the manuscript analysis and retrieval context.
8. If Gemini is unavailable, the heuristic review is returned instead.

## Available API Endpoints

### `GET /api/v1/health`

Returns service health and whether Gemini-backed review is configured.

### `GET /api/v1/reviews/capabilities`

Returns the currently supported ingestion modes and review capabilities.

### `POST /api/v1/reviews`

Accepts manuscript text directly as JSON.

Example request body:

```json
{
  "title": "A Retrieval-Augmented System for Pre-Submission Paper Review",
  "discipline": "machine-learning",
  "targetVenue": "NeurIPS",
  "abstract": "Short abstract here",
  "manuscript": "Full manuscript text here"
}
```

### `POST /api/v1/reviews/upload`

Accepts a multipart PDF upload.

Form fields:

- `paper`: the PDF file
- `title`: optional, inferred from filename if omitted
- `discipline`: optional
- `targetVenue`: optional
- `abstract`: optional

Example:

```bash
curl -X POST http://localhost:6069/api/v1/reviews/upload \
  -F "paper=@your-paper.pdf" \
  -F "discipline=machine-learning" \
  -F "targetVenue=NeurIPS"
```

## Review Output Shape

The current review response includes:

- `inputSummary`
- `analysis`
- `retrieval`
- `review`

For PDF uploads, the response also includes:

- `upload`
- `extraction`

The generated review currently contains:

- executive summary
- readiness score
- verdict
- section-by-section feedback
- major concerns
- improvement actions
- questions for the author
- evidence from standards and related literature

## Environment Variables

Create `backend/.env` based on `backend/.env.example`.

Current variables:

```env
PORT=6069
NODE_ENV=development
CORS_ORIGIN=*
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
GEMINI_EMBEDDING_MODEL=gemini-embedding-001
HTTP_TIMEOUT_MS=12000
MAX_RETRIEVED_PAPERS=8
```

## How To Run

From the `backend/` directory:

```bash
npm install
npm run dev
```

Or in production mode:

```bash
npm start
```

The backend runs on the port set in `.env` and also serves the frontend from `/`.

Once the server is running, open:

```text
http://localhost:6069/
```

You can still call the JSON API directly under `/api/v1/...`.

## Dependencies Added For Current Functionality

Important runtime dependencies being used right now:

- `express`
- `multer`
- `pdf-parse`
- `helmet`
- `cors`
- `morgan`
- `cookie-parser`
- `express-async-handler`

The project also contains several packages that are installed but not yet actively used in the current backend implementation.

## What Is Not Done Yet

The project is still in an early backend-first stage. The following are not implemented yet:

- persistent database models and storage
- user authentication and saved review history
- vector database or long-term document indexing
- citation-grounded chunk storage for uploaded manuscripts
- advanced reviewer personas or venue-specific scoring profiles
- batch processing for multiple papers
- tests for routes and services
- deployment setup

## Verification Done So Far

The backend has been verified locally for:

- application boot/import checks
- review orchestration in heuristic mode
- PDF extraction with a generated smoke-test PDF

Live external retrieval and Gemini responses depend on network access and valid API configuration.

## Current Status

PapRev currently has a functional backend foundation for:

- accepting manuscript content
- extracting text from PDFs
- analyzing paper completeness and quality signals
- retrieving supporting context for RAG
- generating structured pre-submission feedback

The next natural steps are frontend development, persistent storage, and richer review workflows.
