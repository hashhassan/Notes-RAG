# Notes RAG

Ask questions about your own documents and get answers that cite the exact excerpts they came from.

Upload PDF, TXT or Markdown files, and the app splits them into chunks, indexes them, and answers questions using only what is in your notes. If the notes don't contain the answer, it says so instead of guessing.

## How it works

1. **Upload.** A file is validated (PDF, TXT or MD, up to 10 MB) and its text is extracted.
2. **Chunk.** The text is split into sentence-aware chunks of up to about 120 words, with a 20-word overlap between neighbors.
3. **Embed.** Each chunk is turned into a vector with the `all-MiniLM-L6-v2` model and stored in SQL Server next to its text.
4. **Retrieve.** A question is embedded the same way and compared to every stored chunk by cosine similarity. Chunks below a score cutoff are dropped, and the neighbors of each hit are added as context.
5. **Answer.** The retrieved chunks and the question go to an LLM on Groq with instructions to answer only from the excerpts and cite them as [1], [2], and so on.
6. **Show.** The chat page shows the answer and only the sources it cites.

## Tech stack

- Frontend: Next.js (App Router), React, Tailwind CSS
- Backend: FastAPI (Python 3.12)
- Database: Microsoft SQL Server 2022 Express
- Embeddings: sentence-transformers, `all-MiniLM-L6-v2`, run locally
- Retrieval: cosine similarity with NumPy
- LLM: Groq API, `openai/gpt-oss-120b`

## Prerequisites

- Windows (the commands below use PowerShell)
- Python 3.12
- Node.js and npm
- SQL Server 2022 Express and SQL Server Management Studio (or any tool that can run a `.sql` script)
- A free Groq API key from https://console.groq.com

## Setup

### 1. Database

Run `schema.sql` against your SQL Server instance. It creates the `NotesRag` database with a `documents` table and a `chunks` table. It contains no data.

TODO: confirm the database driver and connection settings in `rag-backend/db.py`, then describe them here (server name, authentication, ODBC driver version).

### 2. Backend

```powershell
cd rag-backend
py -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create a file named `.env` in `rag-backend` with your key:

```
GROQ_API_KEY=your-key-here
```

Start the server:

```powershell
uvicorn main:app --reload
```

The API runs at http://127.0.0.1:8000, and interactive docs are at http://127.0.0.1:8000/docs. The first upload downloads the embedding model (about 90 MB), so it is slower than later ones.

### 3. Frontend

In a second terminal:

```powershell
cd rag-frontend
npm install
npm run dev
```

Open http://localhost:3000.

## Usage

- **Upload** (`/`): drop in a document. You'll see how many chunks it produced.
- **Chat** (`/chat`): ask a question. The answer cites its sources, and each source expands to show the excerpt.
- **Search** (`/search`): shows the best-matching excerpts and their similarity scores, with no AI answer. Useful for checking retrieval quality.

## Configuration

- `MIN_SCORE` in `rag-backend/main.py` (default `0.20`) is the minimum similarity a chunk needs to be used. If good questions get "couldn't find anything relevant", lower it. If unrelated questions reach the model, raise it. The right value depends on your documents.
- The model name is set in `rag-backend/llm.py`. Groq retires and renames models from time to time, so check https://console.groq.com/docs/models if requests fail with "model not found".
- The Next.js API routes call the backend at `http://127.0.0.1:8000`.

## Project structure

```
rag-backend/    FastAPI service: extract.py, chunker.py, embedder.py, ingest.py,
                search.py, llm.py, db.py, main.py
rag-frontend/   Next.js app: upload page, chat page, search page,
                and route handlers under app/api/
schema.sql      Database schema, no data
```

## Limitations

- Single user, no authentication.
- Every question loads all stored embeddings into memory. That is fine for personal notes, but it will slow down with thousands of documents.
- Each question is answered on its own. There is no conversation memory, so follow-up questions like "and the next one?" won't work.
- Chunk quality depends on how well text can be extracted from the file. Scanned PDFs and complex tables may extract poorly.
- The similarity cutoff was tuned on a small set of documents.

## License

Released under the [MIT License](LICENSE).

Copyright (c) 2026 Muhammad Hassan Adil