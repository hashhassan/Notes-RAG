import numpy as np
from db import get_connection
from embedder import embed_texts


def search_chunks(question: str, top_k: int = 5) -> list[dict]:
    query_vec = embed_texts([question])[0]

    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT c.id, c.document_id, d.filename, c.chunk_index,
                   c.content, c.embedding
            FROM chunks c
            JOIN documents d ON d.id = c.document_id
            WHERE c.embedding IS NOT NULL
        """)
        rows = cur.fetchall()
    finally:
        conn.close()

    if not rows:
        return []

    matrix = np.vstack([np.frombuffer(r.embedding, dtype=np.float32) for r in rows])
    scores = matrix @ query_vec

    best = np.argsort(scores)[::-1][:top_k]
    return [
        {
            "chunk_id": rows[i].id,
            "document_id": rows[i].document_id,
            "filename": rows[i].filename,
            "chunk_index": rows[i].chunk_index,
            "content": rows[i].content,
            "score": float(scores[i]),
        }
        for i in best
    ]

def add_neighbors(hits: list[dict], window: int = 1) -> list[dict]:
    if not hits:
        return hits

    wanted = {
        (h["document_id"], h["chunk_index"] + d)
        for h in hits
        for d in range(-window, window + 1)
    }
    hit_scores = {(h["document_id"], h["chunk_index"]): h["score"] for h in hits}

    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT c.id, c.document_id, d.filename, c.chunk_index, c.content
            FROM chunks c
            JOIN documents d ON d.id = c.document_id
        """)
        rows = cur.fetchall()
    finally:
        conn.close()

    result = []
    for r in rows:
        key = (r.document_id, r.chunk_index)
        if key in wanted:
            result.append({
                "chunk_id": r.id,
                "document_id": r.document_id,
                "filename": r.filename,
                "chunk_index": r.chunk_index,
                "content": r.content,
                "score": hit_scores.get(key),
            })

    result.sort(key=lambda c: (c["document_id"], c["chunk_index"]))
    return result