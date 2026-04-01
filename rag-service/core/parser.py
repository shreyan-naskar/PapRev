import io
import json
import os
import re
import urllib.request
import xml.etree.ElementTree as ET

from pypdf import PdfReader


SECTION_PATTERNS = {
    "abstract": re.compile(r"\babstract\b", re.I),
    "introduction": re.compile(r"\bintroduction\b", re.I),
    "literature": re.compile(r"\b(related work|literature review|background)\b", re.I),
    "methodology": re.compile(r"\b(methodology|methods|approach|experimental setup)\b", re.I),
    "results": re.compile(r"\b(results|evaluation|findings)\b", re.I),
    "discussion": re.compile(r"\bdiscussion\b", re.I),
    "conclusion": re.compile(r"\b(conclusion|future work)\b", re.I),
    "references": re.compile(r"\b(references|bibliography)\b", re.I),
}


def _fetch_bytes(url: str) -> bytes:
    with urllib.request.urlopen(url, timeout=20) as response:
        return response.read()


def _extract_with_grobid(pdf_bytes: bytes) -> str:
    grobid_url = os.getenv("GROBID_URL", "").rstrip("/")
    if not grobid_url:
        return ""

    boundary = "----PapRevBoundary"
    body = (
        f"--{boundary}\r\n"
        'Content-Disposition: form-data; name="input"; filename="paper.pdf"\r\n'
        "Content-Type: application/pdf\r\n\r\n"
    ).encode("utf-8") + pdf_bytes + f"\r\n--{boundary}--\r\n".encode("utf-8")

    request = urllib.request.Request(
        f"{grobid_url}/api/processFulltextDocument",
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=45) as response:
            xml_payload = response.read().decode("utf-8", errors="ignore")
    except Exception:
        return ""

    try:
        root = ET.fromstring(xml_payload)
        text_nodes = [node.text.strip() for node in root.iter() if node.text and node.text.strip()]
        return "\n".join(text_nodes)
    except Exception:
        return ""


def _extract_with_pypdf(pdf_bytes: bytes) -> str:
    reader = PdfReader(io.BytesIO(pdf_bytes))
    return "\n".join((page.extract_text() or "") for page in reader.pages)


def parse_paper(payload: dict) -> dict:
    manuscript = payload.get("manuscript") or ""
    source_bytes = b""

    if not manuscript and payload.get("paper", {}).get("publicUrl"):
      # publicUrl is only used when the manuscript is not sent inline.
        source_bytes = _fetch_bytes(payload["paper"]["publicUrl"])
        manuscript = _extract_with_grobid(source_bytes) or _extract_with_pypdf(source_bytes)

    text = manuscript.strip()
    headings = []

    for line in text.splitlines():
        candidate = line.strip()
        if candidate and len(candidate) < 100 and candidate[0].isalnum():
            headings.append(candidate)

    section_presence = {
        name: bool(pattern.search(text)) for name, pattern in SECTION_PATTERNS.items()
    }

    missing_sections = [
        section
        for section in ["introduction", "methodology", "results", "conclusion", "references"]
        if not section_presence[section]
    ]

    return {
        "title": payload.get("paper", {}).get("title") or payload.get("paper", {}).get("originalFilename"),
        "text": text,
        "headings": headings[:40],
        "sectionPresence": section_presence,
        "missingSections": missing_sections,
        "wordCount": len(re.findall(r"\w+", text)),
        "sourceBytesPresent": bool(source_bytes),
    }
