"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[OmniBrain] Page error:", error);
  }, [error]);

  return (
    <div
      className="flex h-screen flex-col items-center justify-center gap-4 px-6 text-center"
      style={{ background: "#09090b", color: "#e4e4e7" }}
    >
      <span className="text-4xl">⚠️</span>
      <p className="text-sm text-zinc-400">Coś poszło nie tak. Spróbuj ponownie.</p>
      {error.message && (
        <p className="max-w-xs rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-mono text-zinc-600">
          {error.message}
        </p>
      )}
      <button
        onClick={reset}
        className="rounded-lg bg-violet-600 px-5 py-2 text-sm font-medium text-white hover:bg-violet-500 transition-colors"
      >
        Odśwież
      </button>
    </div>
  );
}
