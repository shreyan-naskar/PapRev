import re


def chunk_paper(parsed_paper: dict) -> list[dict]:
    text = parsed_paper.get("text", "")
    if not text:
        return []

    paragraphs = [block.strip() for block in re.split(r"\n\s*\n", text) if block.strip()]
    chunks = []

    for index, paragraph in enumerate(paragraphs):
        words = paragraph.split()
        if len(words) <= 160:
            chunks.append({"id": f"chunk-{index}", "text": paragraph, "type": "structural"})
            continue

        step = 120
        window = 180
        for offset in range(0, len(words), step):
            part = " ".join(words[offset : offset + window]).strip()
            if part:
                chunks.append(
                    {
                        "id": f"chunk-{index}-{offset}",
                        "text": part,
                        "type": "sliding-window",
                    }
                )

    return chunks
