import json
import os
import urllib.request


DIMENSIONS = [
    "completeness",
    "literature",
    "methodology",
    "novelty",
    "statistics",
    "reproducibility",
    "writing",
    "ethics",
]


def _extract_json_blob(text: str) -> dict | None:
    candidate = (text or "").strip()
    if not candidate:
        return None

    if candidate.startswith("```"):
        candidate = candidate.strip("`")
        if candidate.lower().startswith("json"):
            candidate = candidate[4:].strip()

    try:
        parsed = json.loads(candidate)
        return parsed if isinstance(parsed, dict) else None
    except Exception:
        start = candidate.find("{")
        end = candidate.rfind("}")
        if start != -1 and end != -1 and end > start:
            try:
                parsed = json.loads(candidate[start : end + 1])
                return parsed if isinstance(parsed, dict) else None
            except Exception:
                return None
    return None


def _gemini_review(prompt: str) -> dict | None:
    api_key = os.getenv("GEMINI_API_KEY", "")
    model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    if not api_key:
        return None

    payload = json.dumps(
        {
            "system_instruction": {
                "parts": [
                    {
                        "text": "Return only valid JSON with keys title, severity, description, suggestion, confidence.",
                    }
                ]
            },
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": prompt}],
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "responseMimeType": "application/json",
            },
        }
    ).encode("utf-8")

    request = urllib.request.Request(
        f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
        data=payload,
        headers={"Content-Type": "application/json", "x-goog-api-key": api_key},
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=45) as response:
            data = json.loads(response.read().decode("utf-8"))
        parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
        content = "".join(
            part.get("text", "") for part in parts if not part.get("thought", False)
        ).strip()
        result = _extract_json_blob(content)
        if result is None:
            print(f"[reviewer] gemini returned unparseable content: {content[:200]}", flush=True)
        return result
    except Exception as exc:
        print(f"[reviewer] gemini request failed: {exc}", flush=True)
        return None


_CONFIDENCE_WORDS = {"high": 0.85, "medium": 0.65, "moderate": 0.65, "low": 0.4}


def _parse_confidence(value) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return _CONFIDENCE_WORDS.get(str(value).lower().strip(), 0.7)


def review_dimensions(parsed_paper: dict, context: dict) -> dict:
    findings = []
    missing_sections = parsed_paper.get("missingSections", [])
    gemini_success_count = 0
    gemini_attempted = bool(os.getenv("GEMINI_API_KEY", ""))

    print(f"[reviewer] gemini configured: {gemini_attempted}", flush=True)

    for dimension in DIMENSIONS:
        prompt = (
            f"Dimension: {dimension}\n"
            f"Title: {parsed_paper.get('title')}\n"
            f"Missing sections: {missing_sections}\n"
            f"Retrieved context count: {len(context.get('vectorResults', [])) + len(context.get('webResults', [])) + len(context.get('arxivResults', []))}\n"
            f"Text excerpt: {parsed_paper.get('text', '')[:2500]}"
        )

        gemini_result = _gemini_review(prompt)
        print(f"[reviewer] dimension={dimension} gemini={'ok' if gemini_result else 'failed→heuristic'}", flush=True)
        if gemini_result:
            gemini_success_count += 1
            findings.append(
                {
                    "dimensionName": dimension,
                    "severity": gemini_result.get("severity", "minor"),
                    "title": gemini_result.get("title", f"{dimension.title()} review"),
                    "description": gemini_result.get("description", ""),
                    "suggestion": gemini_result.get("suggestion", ""),
                    "affectedSection": dimension.title(),
                    "evidence": [],
                    "confidence": _parse_confidence(gemini_result.get("confidence", 0.7)),
                }
            )
            continue

        severity = "critical" if dimension == "completeness" and missing_sections else "moderate"
        description = (
            f"{dimension.title()} needs revision attention based on manuscript structure and retrieved context."
        )
        if dimension == "completeness" and missing_sections:
            description = f"Missing sections detected: {', '.join(missing_sections)}."

        findings.append(
            {
                "dimensionName": dimension,
                "severity": severity,
                "title": f"{dimension.title()} review",
                "description": description,
                "suggestion": f"Strengthen the {dimension} dimension before submission.",
                "affectedSection": dimension.title(),
                "evidence": [],
                "confidence": 0.62,
            }
        )

    print(
        f"[reviewer] complete — llmProvider={'gemini' if gemini_success_count else 'heuristic'} "
        f"geminiSuccessCount={gemini_success_count}/{len(DIMENSIONS)}",
        flush=True,
    )
    return {
        "findings": findings,
        "meta": {
            "llmProvider": "gemini" if gemini_success_count else "heuristic",
            "geminiConfigured": gemini_attempted,
            "geminiSuccessCount": gemini_success_count,
            "dimensionCount": len(DIMENSIONS),
        },
    }
