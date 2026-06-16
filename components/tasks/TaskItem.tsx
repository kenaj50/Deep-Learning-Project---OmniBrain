"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock,
  Pencil,
  RotateCcw,
  Timer,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Company, Subtask, Task } from "@/lib/supabase/types";
import { TaskModal } from "@/components/tasks/TaskModal";

interface Props {
  task: Task;
  companies: Company[];
  onUpdate: () => void;
}

const PRIORITY_LABELS: Record<string, string> = {
  urgent: "pilne",
  high: "wysoki",
  medium: "średni",
  low: "niski",
};

export function TaskItem({ task, companies, onUpdate }: Props) {
  const [expanded, setExpanded]         = useState(false);
  const [updating, setUpdating]         = useState(false);
  const [showUndo, setShowUndo]         = useState(false);
  const [editOpen, setEditOpen]         = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [localStatus, setLocalStatus]   = useState(task.status);
  const [localSubtasks, setLocalSubtasks] = useState<Subtask[]>(task.subtasks ?? []);
  const [isNew, setIsNew]               = useState(false);
  const undoTimerRef                    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deleteTimerRef                  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local state when task prop updates after refetch
  useEffect(() => {
    setLocalStatus(task.status);
    setLocalSubtasks(task.subtasks ?? []);
  }, [task.status, task.subtasks]);

  // Flash animation when task is newly created via Realtime
  useEffect(() => {
    const handler = (e: Event) => {
      if ((e as CustomEvent).detail?.id === task.id) {
        setIsNew(true);
        setTimeout(() => setIsNew(false), 2600);
      }
    };
    window.addEventListener("omni-new-task", handler);
    return () => window.removeEventListener("omni-new-task", handler);
  }, [task.id]);

  const isDone     = localStatus === "done";
  const isCritical = task.urgency === "critical" && !isDone;
  const subtasks   = localSubtasks;

  // Clear timers on unmount
  useEffect(() => () => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
  }, []);

  const archiveTask = async () => {
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "archived" }),
    });
    onUpdate();
  };

  const handleDeleteClick = () => {
    if (isDone) {
      // Done tasks: delete immediately (no extra confirm needed, task already finished)
      archiveTask();
    } else {
      // Active tasks: show 4s inline confirmation
      setShowDeleteConfirm(true);
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
      deleteTimerRef.current = setTimeout(() => setShowDeleteConfirm(false), 4000);
    }
  };

  const markDone = async () => {
    if (updating || isDone) return;
    setUpdating(true);
    setLocalStatus("done");
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "done" }),
    });
    setUpdating(false);
    setShowUndo(true);
    undoTimerRef.current = setTimeout(() => { setShowUndo(false); onUpdate(); }, 5000);
    onUpdate();
  };

  const undoDone = async () => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setShowUndo(false);
    setLocalStatus("todo");
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "todo" }),
    });
    onUpdate();
  };

  const toggleSubtask = async (subtask: Subtask) => {
    const updated = localSubtasks.map((s) =>
      s.id === subtask.id ? { ...s, done: !s.done } : s,
    );
    setLocalSubtasks(updated);
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subtasks: updated }),
    });
    onUpdate();
  };

  const doneSubtasks = subtasks.filter((s) => s.done).length;
  const dueLabel     = task.due_date ? formatDue(task.due_date) : null;

  return (
    <>
      <div
        className={cn(
          "group/task rounded-lg border transition-all",
          isDone && "border-zinc-800/40 opacity-60",
          isCritical && "border-red-500/20 bg-red-500/5",
          !isDone && !isCritical && "border-zinc-800 hover:border-zinc-700",
          isNew && "task-new-flash border-violet-500/40",
        )}
      >
        <div className="flex items-start gap-2 p-2.5">
          {/* Checkbox — done / not-done */}
          <button
            type="button"
            onClick={isDone ? undoDone : markDone}
            disabled={updating}
            className="mt-0.5 shrink-0 transition-opacity disabled:opacity-50"
            title={isDone ? "Oznacz jako do zrobienia" : "Oznacz jako zrobione"}
          >
            {isDone ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : (
              <Circle className="h-4 w-4 text-zinc-600 hover:text-emerald-400 transition-colors" />
            )}
          </button>

          <div className="min-w-0 flex-1">
            {/* Title row */}
            <div className="flex items-start justify-between gap-1.5">
              {/* Click title to edit */}
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className={cn(
                  "text-left text-xs leading-relaxed hover:text-violet-300 transition-colors",
                  isDone ? "text-zinc-600 line-through" : "text-zinc-200",
                )}
              >
                {isCritical && (
                  <AlertTriangle className="mr-1 inline h-3 w-3 text-red-400" />
                )}
                {task.title}
              </button>

              <div className="flex shrink-0 items-center gap-1">
                {task.priority !== "medium" && (
                  <Badge priority={task.priority}>{PRIORITY_LABELS[task.priority]}</Badge>
                )}
                {/* Trash — on hover */}
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  className="opacity-0 group-hover/task:opacity-100 text-zinc-700 hover:text-red-400 transition-all"
                  title="Usuń zadanie"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
                {/* Edit pencil */}
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className="text-zinc-700 hover:text-violet-400 transition-colors"
                  title="Edytuj zadanie"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Progress bar — only when subtasks exist */}
            {subtasks.length > 0 && (
              <div className="mt-1.5 h-[2px] w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-violet-500/60 transition-all duration-300"
                  style={{ width: `${(doneSubtasks / subtasks.length) * 100}%` }}
                />
              </div>
            )}

            {/* Meta row */}
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {(task.urgency === "critical" || task.urgency === "high") && !isDone && (
                <Badge urgency={task.urgency}>{task.urgency}</Badge>
              )}
              {dueLabel && (
                <span className={cn("flex items-center gap-0.5 text-[10px]", dueLabel.startsWith("⚠") ? "text-red-400" : "text-zinc-600")}>
                  <Clock className="h-2.5 w-2.5" />
                  {dueLabel}
                </span>
              )}
              {task.duration_estimate && (
                <span className="flex items-center gap-0.5 text-[10px] text-zinc-600">
                  <Timer className="h-2.5 w-2.5" />
                  ~{task.duration_estimate}
                </span>
              )}
              {subtasks.length > 0 && (
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="flex items-center gap-0.5 text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  {expanded ? <ChevronDown className="h-2.5 w-2.5" /> : <ChevronRight className="h-2.5 w-2.5" />}
                  {doneSubtasks}/{subtasks.length} kroków
                </button>
              )}
            </div>

            {/* Undo strip */}
            {showUndo && (
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className="text-[10px] text-emerald-500">✓ Oznaczono jako zrobione</span>
                <button
                  type="button"
                  onClick={undoDone}
                  className="flex items-center gap-0.5 text-[10px] text-zinc-400 hover:text-zinc-200 underline underline-offset-2 transition-colors"
                >
                  <RotateCcw className="h-2.5 w-2.5" />
                  Cofnij
                </button>
              </div>
            )}

            {/* Delete confirm strip (active tasks only) */}
            {showDeleteConfirm && (
              <div className="mt-1.5 flex items-center gap-2">
                <span className="text-[10px] text-red-400">Usunąć zadanie?</span>
                <button
                  type="button"
                  onClick={() => { setShowDeleteConfirm(false); archiveTask(); }}
                  className="rounded px-1.5 py-0.5 text-[10px] bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                >
                  Usuń
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Anuluj
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Subtasks */}
        {expanded && subtasks.length > 0 && (
          <div className="space-y-1.5 border-t border-zinc-800 px-2.5 py-2">
            {subtasks.map((st) => (
              <div key={st.id} className="flex items-start gap-2">
                <button type="button" onClick={() => toggleSubtask(st)} className="mt-0.5 shrink-0">
                  {st.done ? (
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <Circle className="h-3 w-3 text-zinc-700 hover:text-zinc-400 transition-colors" />
                  )}
                </button>
                <span className={cn("text-[11px] leading-relaxed", st.done ? "text-zinc-700 line-through" : "text-zinc-400")}>
                  {st.title}
                  {st.estimate && !st.done && (
                    <span className="ml-1.5 text-[10px] text-zinc-700">({st.estimate})</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editOpen && (
        <TaskModal
          mode="edit"
          task={task}
          companies={companies}
          onSave={onUpdate}
          onClose={() => setEditOpen(false)}
        />
      )}
    </>
  );
}

function isOverdue(dateStr: string) {
  return new Date(dateStr + "T12:00:00") < new Date(new Date().toDateString());
}

function formatDue(dateStr: string) {
  const date     = new Date(dateStr + "T12:00:00");
  const today    = new Date(new Date().toDateString());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (date < today)                               return `⚠ ${date.toLocaleDateString("pl-PL", { day: "numeric", month: "short" })}`;
  if (date.toDateString() === today.toDateString()) return "Dziś";
  if (date.toDateString() === tomorrow.toDateString()) return "Jutro";
  return date.toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
}
