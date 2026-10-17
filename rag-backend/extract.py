from pathlib import Path
from pypdf import PdfReader

def extract_text(path: str)->str:
    p=Path(path)
    suffix=p.suffix.lower()

    if suffix == ".pdf":
        reader = PdfReader(p)
        return "\n".join((page.extract_text() or "") for page in reader.pages)

    if suffix in (".txt", ".md"):
        return p.read_text(encoding="utf-8", errors="ignore")

    return ValueError(f"Unsupported file type: {suffix}")