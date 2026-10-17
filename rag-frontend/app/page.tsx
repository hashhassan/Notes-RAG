"use client";

import { useRef, useState } from "react";
import Link from "next/link";

const ALLOWED = [".pdf", ".txt", ".md"];
const MAX_BYTES = 10 * 1024 * 1024;

type Saved = { filename: string; chunks: number; documentId: number };

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function pick(f: File | undefined) {
    if (!f) return;
    setSaved(null);

    const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
    if (!ALLOWED.includes(ext)) {
      setFile(null);
      setError("Unsupported file type. Use PDF, TXT or MD.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setFile(null);
      setError("File too large (10 MB max).");
      return;
    }

    setError("");
    setFile(f);
  }

  function clearFile() {
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || loading) return;

    setLoading(true);
    setError("");
    setSaved(null);

    try {
      const body = new FormData();
      body.append("file", file);

      const res = await fetch("/api/documents", { method: "POST", body });
      const data = await res.json();

      if (res.ok) {
        setSaved({
          filename: file.name,
          chunks: data.chunks,
          documentId: data.document_id,
        });
        clearFile();
      } else {
        setError(data.detail ?? "Upload failed.");
      }
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <h1 className="text-xl font-semibold tracking-tight">Upload a document</h1>
      <p className="mt-1 text-sm text-muted">
        Add PDF, TXT or Markdown files (up to 10 MB). They are split into chunks and indexed so
        you can ask questions about them.
      </p>

      <form onSubmit={handleSubmit} className="mt-6">
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            pick(e.dataTransfer.files?.[0]);
          }}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-6 py-10 text-center transition-colors focus-within:ring-2 focus-within:ring-accent/30 ${
            dragging ? "border-accent bg-accent/5" : "border-line bg-surface hover:border-accent"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.txt,.md"
            className="sr-only"
            onChange={(e) => pick(e.target.files?.[0])}
          />
          <span className="text-sm font-medium">Drop a file here, or click to browse</span>
          <span className="mt-1 text-xs text-muted">PDF, TXT or MD</span>
        </label>

        {file && (
          <div className="mt-3 flex items-center gap-3 rounded-lg border border-line bg-surface px-4 py-3 text-sm">
            <span className="truncate font-medium">{file.name}</span>
            <span className="shrink-0 text-muted">{formatSize(file.size)}</span>
            <button
              type="button"
              onClick={clearFile}
              disabled={loading}
              className="ml-auto shrink-0 text-xs text-link hover:underline disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={!file || loading}
          className="mt-4 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {loading ? "Processing..." : "Upload"}
        </button>
        {loading && (
          <p className="mt-2 text-xs text-muted">
            Extracting text and building embeddings. This can take a few seconds.
          </p>
        )}
      </form>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      )}

      {saved && (
        <div className="mt-4 rounded-lg border border-line bg-surface p-4 text-sm">
          <p>
            <span className="font-medium">{saved.filename}</span> saved: {saved.chunks} chunks
            (document #{saved.documentId}).
          </p>
          <Link
            href="/chat"
            className="mt-3 inline-block rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            Ask a question
          </Link>
        </div>
      )}
    </main>
  );
}