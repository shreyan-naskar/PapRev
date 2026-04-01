import json
import os
import urllib.request


def _hash_embed(text: str) -> list[float]:
    buckets = [0.0] * 16
    for index, token in enumerate(text.lower().split()):
        buckets[index % 16] += (sum(ord(char) for char in token) % 97) / 100.0
    return buckets


def embed_text(text: str) -> list[float]:
    ollama_url = os.getenv("OLLAMA_URL", "").rstrip("/")
    model_name = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")

    if not ollama_url:
        return _hash_embed(text)

    payload = json.dumps({"model": model_name, "input": text}).encode("utf-8")
    request = urllib.request.Request(
        f"{ollama_url}/api/embed",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            data = json.loads(response.read().decode("utf-8"))
        embeddings = data.get("embeddings") or []
        if embeddings:
            return embeddings[0]
    except Exception:
        pass

    return _hash_embed(text)
