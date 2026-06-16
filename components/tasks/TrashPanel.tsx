"use client";

import { useEffect, useState } from "react";
import { RotateCcw, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/supabase/types";

interface ArchivedTask extends Task {
  companies?: { id: string; name: string; icon: string; accent_color: string; slug: string; sort_order: number };
}

interface Props {
  onClose: () => void;
  onRestored: () => void;
}

export function TrashPanel({ onClose, onRestored }: Props) {
  const [tasks, setTasks] = useState<ArchivedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/tasks/trash");
    if (res.ok) {
      const data = await res.json();
      setTasks(data.tasks ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function restore(id: string) {
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "todo" }),
    });
    setTasks(prev => prev.filter(t => t.id !== id));
    onRestored();
  }

  async function deletePermanently(id: string) {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    setTasks(prev => prev.filter(t => t.id !== id));
  }

  async function cleanupOld() {
    setCleaning(true);
    await fetch("/api/tasks/trash", { method: "DELETE" });
    await load();
    setCleaning(false);
  }

  const oldCount = tasks.filter(t => {
    const diff = Date.now() - new Date(t.updated_at).getTime();
    return diff > 7 * 24 * 60 * 60 * 1000;
  }).length;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-0 md:p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative flex flex-col w-full max-w-md h-full md:h-auto md:max-h-[80vh] rounded-none md:rounded-2xl border shadow-2xl overflow-hidden"
        style={{ background: "var(--surface)", borderColor: "var(--edge)" }}
      >
        {/* Header */}
        <div
          className="flex shrink-0 items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: "var(--edge)" }}
        >
          <div>
            <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              🗑 Kosz
            </h2>
            <p className="text-xs" style={{ color: "var(--text-2)" }}>
              {tasks.length} zadań · usuwa się po 7 dniach
            </p>
          </div>
          <div className="flex items-center gap-2">
            {oldCount > 0 && (
              <button
                type="button"
                onClick={cleanupOld}
                disabled={cleaning}
                className="text-xs text-red-400 hover:text-red-300 transition-colors border border-red-500/30 rounded-lg px-2 py-1"
              >
                {cleaning ? "Czyszczę…" : `Usuń stare (${oldCount})`}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 transition-colors"
              style={{ color: "var(--text-dim)" }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Task list */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <p className="py-8 text-center text-xs" style={{ color: "var(--text-dim)" }}>
              Ładowanie…
            </p>
          )}
          {!loading && tasks.length === 0 && (
            <p className="py-12 text-center text-xs" style={{ color: "var(--text-dim)" }}>
              Kosz jest pusty
            </p>
          )}
          {!loading && tasks.map(task => {
            const daysAgo = Math.floor(
              (Date.now() - new Date(task.updated_at).getTime()) / (24 * 60 * 60 * 1000),
            );
            const isOld = daysAgo >= 7;
            return (
              <div
                key={task.id}
                className="flex items-start gap-3 px-5 py-3 border-b"
                style={{ borderColor: "var(--edge)" }}
              >
                <div className="flex-1 min-w-0">
                  <p
                    className={cn("text-xs leading-relaxed", isOld && "opacity-50")}
                    style={{ color: "var(--text)" }}
                  >
                    {task.title}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2">
                    {task.companies && (
                      <span className="text-[10px]" style={{ color: "var(--text-dim)" }}>
                        {task.companies.icon} {task.companies.name}
                      </span>
                    )}
                    <span
                      className={cn(
                        "text-[10px]",
                        isOld ? "text-red-400" : "text-zinc-500",
                      )}
                    >
                      {daysAgo === 0 ? "dziś" : `${daysAgo} dni temu`}
                      {isOld && " · usunie się przy czyszczeniu"}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => restore(task.id)}
                    className="flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] transition-colors"
                    style={{
                      borderColor: "var(--edge)",
                      color: "var(--text-2)",
                    }}
                    title="Przywróć"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Przywróć
                  </button>
                  <button
                    type="button"
                    onClick={() => deletePermanently(task.id)}
                    className="rounded-lg border border-red-500/20 p-1.5 text-red-500/60 hover:text-red-400 hover:border-red-500/40 transition-colors"
                    title="Usuń na zawsze"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
