"use client";

import { useState } from "react";

type Result = {
  chunk_id: number;
  filename: string;
  chunk_index: number;
  content: string;
  score: number;
};

function ResultCard({ r }: { r: Result }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <div className="mb-2 flex items-center gap-2 text-sm">
        <span className="truncate font-medium">{r.filename}</span>
        <span className="text-muted">· chunk {r.chunk_index}</span>
        <span
          className="ml-auto shrink-0 rounded bg-accent/10 px-1.5 text-xs font-medium text-link"
          title="Cosine similarity: higher means closer in meaning"
        >
          {r.score.toFixed(3)}
        </span>
      </div>
      <p
        className={`whitespace-pre-wrap text-sm leading-relaxed text-muted ${
          open ? "" : "line-clamp-4"
        }`}
      >
        {r.content}
      </p>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="mt-2 text-xs text-link hover:underline"
      >
        {open ? "Show less" : "Show full excerpt"}
      </button>
    </div>
  );
}

export default function SearchPage() {
  const [question, setQuestion] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || loading) return;

    setLoading(true);
    setError("");
    setResults([]);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, top_k: 5 }),
      });
      const data = await res.json();

      if (res.ok && Array.isArray(data.results)) {
        setResults(data.results);
        setSearched(true);
      } else {
        setError(data.detail ?? `Unexpected response: ${JSON.stringify(data)}`);
      }
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <h1 className="text-xl font-semibold tracking-tight">Search your notes</h1>
      <p className="mt-1 text-sm text-muted">
        See which excerpts match a question, ranked by similarity. No AI answer, just retrieval.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Search for a topic or question..."
          className="flex-1 rounded-md border border-line bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
        <button
          type="submit"
          disabled={!question.trim() || loading}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      )}

      {loading && (
        <div className="mt-8 animate-pulse space-y-3" aria-label="Searching">
          <div className="h-20 rounded-lg bg-line" />
          <div className="h-20 rounded-lg bg-line" />
          <div className="h-20 rounded-lg bg-line" />
        </div>
      )}

      {!loading && !error && !searched && (
        <p className="mt-8 text-sm text-muted">
          Type a question above to see the best-matching excerpts from your documents.
        </p>
      )}

      {!loading && !error && searched && results.length === 0 && (
        <p className="mt-8 text-sm text-muted">
          No results. Upload a document first, then search again.
        </p>
      )}

      {results.length > 0 && (
        <div className="mt-8 flex flex-col gap-3">
          {results.map((r) => (
            <ResultCard key={r.chunk_id} r={r} />
          ))}
        </div>
      )}
    </main>
  );
}