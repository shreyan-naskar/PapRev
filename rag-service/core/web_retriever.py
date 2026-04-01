import json
import os
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET


def tavily_search(query: str) -> list[dict]:
    api_key = os.getenv("TAVILY_API_KEY", "")
    if not api_key:
        return []

    payload = json.dumps(
        {
            "api_key": api_key,
            "query": query,
            "search_depth": "advanced",
            "max_results": 5,
        }
    ).encode("utf-8")
    request = urllib.request.Request(
        "https://api.tavily.com/search",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            data = json.loads(response.read().decode("utf-8"))
        return data.get("results", [])
    except Exception:
        return []


def arxiv_search(query: str) -> list[dict]:
    url = (
        "http://export.arxiv.org/api/query?"
        + urllib.parse.urlencode({"search_query": f"all:{query}", "start": 0, "max_results": 5})
    )

    try:
        with urllib.request.urlopen(url, timeout=20) as response:
            xml_payload = response.read().decode("utf-8", errors="ignore")
    except Exception:
        return []

    root = ET.fromstring(xml_payload)
    namespace = {"atom": "http://www.w3.org/2005/Atom"}
    entries = []
    for entry in root.findall("atom:entry", namespace):
        entries.append(
            {
                "title": (entry.findtext("atom:title", default="", namespaces=namespace) or "").strip(),
                "url": entry.findtext("atom:id", default="", namespaces=namespace),
                "summary": (entry.findtext("atom:summary", default="", namespaces=namespace) or "").strip(),
                "source": "arXiv",
            }
        )

    return entries
