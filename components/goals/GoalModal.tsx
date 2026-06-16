"use client";

import { useEffect, useState } from "react";
import { X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Goal } from "@/lib/supabase/types";

interface Props {
  goal: Goal | null;
  onSave: (params: { title: string; target_amount: number; start_date: string; end_date: string }) => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
}

export function GoalModal({ goal, onSave, onDelete, onClose }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const defaultEnd = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [title, setTitle]       = useState(goal?.title ?? "");
  const [target, setTarget]     = useState(goal?.target_amount?.toString() ?? "");
  const [startDate, setStart]   = useState(goal?.start_date ?? today);
  const [endDate, setEnd]       = useState(goal?.end_date ?? defaultEnd);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSave = async () => {
    const amount = parseFloat(target.replace(/\s/g, "").replace(",", "."));
    if (!title.trim() || isNaN(amount) || amount <= 0 || !startDate || !endDate) return;
    setSaving(true);
    await onSave({ title: title.trim(), target_amount: amount, start_date: startDate, end_date: endDate });
    setSaving(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!onDelete || !confirm("Na pewno usunąć cel?")) return;
    setDeleting(true);
    await onDelete();
    setDeleting(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md rounded-t-2xl border sm:rounded-2xl"
        style={{ background: "var(--surface)", borderColor: "var(--edge)" }}
      >
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "var(--edge)" }}>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
            {goal ? "Edytuj cel" : "Nowy cel finansowy"}
          </h2>
          <button type="button" onClick={onClose} className="text-zinc-600 hover:text-zinc-300 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4" style={{ color: "var(--text)" }}>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Nazwa celu</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="np. 100k w 60 dni"
              className="w-full rounded-lg border px-3 py-2 text-sm placeholder:text-zinc-500 focus:border-violet-500/50 focus:outline-none"
              style={{ background: "var(--surface-2)", borderColor: "var(--edge)", color: "var(--text)" }}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Kwota docelowa (PLN)</label>
            <input
              type="text"
              inputMode="numeric"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="100000"
              className="w-full rounded-lg border px-3 py-2 text-sm placeholder:text-zinc-500 focus:border-violet-500/50 focus:outline-none"
              style={{ background: "var(--surface-2)", borderColor: "var(--edge)", color: "var(--text)" }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Data startu</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStart(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
                style={{ background: "var(--surface-2)", borderColor: "var(--edge)", color: "var(--text)", colorScheme: "inherit" }}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Data końca</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
                style={{ background: "var(--surface-2)", borderColor: "var(--edge)", color: "var(--text)", colorScheme: "inherit" }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t px-5 py-4" style={{ borderColor: "var(--edge)" }}>
          {goal && onDelete ? (
            <Button variant="danger" size="sm" onClick={handleDelete} disabled={deleting}>
              <Trash2 className="h-3.5 w-3.5" />
              {deleting ? "Usuwam…" : "Usuń cel"}
            </Button>
          ) : <div />}
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>Anuluj</Button>
            <Button size="sm" onClick={handleSave} disabled={saving || !title.trim() || !target}>
              {saving ? "Zapisuję…" : goal ? "Zapisz" : "Utwórz cel"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
