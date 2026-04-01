def aggregate_report(parsed_paper: dict, context: dict, review_result: dict) -> dict:
    findings = review_result.get("findings", [])
    meta = review_result.get("meta", {})
    severity_weights = {"critical": 18, "moderate": 10, "minor": 4}
    penalty = sum(severity_weights.get(item.get("severity", "minor"), 4) for item in findings)
    readiness_score = max(28, min(96, 100 - penalty))

    dimension_scores = {}
    for finding in findings:
        dimension_scores[finding["dimensionName"]] = max(
            1.0,
            round((readiness_score / 10) - (0.5 if finding["severity"] == "critical" else 0.2), 1),
        )

    return {
        "analysis": {
            "missingCoreSections": parsed_paper.get("missingSections", []),
            "sectionPresence": parsed_paper.get("sectionPresence", {}),
            "writingSignals": {
                "wordCount": parsed_paper.get("wordCount", 0),
            },
        },
        "review": {
            "readinessScore": readiness_score,
            "executiveSummary": "PapRev RAG service generated a structured pre-submission review.",
            "verdict": (
                "Promising draft with targeted revisions remaining."
                if readiness_score >= 70
                else "Substantial revision is recommended before submission."
            ),
            "improvementActions": [item["suggestion"] for item in findings[:6]],
            "questionsForAuthor": [
                "Which claims require stronger citation support?",
                "What experiments or clarifications would most increase reviewer confidence?",
            ],
            "majorConcerns": findings[:5],
            "evidence": {
                "standardsConsidered": [],
                "relatedLiterature": [
                    {
                        "title": item.get("title") or item.get("url") or "Retrieved source",
                        "source": item.get("source", "external"),
                        "year": item.get("year"),
                        "url": item.get("url"),
                    }
                    for item in (context.get("webResults", []) + context.get("arxivResults", []))[:6]
                ],
            },
            "findings": findings,
            "meta": meta,
        },
        "overallScore": round(readiness_score / 10, 1),
        "dimensionScores": dimension_scores,
        "missingSections": parsed_paper.get("missingSections", []),
        "findings": findings,
        "prioritizedRecommendations": [item["suggestion"] for item in findings[:6]],
        "retrievedSources": [
            {
                "title": item.get("title") or item.get("payload", {}).get("title") or "Retrieved source",
                "url": item.get("url") or item.get("payload", {}).get("url"),
                "source": item.get("source", "knowledge-base"),
            }
            for item in (context.get("vectorResults", []) + context.get("webResults", []) + context.get("arxivResults", []))[:10]
        ],
        "meta": meta,
    }
