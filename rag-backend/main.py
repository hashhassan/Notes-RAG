import os
import tempfile
from pathlib import Path
from pydantic import BaseModel
from search import search_chunks, add_neighbors

from fastapi import File,HTTPException, UploadFile
from ingest import ingest_file
from fastapi import FastAPI
from llm import generate_answer


app = FastAPI()

@app.get("/health")

def health():
    return {"status": "healthy"}

ALLOWED_TYPES = {".pdf", ".txt", ".md"}
MAX_BYTES = 10 * 1024 * 1024  # 10 MB


@app.post("/documents")
def upload_document(file: UploadFile = File(...)):
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported file type. Use PDF, TXT or MD.")

    data = file.file.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="File too large (10 MB max).")

    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(data)
            tmp_path = tmp.name
        return ingest_file(tmp_path, file.filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)

class SearchRequest(BaseModel):
    question: str
    top_k: int = 5


@app.post("/search")
def search(req: SearchRequest):
    question = req.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question is empty.")

    top_k = min(max(req.top_k, 1), 20)
    return {"results": search_chunks(question, top_k)}

MIN_SCORE = 0.20


class ChatRequest(BaseModel):
    question: str
    top_k: int = 5


@app.post("/chat")
def chat(req: ChatRequest):
    question = req.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question is empty.")

    top_k = min(max(req.top_k, 1), 20)
    hits = [c for c in search_chunks(question, top_k) if c["score"] >= MIN_SCORE]

    if not hits:
        return {"answer": "I couldn't find anything relevant in your notes.", "sources": []}

    chunks = add_neighbors(hits, window=1)

    try:
        answer = generate_answer(question, chunks)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM request failed: {e}")

    sources = [
        {
            "ref": i,
            "filename": c["filename"],
            "chunk_index": c["chunk_index"],
            "content": c["content"],
            "score": c["score"],
        }
        for i, c in enumerate(chunks, start=1)
    ]
    return {"answer": answer, "sources": sources}