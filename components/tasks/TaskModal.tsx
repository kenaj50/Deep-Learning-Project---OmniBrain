"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Company, RecurrenceRule, Task } from "@/lib/supabase/types";

interface Props {
  mode: "create" | "edit";
  company?: Company;           // pre-set for create
  task?: Task;                 // pre-filled for edit
  companies: Company[];        // for edit: allow switching company
  initialDueDate?: string;     // pre-fill due date (from calendar)
  onSave: () => void;
  onClose: () => void;
}

const PRIORITIES = ["urgent", "high", "medium", "low"] as const;
const URGENCIES  = ["critical", "high", "normal", "low"] as const;
const STATUSES   = ["todo", "in_progress", "done", "blocked"] as const;

const RECURRENCE_LABELS: Record<string, string> = {
  "":         "Nie powtarza się",
  daily:      "🔄 Codziennie",
  weekdays:   "🔄 W tygodniu (pon–pt)",
  weekends:   "🔄 W weekend (sob–ndz)",
  weekly:     "🔄 W wybrane dni",
};
const WEEK_DAYS = [
  { key: "mon", label: "Pn" },
  { key: "tue", label: "Wt" },
  { key: "wed", label: "Śr" },
  { key: "thu", label: "Cz" },
  { key: "fri", label: "Pt" },
  { key: "sat", label: "So" },
  { key: "sun", label: "Nd" },
];

const PRIORITY_LABELS: Record<string, string> = {
  urgent: "🔴 Pilne (dziś)",
  high:   "🟠 Wysoki (tydzień)",
  medium: "🟡 Średni (miesiąc)",
  low:    "⚪ Niski",
};
const URGENCY_LABELS: Record<string, string> = {
  critical: "🚨 Critical — blokuje",
  high:     "⚠️ Wysoka",
  normal:   "— Normalna",
  low:      "↓ Niska",
};
const STATUS_LABELS: Record<string, string> = {
  todo:        "☐ Do zrobienia",
  in_progress: "⏳ W trakcie",
  done:        "✅ Zrobione",
  blocked:     "🚫 Zablokowane",
};

export function TaskModal({ mode, company, task, companies, initialDueDate, onSave, onClose }: Props) {
  const [title, setTitle]           = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [priority, setPriority]     = useState<string>(task?.priority ?? "medium");
  const [urgency, setUrgency]       = useState<string>(task?.urgency ?? "normal");
  const [status, setStatus]         = useState<string>(task?.status ?? "todo");
  const [dueDate, setDueDate]       = useState(task?.due_date ?? initialDueDate ?? "");
  const [companyId, setCompanyId]   = useState(task?.company_id ?? company?.id ?? "");
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule | "">(task?.recurrence_rule ?? "");
  const [recurrenceDays, setRecurrenceDays] = useState<string[]>(task?.recurrence_days ?? []);
  const [durationEstimate, setDurationEstimate] = useState(task?.duration_estimate ?? "");
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(false);

  // AI prediction state
  type AIPrediction = { estimated_minutes: number; estimated_hours: number; context: { sleep_hours: number; energy_level: number } };
  const [aiPrediction, setAiPrediction] = useState<AIPrediction | null>(null);
  const predictDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPrediction = useCallback((t: string, d: string) => {
    if (predictDebounce.current) clearTimeout(predictDebounce.current);
    if (t.trim().length < 3) { setAiPrediction(null); return; }
    predictDebounce.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: t, description: d }),
        });
        const data = await res.json();
        if (data.available && data.estimated_minutes) setAiPrediction(data as AIPrediction);
        else setAiPrediction(null);
      } catch { setAiPrediction(null); }
    }, 800);
  }, []);

  useEffect(() => { if (mode === "create") fetchPrediction(title, description); }, [title, description, mode, fetchPrediction]);

  function toggleDay(day: string) {
    setRecurrenceDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSave = async () => {
    if (!title.trim() || !companyId) return;
    setSaving(true);

    if (mode === "create") {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(), description, priority, urgency, due_date: dueDate || null, company_id: companyId,
          duration_estimate: durationEstimate.trim() || null,
          recurrence_rule: recurrenceRule || null,
          recurrence_days: recurrenceRule === "weekly" ? recurrenceDays : [],
        }),
      });
    } else if (task) {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(), description, priority, urgency, status, due_date: dueDate || null, company_id: companyId,
          duration_estimate: durationEstimate.trim() || null,
          recurrence_rule: recurrenceRule || null,
          recurrence_days: recurrenceRule === "weekly" ? recurrenceDays : [],
        }),
      });
    }

    setSaving(false);
    onSave();
    onClose();
  };

  const handleDelete = async () => {
    if (!task || !confirm("Na pewno usunąć zadanie? Tej operacji nie można cofnąć.")) return;
    setDeleting(true);
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "archived" }),
    });
    setDeleting(false);
    onSave();
    onClose();
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Panel */}
      <div
        className="w-full max-w-lg rounded-t-2xl border sm:rounded-2xl"
        style={{ background: "var(--surface)", borderColor: "var(--edge)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-5 py-4"
          style={{ borderColor: "var(--edge)" }}
        >
          <h2 className="text-sm font-semibold text-zinc-100">
            {mode === "create" ? "Nowe zadanie" : "Edytuj zadanie"}
          </h2>
          <button type="button" onClick={onClose} className="text-zinc-600 hover:text-zinc-300 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4 px-5 py-4 max-h-[70vh] overflow-y-auto" style={{ color: "var(--text)" }}>
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Tytuł *</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Co trzeba zrobić?"
              className="w-full rounded-lg border px-3 py-2 text-sm placeholder:text-zinc-500 focus:border-violet-500/50 focus:outline-none" style={{ background: "var(--surface-2)", borderColor: "var(--edge)", color: "var(--text)" }}
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Opis / notatka</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opcjonalny kontekst…"
              rows={2}
              className="w-full resize-none rounded-lg border px-3 py-2 text-sm placeholder:text-zinc-500 focus:border-violet-500/50 focus:outline-none" style={{ background: "var(--surface-2)", borderColor: "var(--edge)", color: "var(--text)" }}
            />
          </div>

          {/* Duration estimate */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-medium text-zinc-400">Szacowany czas</label>
              {aiPrediction && (
                <button
                  type="button"
                  onClick={() => setDurationEstimate(`~${aiPrediction.estimated_minutes}min`)}
                  className="flex items-center gap-1 rounded-md bg-violet-500/15 px-2 py-0.5 text-[10px] text-violet-300 hover:bg-violet-500/25 transition-colors"
                  title={`Sen: ${aiPrediction.context.sleep_hours}h · Energia: ${aiPrediction.context.energy_level}/10`}
                >
                  <Sparkles className="h-2.5 w-2.5" />
                  AI: ~{aiPrediction.estimated_minutes}min
                </button>
              )}
            </div>
            <input
              value={durationEstimate}
              onChange={(e) => setDurationEstimate(e.target.value)}
              placeholder="np. 30min, 2h, 1-3h, 2 dni"
              className="w-full rounded-lg border px-3 py-2 text-sm placeholder:text-zinc-500 focus:border-violet-500/50 focus:outline-none" style={{ background: "var(--surface-2)", borderColor: "var(--edge)", color: "var(--text)" }}
            />
          </div>

          {/* Priority + Urgency */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Priorytet</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-xs focus:outline-none" style={{ background: "var(--surface-2)", borderColor: "var(--edge)", color: "var(--text)" }}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Pilność</label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-xs focus:outline-none" style={{ background: "var(--surface-2)", borderColor: "var(--edge)", color: "var(--text)" }}
              >
                {URGENCIES.map((u) => (
                  <option key={u} value={u}>{URGENCY_LABELS[u]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Status (edit only) + Due date */}
          <div className="grid grid-cols-2 gap-3">
            {mode === "edit" && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-xs focus:outline-none" style={{ background: "var(--surface-2)", borderColor: "var(--edge)", color: "var(--text)" }}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>
            )}
            <div className={mode === "create" ? "col-span-2" : ""}>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Termin</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:border-violet-500/50 focus:outline-none" style={{ background: "var(--surface-2)", borderColor: "var(--edge)", color: "var(--text)", colorScheme: "inherit" }}
              />
            </div>
          </div>

          {/* Company (edit only — allow switching) */}
          {mode === "edit" && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Obszar</label>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-xs focus:outline-none" style={{ background: "var(--surface-2)", borderColor: "var(--edge)", color: "var(--text)" }}
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Recurrence */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Powtarzanie</label>
            <select
              value={recurrenceRule}
              onChange={(e) => {
                setRecurrenceRule(e.target.value as RecurrenceRule | "");
                if (e.target.value !== "weekly") setRecurrenceDays([]);
              }}
              className="w-full rounded-lg border px-3 py-2 text-xs focus:outline-none"
              style={{ background: "var(--surface-2)", borderColor: "var(--edge)", color: "var(--text)" }}
            >
              {Object.entries(RECURRENCE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            {recurrenceRule === "weekly" && (
              <div className="mt-2 flex gap-1.5">
                {WEEK_DAYS.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleDay(key)}
                    className={cn(
                      "flex-1 rounded-md py-1 text-[11px] font-medium transition-all border",
                      recurrenceDays.includes(key)
                        ? "border-violet-500/40 bg-violet-500/20 text-violet-300"
                        : "text-zinc-500 hover:text-zinc-300",
                    )}
                    style={!recurrenceDays.includes(key) ? { borderColor: "var(--edge)" } : undefined}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-5 py-4" style={{ borderColor: "var(--edge)" }}>
          {mode === "edit" ? (
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deleting ? "Usuwam…" : "Usuń"}
            </Button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>Anuluj</Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!title.trim() || saving}
            >
              {saving ? "Zapisuję…" : mode === "create" ? "Dodaj zadanie" : "Zapisz zmiany"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
