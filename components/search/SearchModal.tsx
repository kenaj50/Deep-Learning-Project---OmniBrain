"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Company, Task } from "@/lib/supabase/types";
import { TaskModal } from "@/components/tasks/TaskModal";

interface SearchTask extends Task {
  companies: Company;
}

interface Props {
  companies: Company[];
  onClose: () => void;
  onDataChanged: () => void;
}

const PRIORITY_COLOR: Record<string, string> = {
  urgent: "text-red-400",
  high:   "text-orange-400",
  medium: "text-zinc-500",
  low:    "text-zinc-600",
};

const STATUS_LABEL: Record<string, string> = {
  todo:        "do zrobienia",
  in_progress: "w trakcie",
  done:        "zrobione",
  blocked:     "zablokowane",
};

export function SearchModal({ companies, onClose, onDataChanged }: Props) {
  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState<SearchTask[]>([]);
  const [loading, setLoading]   = useState(false);
  const [selected, setSelected] = useState(0);
  const [editTask, setEditTask] = useState<Task | null>(null);

  const inputRef   = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) { setResults([]); setLoading(false); return; }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.tasks ?? []);
        setSelected(0);
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") { if (editTask) setEditTask(null); else onClose(); return; }
    if (results.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected((v) => Math.min(v + 1, results.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setSelected((v) => Math.max(v - 1, 0)); }
    if (e.key === "Enter" && results[selected]) { e.preventDefault(); setEditTask(results[selected]); }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden mx-4"
          style={{ background: "var(--surface)", borderColor: "var(--edge)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Input row */}
          <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "var(--edge)" }}>
            <Search className="h-4 w-4 shrink-0 text-zinc-500" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Szukaj tasków po nazwie lub opisie…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-600"
              style={{ color: "var(--text)" }}
            />
            {query ? (
              <button type="button" onClick={() => setQuery("")} className="text-zinc-600 hover:text-zinc-400 transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <kbd className="hidden sm:flex h-5 items-center rounded border px-1.5 font-mono text-[10px] text-zinc-700" style={{ borderColor: "var(--edge)" }}>Esc</kbd>
            )}
          </div>

          {/* Results */}
          <div className="max-h-[55vh] overflow-y-auto">
            {query.trim().length < 2 && !loading && (
              <p className="py-10 text-center text-xs text-zinc-600">Wpisz min. 2 znaki…</p>
            )}
            {loading && (
              <p className="py-10 text-center text-xs text-zinc-600">Szukam…</p>
            )}
            {!loading && query.trim().length >= 2 && results.length === 0 && (
              <p className="py-10 text-center text-xs text-zinc-600">Brak wyników dla „{query}"</p>
            )}

            {results.map((task, i) => {
              const co = task.companies;
              const accentColor = co?.accent_color ?? "#8b5cf6";
              return (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => setEditTask(task)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors border-b last:border-0",
                    i === selected ? "bg-zinc-800/70" : "hover:bg-zinc-800/30",
                  )}
                  style={{ borderColor: "var(--edge)" }}
                >
                  <span className="text-lg shrink-0 leading-none">{co?.icon ?? "📋"}</span>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-xs font-medium truncate", task.status === "done" ? "line-through text-zinc-600" : "text-zinc-200")}>
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="mt-0.5 text-[10px] text-zinc-600 truncate">{task.description}</p>
                    )}
                    {task.due_date && (
                      <p className="mt-0.5 text-[10px] text-zinc-700">termin: {task.due_date}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span
                      className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                      style={{ background: accentColor + "22", color: accentColor }}
                    >
                      {co?.name ?? "—"}
                    </span>
                    <span className={cn("text-[10px]", PRIORITY_COLOR[task.priority] ?? "text-zinc-600")}>
                      {task.priority}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer hints */}
          {results.length > 0 && (
            <div className="flex items-center gap-4 border-t px-4 py-1.5 text-[10px] text-zinc-700" style={{ borderColor: "var(--edge)" }}>
              <span>↑↓ nawigacja</span>
              <span>↵ otwórz</span>
              <span>Esc zamknij</span>
            </div>
          )}
        </div>
      </div>

      {editTask && (
        <TaskModal
          mode="edit"
          task={editTask}
          companies={companies}
          onSave={() => { onDataChanged(); setEditTask(null); }}
          onClose={() => setEditTask(null)}
        />
      )}
    </>
  );
}
