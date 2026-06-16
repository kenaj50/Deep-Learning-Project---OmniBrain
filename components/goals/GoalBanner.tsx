"use client";

import { useRef, useState } from "react";
import { ChevronDown, ChevronRight, Pencil, Plus, Target, Trash2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGoals } from "@/hooks/useGoals";
import { GoalModal } from "./GoalModal";

function fmt(n: number) {
  return new Intl.NumberFormat("pl-PL", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

function daysDiff(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

export function GoalBanner() {
  const { goal, isLoading, addEntry, saveGoal, deleteGoal, deleteEntry } = useGoals();
  const [showModal, setShowModal]         = useState(false);
  const [inputVal, setInputVal]           = useState("");
  const [adding, setAdding]               = useState(false);
  const [showHistory, setShowHistory]     = useState(false);
  const [deletingId, setDeletingId]       = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDeleteEntry = async (entryId: string) => {
    setDeletingId(entryId);
    setConfirmDeleteId(null);
    await deleteEntry(entryId);
    setDeletingId(null);
  };

  const handleAdd = async () => {
    const amount = parseFloat(inputVal.replace(/\s/g, "").replace(",", "."));
    if (isNaN(amount) || amount <= 0) return;
    setAdding(true);
    await addEntry(amount);
    setInputVal("");
    setAdding(false);
    inputRef.current?.focus();
  };

  if (isLoading) return null;

  if (!goal) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="mb-4 flex w-full items-center gap-2 rounded-xl border border-dashed px-4 py-3 text-sm transition-colors hover:border-violet-500/40 hover:text-violet-400"
          style={{ borderColor: "var(--edge)", color: "var(--text-dim)" }}
        >
          <Target className="h-4 w-4" />
          <span>+ Ustaw cel finansowy (pasek postępu)</span>
        </button>
        {showModal && (
          <GoalModal goal={null} onSave={saveGoal} onClose={() => setShowModal(false)} />
        )}
      </>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const todayDate  = new Date(today + "T12:00:00");
  const startDate  = new Date(goal.start_date + "T12:00:00");
  const endDate    = new Date(goal.end_date + "T12:00:00");

  const totalDays     = Math.max(1, daysDiff(startDate, endDate) + 1);
  const daysElapsed   = Math.max(0, Math.min(daysDiff(startDate, todayDate), totalDays));
  const daysRemaining = Math.max(0, daysDiff(todayDate, endDate));

  const earned        = (goal.entries ?? []).reduce((s, e) => s + Number(e.amount), 0);
  const todayEarned   = (goal.entries ?? []).filter(e => e.date === today).reduce((s, e) => s + Number(e.amount), 0);
  const remaining     = Math.max(0, goal.target_amount - earned);
  const progress      = Math.min(1, earned / goal.target_amount);

  const expectedToDate = goal.target_amount * ((daysElapsed + 1) / totalDays);
  const deficit        = expectedToDate - earned;
  const dailyTarget    = daysRemaining > 0 ? remaining / daysRemaining : 0;

  const isComplete  = earned >= goal.target_amount;
  const isAhead     = !isComplete && deficit <= 0;
  const isBehind    = deficit > goal.target_amount * 0.05;
  const isWayBehind = deficit > goal.target_amount * 0.15;

  const stateColor = isComplete
    ? { border: "border-emerald-500/25", bg: "bg-emerald-500/5", bar: "bg-emerald-500", text: "text-emerald-400" }
    : isAhead
    ? { border: "border-violet-500/25", bg: "bg-violet-500/5", bar: "bg-violet-500", text: "text-violet-400" }
    : isWayBehind
    ? { border: "border-red-500/25", bg: "bg-red-500/5", bar: "bg-red-500", text: "text-red-400" }
    : isBehind
    ? { border: "border-amber-500/25", bg: "bg-amber-500/5", bar: "bg-amber-400", text: "text-amber-400" }
    : { border: "border-violet-500/25", bg: "bg-violet-500/5", bar: "bg-violet-500", text: "text-violet-400" };

  return (
    <>
      <div className={cn("mb-4 rounded-xl border px-4 py-3", stateColor.border, stateColor.bg)}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <TrendingUp className={cn("h-3.5 w-3.5 shrink-0", stateColor.text)} />
            <span className="truncate text-xs font-semibold" style={{ color: "var(--text)" }}>
              {goal.title}
            </span>
            {isComplete && <span className="ml-1 text-[11px] text-emerald-400 font-medium">🎉 Cel osiągnięty!</span>}
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="shrink-0 ml-2 text-zinc-600 hover:text-zinc-300 transition-colors"
          >
            <Pencil className="h-3 w-3" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="my-2.5 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className={cn("h-full rounded-full transition-all duration-700", stateColor.bar)}
            style={{ width: `${Math.min(100, progress * 100).toFixed(1)}%` }}
          />
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
          <span className={cn("font-semibold", stateColor.text)}>
            {fmt(earned)} zł
          </span>
          <span className="text-zinc-600">/</span>
          <span style={{ color: "var(--text-2)" }}>{fmt(goal.target_amount)} zł</span>
          <span className="text-zinc-700">·</span>
          <span style={{ color: "var(--text-dim)" }}>{daysRemaining} dni</span>
          {!isComplete && (
            <>
              <span className="text-zinc-700">·</span>
              <span style={{ color: "var(--text-dim)" }}>⚡ {fmt(dailyTarget)} zł/d</span>
            </>
          )}
          {deficit > 0 && !isComplete && (
            <span className={cn("font-medium", stateColor.text)}>
              · -{fmt(deficit)} zł zaległ.
            </span>
          )}
          {isAhead && (
            <span className="text-violet-400">· +{fmt(-deficit)} zł przed planem</span>
          )}
        </div>

        {/* Quick entry */}
        {!isComplete && (
          <div className="mt-2.5 flex items-center gap-2">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
                placeholder={`Wpisz zarobek (cel: ${fmt(dailyTarget)} zł)`}
                className="w-full rounded-lg border px-3 py-1.5 text-xs placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 pr-10"
                style={{ background: "var(--surface)", borderColor: "var(--edge)", color: "var(--text)" }}
              />
              {todayEarned > 0 && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-emerald-500 font-medium">
                  +{fmt(todayEarned)}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleAdd}
              disabled={adding || !inputVal.trim()}
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-all",
                inputVal.trim()
                  ? "border-violet-500/40 bg-violet-500/15 text-violet-400 hover:bg-violet-500/25"
                  : "border-zinc-800 text-zinc-700",
              )}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Entry history toggle */}
        {(goal.entries ?? []).length > 0 && (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => setShowHistory(v => !v)}
              className="flex items-center gap-1 text-[10px] transition-colors"
              style={{ color: "var(--text-dim)" }}
            >
              {showHistory ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              Historia wpisów ({(goal.entries ?? []).length})
            </button>
            {showHistory && (
              <div className="mt-1.5 max-h-40 overflow-y-auto space-y-1 rounded-lg border p-2" style={{ borderColor: "var(--edge)" }}>
                {[...(goal.entries ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at)).map(entry => (
                  <div key={entry.id} className="group/entry flex items-center justify-between gap-2 rounded px-2 py-1 hover:bg-zinc-800/40 transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] text-zinc-600 shrink-0">
                        {new Date(entry.date + "T12:00:00").toLocaleDateString("pl-PL", { day: "numeric", month: "short" })}
                      </span>
                      <span className="text-xs font-semibold text-emerald-400">+{fmt(Number(entry.amount))} zł</span>
                      {entry.note && (
                        <span className="text-[10px] truncate" style={{ color: "var(--text-dim)" }}>{entry.note}</span>
                      )}
                    </div>
                    {confirmDeleteId === entry.id ? (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleDeleteEntry(entry.id)}
                          disabled={deletingId === entry.id}
                          className="rounded px-1.5 py-0.5 text-[10px] font-medium text-red-400 hover:bg-red-500/15 transition-colors disabled:opacity-30"
                        >
                          Usuń
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="rounded px-1.5 py-0.5 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                          Anuluj
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(entry.id)}
                        className="shrink-0 opacity-0 group-hover/entry:opacity-100 text-zinc-700 hover:text-red-400 transition-all"
                        title="Usuń wpis"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <GoalModal
          goal={goal}
          onSave={saveGoal}
          onDelete={deleteGoal}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
