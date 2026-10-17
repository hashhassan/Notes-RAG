import re

# What counts as a heading. Add patterns here for your own documents.
HEADING_RE = re.compile(r"^(#{1,6}\s+\S|Phase\s+\d+\b)")


def _split_sentences(line: str) -> list[str]:
    return [p for p in re.split(r"(?<=[.!?])\s+", line) if p]


def _split_sections(text: str) -> list[tuple[str, list[str]]]:
    sections = []
    heading = ""
    units: list[str] = []
    for line in re.split(r"\n+", text):
        line = line.strip()
        if not line:
            continue
        if HEADING_RE.match(line):
            if units:
                sections.append((heading, units))
            heading, units = line, []
        else:
            units.extend(_split_sentences(line))
    if units:
        sections.append((heading, units))
    return sections


def _join(heading: str, units: list[str]) -> str:
    body = " ".join(units)
    return f"{heading}\n{body}" if heading else body


def chunk_text(text: str, max_words: int = 120, overlap_words: int = 20) -> list[str]:
    chunks = []
    for heading, units in _split_sections(text):
        current: list[str] = []
        count = 0
        for unit in units:
            n = len(unit.split())

            if current and count + n > max_words:
                chunks.append(_join(heading, current))

                carry: list[str] = []
                carried = 0
                for u in reversed(current):
                    w = len(u.split())
                    if carried + w > overlap_words:
                        break
                    carry.insert(0, u)
                    carried += w
                current, count = carry, carried

            current.append(unit)
            count += n

        if current:
            chunks.append(_join(heading, current))
    return chunks