import json
import os
import urllib.parse
import urllib.request


def search_qdrant(vector: list[float], limit: int = 5) -> list[dict]:
    qdrant_url = os.getenv("QDRANT_URL", "").rstrip("/")
    collection = os.getenv("QDRANT_COLLECTION", "paprev-knowledge-base")

    if not qdrant_url:
        return []

    payload = json.dumps({"vector": vector, "limit": limit, "with_payload": True}).encode("utf-8")
    request = urllib.request.Request(
        f"{qdrant_url}/collections/{urllib.parse.quote(collection)}/points/search",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            data = json.loads(response.read().decode("utf-8"))
        return data.get("result", [])
    except Exception:
        return []
