from core.embedder import embed_text
from core.vector_store import search_qdrant
from core.web_retriever import arxiv_search, tavily_search


def retrieve_context(parsed_paper: dict) -> dict:
    query = " ".join(
        item
        for item in [
            parsed_paper.get("title") or "",
            "methodology" if parsed_paper.get("sectionPresence", {}).get("methodology") else "research design",
            "literature review",
        ]
        if item
    )

    vector_results = search_qdrant(embed_text(query), limit=5)
    web_results = tavily_search(query)
    arxiv_results = arxiv_search(query)

    return {
        "query": query,
        "vectorResults": vector_results,
        "webResults": web_results,
        "arxivResults": arxiv_results,
    }
