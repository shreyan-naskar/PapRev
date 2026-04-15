import json
import os
import urllib.request
from typing import Any

from fastapi import BackgroundTasks, FastAPI, Header, HTTPException
from dotenv import load_dotenv
from pydantic import BaseModel, Field

load_dotenv()

from core.chunker import chunk_paper
from core.parser import parse_paper
from core.report import aggregate_report
from core.retriever import retrieve_context
from core.reviewer import review_dimensions


class PaperPayload(BaseModel):
    id: str
    title: str | None = None
    originalFilename: str
    publicUrl: str | None = None
    storagePath: str | None = None
    venue: str | None = None
    domain: str | None = "general"
    notes: str | None = ""


class WebhookPayload(BaseModel):
    progressUrl: str
    completeUrl: str
    secret: str


class ReviewRequest(BaseModel):
    reviewJobId: str
    paperId: str
    userId: str
    paper: PaperPayload
    manuscript: str | None = None
    abstract: str | None = None
    webhook: WebhookPayload


app = FastAPI(title="PapRev RAG Service", version="1.0.0")


def _post_json(url: str, payload: dict[str, Any], secret: str) -> None:
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "x-internal-secret": secret,
        },
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=30):
        return


def _emit_progress(payload: ReviewRequest, status: str, progress: int, current_stage: str) -> None:
    _post_json(
        payload.webhook.progressUrl,
        {
            "reviewJobId": payload.reviewJobId,
            "paperId": payload.paperId,
            "status": status,
            "progress": progress,
            "currentStage": current_stage,
        },
        payload.webhook.secret,
    )


def _emit_completion(payload: ReviewRequest, report: dict[str, Any]) -> None:
    _post_json(
        payload.webhook.completeUrl,
        {
            "reviewJobId": payload.reviewJobId,
            "paperId": payload.paperId,
            "report": report,
        },
        payload.webhook.secret,
    )


def _emit_failure(payload: ReviewRequest, message: str) -> None:
    _post_json(
        payload.webhook.completeUrl,
        {
            "reviewJobId": payload.reviewJobId,
            "paperId": payload.paperId,
            "status": "failed",
            "errorMessage": message,
        },
        payload.webhook.secret,
    )


def _run_pipeline(payload: ReviewRequest) -> None:
    print(f"[pipeline] starting job={payload.reviewJobId} paper={payload.paperId}", flush=True)
    try:
        _emit_progress(payload, "parsing", 18, "Parsing structure")
        parsed = parse_paper(
            {
                "paper": payload.paper.model_dump(),
                "manuscript": payload.manuscript or payload.abstract or "",
            }
        )

        _emit_progress(payload, "retrieving", 34, "Building retrieval queries")
        chunk_paper(parsed)

        _emit_progress(payload, "retrieving", 52, "Retrieving live literature")
        context = retrieve_context(parsed)

        _emit_progress(payload, "reviewing", 74, "Reviewing submission dimensions")
        review_result = review_dimensions(parsed, context)

        _emit_progress(payload, "aggregating", 90, "Aggregating scores")
        report = aggregate_report(parsed, context, review_result)

        _emit_completion(payload, report)
    except Exception as error:
        print(f"[pipeline] FAILED at stage — {type(error).__name__}: {error}", flush=True)
        try:
            _emit_failure(payload, str(error))
        except Exception as notify_error:
            print(f"[pipeline] could not notify backend: {notify_error}", flush=True)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "paprev-rag-service",
        "providers": {
            "gemini": bool(os.getenv("GEMINI_API_KEY")),
            "tavily": bool(os.getenv("TAVILY_API_KEY")),
            "qdrant": bool(os.getenv("QDRANT_URL")),
            "grobid": bool(os.getenv("GROBID_URL")),
            "ollama": bool(os.getenv("OLLAMA_URL")),
        },
    }


@app.post("/reviews")
def create_review_job(
    payload: ReviewRequest,
    background_tasks: BackgroundTasks,
    x_internal_secret: str | None = Header(default=None),
):
    if x_internal_secret != os.getenv("INTERNAL_WEBHOOK_SECRET", "paprev-internal-secret"):
        raise HTTPException(status_code=401, detail="Invalid internal secret.")

    background_tasks.add_task(_run_pipeline, payload)
    return {
        "accepted": True,
        "reviewJobId": payload.reviewJobId,
        "paperId": payload.paperId,
    }
