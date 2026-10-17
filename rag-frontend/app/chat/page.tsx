"use client";

import { useState } from "react";

type Source = {
  ref: number;
  filename: string;
  chunk_index: number;
  content: string;
  score: number | null;
};

type Turn = {
  question: string;
  answer: string;
  sources: Source[];
};

// Edit these to match the documents you have uploaded.
const EXAMPLES = [
  "How long is the plan for setting up logging and exception handling?",
  "How many reps of bicep curls should I do?",
];

function Answer({ text }: { text: string }) {
  const parts = text.split(/(\[\d+\])/g);
  return (
    <p className="whitespace-pre-wrap leading-relaxed">
      {parts.map((part, i) =>
        /^\[\d+\]$/.test(part) ? (
          <span
            key={i}
            className="mx-0.5 inline-block rounded bg-accent/10 px-1.5 text-xs font-medium text-link"
          >
            {part.slice(1, -1)}
          </span>
        ) : (
          part
        )
      )}
    </p>
  );
}

export default function ChatPage() {
  const [question, setQuestion] = useState("");
  const [turn, setTurn] = useState<Turn | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function ask(q: string) {
    const text = q.trim();
    if (!text || loading) return;

    setLoading(true);
    setError("");
    setTurn(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text }),
      });
      const data = await res.json();

      if (res.ok && typeof data.answer === "string" && Array.isArray(data.sources)) {
        const cleaned = data.answer.replace(/\*\*/g, "");
        const cited = new Set<number>(
          Array.from(cleaned.matchAll(/\[(\d+)\]/g), (m: RegExpMatchArray) => Number(m[1]))
        );
        setTurn({
          question: text,
          answer: cleaned,
          sources: data.sources.filter((s: Source) => cited.has(s.ref)),
        });
      } else {
        setError(data.detail ?? `Unexpected response: ${JSON.stringify(data)}`);
      }
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    ask(question);
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <h1 className="text-xl font-semibold tracking-tight">Chat with your notes</h1>
      <p className="mt-1 text-sm text-muted">
        Answers come only from your uploaded documents and cite the excerpts they use.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about your notes..."
          className="flex-1 rounded-md border border-line bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
        <button
          type="submit"
          disabled={!question.trim() || loading}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {loading ? "Thinking..." : "Ask"}
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

      {!turn && !loading && !error && (
        <div className="mt-8">
          <p className="mb-3 text-sm text-muted">Try asking:</p>
          <div className="flex flex-col items-start gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => {
                  setQuestion(ex);
                  ask(ex);
                }}
                className="rounded-md border border-line bg-surface px-3 py-2 text-left text-sm transition-colors hover:border-accent"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="mt-8 animate-pulse space-y-3" aria-label="Loading answer">
          <div className="h-4 w-3/4 rounded bg-line" />
          <div className="h-4 w-full rounded bg-line" />
          <div className="h-4 w-2/3 rounded bg-line" />
        </div>
      )}

      {turn && (
        <div className="mt-8">
          <p className="mb-2 text-sm text-muted">{turn.question}</p>
          <div className="rounded-lg border border-line bg-surface p-5">
            <Answer text={turn.answer} />
          </div>

          {turn.sources.length > 0 && (
            <section className="mt-6">
              <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                Sources
              </h2>
              <div className="flex flex-col gap-2">
                {turn.sources.map((s) => (
                  <details
                    key={s.ref}
                    className="group rounded-lg border border-line bg-surface"
                  >
                    <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm [&::-webkit-details-marker]:hidden">
                      <span className="text-muted transition-transform group-open:rotate-90">
                        ›
                      </span>
                      <span className="rounded bg-accent/10 px-1.5 text-xs font-medium text-link">
                        {s.ref}
                      </span>
                      <span className="truncate">{s.filename}</span>
                      <span className="text-muted">· chunk {s.chunk_index}</span>
                    </summary>
                    <p className="whitespace-pre-wrap border-t border-line px-4 py-3 text-sm leading-relaxed text-muted">
                      {s.content}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
}