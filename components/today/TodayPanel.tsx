"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Circle, Clock, Pencil, RefreshCw, RotateCcw, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { GoalBanner } from "@/components/goals/GoalBanner";
import { TaskModal } from "@/components/tasks/TaskModal";
import { cn } from "@/lib/utils";
import type { Company, CompanySlug, RecurrenceRule, Task } from "@/lib/supabase/types";

interface TaskWithCompany extends Task {
  companies: { id: string; name: string; slug: CompanySlug; accent_color: string; icon: string; sort_order: number };
}

interface Props {
  onTaskDone?: () => void;
  companies: Company[];
}

const SECTIONS = [
  {
    id: "now",
    label: "Zrób TERAZ",
    emoji: "🔴",
    desc: "Krytyczne i przeterminowane",
    filter: (t: TaskWithCompany, today: string) =>
      t.urgency === "critical" ||
      t.priority === "urgent" ||
      (t.due_date != null && t.due_date < today),
  },
  {
    id: "plan",
    label: "Ważne — zaplanuj",
    emoji: "⚡",
    desc: "High priority, ten tydzień",
    filter: (t: TaskWithCompany, today: string) =>
      t.urgency === "high" ||
      (t.priority === "high" && (t.due_date == null || t.due_date >= today)),
  },
  {
    id: "rest",
    label: "Reszta na dziś",
    emoji: "📋",
    desc: "Medium i niskie priorytety",
    filter: () => true,
  },
];

const DOW_NAMES = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

function isRecurringDueToday(task: TaskWithCompany, dow: number): boolean {
  switch (task.recurrence_rule as RecurrenceRule) {
    case "daily":    return true;
    case "weekdays": return dow >= 1 && dow <= 5;
    case "weekends": return dow === 0 || dow === 6;
    case "weekly":   return (task.recurrence_days ?? []).includes(DOW_NAMES[dow]);
    default:         return false;
  }
}

export function TodayPanel({ onTaskDone, companies }: Props) {
  const [tasks, setTasks]         = useState<TaskWithCompany[]>([]);
  const [recurring, setRecurring] = useState<TaskWithCompany[]>([]);
  const [loading, setLoading]     = useState(true);
  const [marking, setMarking]     = useState<string | null>(null);
  const [editTask, setEditTask]   = useState<TaskWithCompany | null>(null);

  const today    = new Date().toISOString().slice(0, 10);
  const todayDow = new Date().getDay();
  const todayLabel = new Date().toLocaleDateString("pl-PL", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tasks/today");
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks ?? []);
        setRecurring(data.recurring ?? []);
      }
    } catch {
      /* silently ignore network errors */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const markDone = async (task: TaskWithCompany) => {
    setMarking(task.id);
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "done" }),
      });
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      onTaskDone?.();
    } catch {
      /* ignore */
    } finally {
      setMarking(null);
    }
  };

  const completeRecurring = async (task: TaskWithCompany) => {
    const alreadyDone = task.recurrence_last_completed === today;
    setMarking(task.id);
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete_recurring", date: alreadyDone ? null : today }),
      });
      setRecurring((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? { ...t, recurrence_last_completed: alreadyDone ? null : today }
            : t,
        ),
      );
      if (!alreadyDone) onTaskDone?.();
    } catch {
      /* ignore */
    } finally {
      setMarking(null);
    }
  };

  const handleEditSave = () => {
    setEditTask(null);
    load();
    onTaskDone?.();
  };

  const assigned = new Set<string>();
  const sections = SECTIONS.map((section) => {
    const filtered = tasks.filter((t) => {
      if (assigned.has(t.id)) return false;
      const match = section.filter(t, today);
      if (match) assigned.add(t.id);
      return match;
    });
    return { ...section, tasks: filtered };
  });

  const recurringDueToday = recurring.filter((t) => isRecurringDueToday(t, todayDow));
  const recurringDone     = recurringDueToday.filter((t) => t.recurrence_last_completed === today);
  const recurringPending  = recurringDueToday.filter((t) => t.recurrence_last_completed !== today);

  return (
    <>
      <div className="flex h-full min-h-0 flex-col">
        {/* Header */}
        <header className="shrink-0 border-b border-zinc-800/80 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">☀️ Dziś</h2>
              <p className="text-xs capitalize text-zinc-500">{todayLabel}</p>
            </div>
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="text-zinc-600 hover:text-zinc-300 transition-colors"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </button>
          </div>

          {!loading && (
            <div className="mt-2 flex gap-3">
              <Stat color="text-red-400"   value={sections[0].tasks.length} label="teraz" />
              <Stat color="text-amber-400" value={sections[1].tasks.length} label="zaplanuj" />
              <Stat color="text-zinc-500"  value={sections[2].tasks.length} label="reszta" />
              {recurringDueToday.length > 0 && (
                <Stat color="text-violet-400" value={`${recurringDone.length}/${recurringDueToday.length}`} label="cykl." />
              )}
            </div>
          )}
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
          {/* Goal banner */}
          <GoalBanner />

          {loading ? (
            <div className="flex items-center justify-center py-12 text-zinc-600 text-sm">Ładuję…</div>
          ) : (
            <>
              {/* Recurring section */}
              {recurringDueToday.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-sm">🔄</span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Cykliczne</span>
                    <span className="text-[10px] text-zinc-600">na dziś</span>
                    <span className="ml-auto text-[10px] text-zinc-600">
                      {recurringDone.length}/{recurringDueToday.length}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {[...recurringPending, ...recurringDone].map((task) => {
                      const done = task.recurrence_last_completed === today;
                      return (
                        <div
                          key={task.id}
                          className={cn(
                            "flex items-center gap-2.5 rounded-xl border px-3 py-2 transition-all",
                            done
                              ? "border-emerald-500/15 bg-emerald-500/5 opacity-60"
                              : "border-violet-500/15 bg-violet-500/5",
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => completeRecurring(task)}
                            disabled={marking === task.id}
                            className="shrink-0 disabled:opacity-50"
                          >
                            {done ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <Circle className="h-4 w-4 text-violet-500/60 hover:text-violet-400 transition-colors" />
                            )}
                          </button>
                          <div className="min-w-0 flex-1 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setEditTask(task)}
                              className={cn(
                                "text-sm leading-snug truncate text-left hover:text-violet-300 transition-colors",
                                done && "line-through text-zinc-500",
                              )}
                            >
                              {task.title}
                            </button>
                            <span
                              className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium"
                              style={{
                                background: task.companies.accent_color + "20",
                                color: task.companies.accent_color,
                              }}
                            >
                              {task.companies.icon}
                            </span>
                          </div>
                          <div className="shrink-0 flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setEditTask(task)}
                              className="text-zinc-700 hover:text-violet-400 transition-colors"
                              title="Edytuj"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            {done && (
                              <button
                                type="button"
                                onClick={() => completeRecurring(task)}
                                className="text-zinc-600 hover:text-zinc-400 transition-colors"
                                title="Cofnij"
                              >
                                <RotateCcw className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Regular task sections */}
              {tasks.length === 0 && recurringDueToday.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                  <span className="text-4xl">🎉</span>
                  <p className="text-sm font-medium text-zinc-300">Wszystko zrobione na dziś!</p>
                  <p className="text-xs text-zinc-600">Możesz dodać nowe zadania przez AI lub przycisk +</p>
                </div>
              ) : (
                sections.map((section) =>
                  section.tasks.length === 0 ? null : (
                    <div key={section.id}>
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-sm">{section.emoji}</span>
                        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                          {section.label}
                        </span>
                        <span className="text-[10px] text-zinc-600">{section.desc}</span>
                        <span className="ml-auto text-[10px] text-zinc-600">{section.tasks.length}</span>
                      </div>
                      <div className="space-y-2">
                        {section.tasks.map((task) => (
                          <TodayTaskRow
                            key={task.id}
                            task={task}
                            today={today}
                            marking={marking === task.id}
                            onDone={() => markDone(task)}
                            onEdit={() => setEditTask(task)}
                          />
                        ))}
                      </div>
                    </div>
                  ),
                )
              )}
            </>
          )}
        </div>
      </div>

      {/* Edit modal — outside the scrollable area */}
      {editTask && (
        <TaskModal
          mode="edit"
          task={editTask}
          companies={companies}
          onSave={handleEditSave}
          onClose={() => setEditTask(null)}
        />
      )}
    </>
  );
}

function TodayTaskRow({
  task, today, marking, onDone, onEdit,
}: {
  task: TaskWithCompany;
  today: string;
  marking: boolean;
  onDone: () => void;
  onEdit: () => void;
}) {
  const isOverdue  = task.due_date != null && task.due_date < today;
  const isCritical = task.urgency === "critical" || task.priority === "urgent";

  return (
    <div
      className={cn(
        "group/today-row flex items-start gap-2.5 rounded-xl border px-3 py-2.5 transition-all",
        isCritical ? "border-red-500/20 bg-red-500/5" : "border-zinc-800 bg-zinc-900/40",
      )}
    >
      <button
        type="button"
        onClick={onDone}
        disabled={marking}
        className="mt-0.5 shrink-0 disabled:opacity-50"
        title="Oznacz jako zrobione"
      >
        {marking ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        ) : (
          <Circle className="h-4 w-4 text-zinc-600 hover:text-emerald-400 transition-colors" />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          {/* Clickable title → opens edit modal */}
          <button
            type="button"
            onClick={onEdit}
            className="text-left text-sm text-zinc-200 leading-snug hover:text-violet-300 transition-colors"
          >
            {isCritical && <AlertTriangle className="mr-1 inline h-3 w-3 text-red-400" />}
            {task.title}
          </button>
          <div className="flex shrink-0 items-center gap-1">
            <Badge priority={task.priority} className="shrink-0">{task.priority}</Badge>
            <button
              type="button"
              onClick={onEdit}
              className="opacity-0 group-hover/today-row:opacity-100 text-zinc-600 hover:text-violet-400 transition-all"
              title="Edytuj"
            >
              <Pencil className="h-3 w-3" />
            </button>
          </div>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span
            className="rounded px-1.5 py-0.5 text-[10px] font-medium"
            style={{ background: task.companies.accent_color + "20", color: task.companies.accent_color }}
          >
            {task.companies.icon} {task.companies.name}
          </span>
          {task.due_date && (
            <span className={cn("flex items-center gap-0.5 text-[10px]", isOverdue ? "text-red-400" : "text-zinc-500")}>
              <Clock className="h-2.5 w-2.5" />
              {isOverdue ? "⚠ " : ""}{formatDue(task.due_date)}
            </span>
          )}
          {(task.urgency === "critical" || task.urgency === "high") && (
            <Badge urgency={task.urgency}>{task.urgency}</Badge>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ color, value, label }: { color: string; value: number | string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <Zap className={cn("h-3 w-3", color)} />
      <span className={cn("text-xs font-semibold", color)}>{value}</span>
      <span className="text-[10px] text-zinc-600">{label}</span>
    </div>
  );
}

function formatDue(dateStr: string) {
  const d     = new Date(dateStr + "T12:00:00");
  const today = new Date(new Date().toDateString());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (d < today) return d.toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
  if (d.toDateString() === today.toDateString()) return "Dziś";
  if (d.toDateString() === tomorrow.toDateString()) return "Jutro";
  return d.toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
}
