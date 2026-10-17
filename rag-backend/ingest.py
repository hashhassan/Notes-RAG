from db import get_connection
from extract import extract_text
from chunker import chunk_text
from embedder import embed_texts

def ingest_file(path: str, filename: str) -> dict:
    text = extract_text(path)
    chunks = chunk_text(text)
    if not chunks:
        raise ValueError("No text found in file")

    vectors = embed_texts(chunks)

    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO documents (filename) OUTPUT INSERTED.id VALUES (?)",
            filename,
        )
        doc_id = cur.fetchone()[0]

        rows = [
            (doc_id, i, chunk, vec.tobytes())
            for i, (chunk, vec) in enumerate(zip(chunks, vectors))
        ]
        cur.executemany(
            "INSERT INTO chunks (document_id, chunk_index, content, embedding) "
            "VALUES (?, ?, ?, ?)",
            rows,
        )
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

    return {"document_id": doc_id, "chunks": len(chunks)}    