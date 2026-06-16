"use client";

import { useEffect, useRef, useState } from "react";
import { Activity, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogEntry {
  id: string;
  at: number;
  duration?: number;
  model: string;
  userText: string;
  tools: string[];
  actions?: { action: string; title?: string; success: boolean }[];
}

const MODEL_SHORT: Record<string, string> = {
  "claude-sonnet":  "Sonnet",
  "claude-haiku":   "Haiku",
  "gemini-flash":   "Gemma",
  "llama-70b":      "Llama",
  "deepseek-r1":    "Qwen",
  "nemotron-120b":  "Nemotron 120B",
  "nemotron-550b":  "Nemotron 550B",
  "ollama":         "Ollama",
};

const TOOL_LABELS: Record<string, string> = {
  createTask:       "createTask",
  updateTaskStatus: "updateStatus",
  updateTask:       "updateTask",
  deleteTask:       "deleteTask",
  listTasks:        "listTasks",
  getDailyBriefing: "briefing",
  getWeeklyReview:  "weeklyReview",
  logWellbeing:     "wellbeing",
};

const ACTION_TOOLS = new Set(["createTask", "updateTaskStatus", "updateTask", "deleteTask", "logWellbeing"]);

function formatTime(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatAt(ts: number) {
  return new Date(ts).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function LogPanel() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onLog = (e: Event) => {
      const d = (e as CustomEvent).detail as LogEntry;
      setLogs((prev) => [d, ...prev].slice(0, 100));
    };
    const onActions = (e: Event) => {
      const { msgId, results } = (e as CustomEvent).detail as { msgId: string; results: LogEntry["actions"] };
      setLogs((prev) =>
        prev.map((entry) =>
          entry.id === msgId ? { ...entry, actions: results } : entry,
        ),
      );
    };
    window.addEventListener("omni-ai-log", onLog);
    window.addEventListener("omni-ai-actions", onActions);
    return () => {
      window.removeEventListener("omni-ai-log", onLog);
      window.removeEventListener("omni-ai-actions", onActions);
    };
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-800/80 px-4 py-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-zinc-400" />
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Logi AI</h2>
            <p className="text-xs text-zinc-500">{logs.length} zapytań w tej sesji</p>
          </div>
        </div>
        {logs.length > 0 && (
          <button
            type="button"
            onClick={() => setLogs([])}
            className="text-zinc-600 hover:text-red-400 transition-colors"
            title="Wyczyść logi"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-12">
            <Activity className="h-8 w-8 text-zinc-700" />
            <p className="text-xs text-zinc-600">Wyślij wiadomość do AI — logi pojawią się tutaj</p>
          </div>
        ) : (
          logs.map((log) => <LogCard key={log.id} log={log} />)
        )}
      </div>
    </div>
  );
}

function LogCard({ log }: { log: LogEntry }) {
  const actionTools = log.tools.filter((t) => ACTION_TOOLS.has(t));
  const dataTools   = log.tools.filter((t) => !ACTION_TOOLS.has(t));

  return (
    <div
      className="rounded-xl border p-3 space-y-2 text-[11px]"
      style={{ background: "var(--surface)", borderColor: "var(--edge)" }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-zinc-600">{formatAt(log.at)}</span>
          <span
            className={cn(
              "rounded px-1.5 py-0.5 font-medium",
              log.model.startsWith("claude")
                ? "bg-violet-500/15 text-violet-300"
                : "bg-emerald-500/15 text-emerald-400",
            )}
          >
            {MODEL_SHORT[log.model] ?? log.model}
          </span>
        </div>
        {log.duration != null && (
          <span className={cn(
            "font-mono",
            log.duration > 10000 ? "text-amber-400" : "text-zinc-500",
          )}>
            {formatTime(log.duration)}
          </span>
        )}
      </div>

      {/* User prompt (truncated) */}
      <p className="text-zinc-400 leading-relaxed line-clamp-2 border-l-2 border-zinc-700 pl-2">
        {log.userText}
      </p>

      {/* Tools called */}
      {log.tools.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {dataTools.map((t) => (
            <span key={t} className="rounded px-1.5 py-0.5 bg-blue-500/10 text-blue-400/80 font-mono">
              📊 {TOOL_LABELS[t] ?? t}
            </span>
          ))}
          {actionTools.map((t) => (
            <span key={t} className="rounded px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400/80 font-mono">
              ⚡ {TOOL_LABELS[t] ?? t}
            </span>
          ))}
        </div>
      )}

      {/* Action results (from free models) */}
      {log.actions && log.actions.length > 0 && (
        <div className="space-y-0.5 border-t border-zinc-800 pt-1.5">
          {log.actions.map((r, i) => (
            <div key={i} className={r.success ? "text-emerald-400/80" : "text-red-400/80"}>
              {r.success ? "✓" : "✗"}{" "}
              {r.action === "createTask"
                ? `createTask: ${r.title ?? "?"}`
                : r.action}
            </div>
          ))}
        </div>
      )}

      {/* No tools used */}
      {log.tools.length === 0 && !log.actions && (
        <span className="text-zinc-700">brak tool calls</span>
      )}
    </div>
  );
}
