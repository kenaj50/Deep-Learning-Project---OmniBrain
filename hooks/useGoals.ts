"use client";

import { useCallback, useEffect, useState } from "react";
import type { Goal } from "@/lib/supabase/types";

export function useGoals() {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/goals");
      if (res.ok) {
        const data = await res.json();
        setGoal(data.goal ?? null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const addEntry = useCallback(async (amount: number, note?: string) => {
    if (!goal) return;
    const res = await fetch(`/api/goals/${goal.id}/entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, note }),
    });
    if (res.ok) {
      const entry = await res.json();
      setGoal((prev) =>
        prev ? { ...prev, entries: [entry, ...(prev.entries ?? [])] } : prev,
      );
    }
  }, [goal]);

  const saveGoal = useCallback(async (params: {
    title: string;
    target_amount: number;
    start_date: string;
    end_date: string;
  }) => {
    if (goal) {
      const res = await fetch(`/api/goals/${goal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (res.ok) await refresh();
    } else {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (res.ok) await refresh();
    }
  }, [goal, refresh]);

  const deleteGoal = useCallback(async () => {
    if (!goal) return;
    await fetch(`/api/goals/${goal.id}`, { method: "DELETE" });
    setGoal(null);
  }, [goal]);

  const deleteEntry = useCallback(async (entryId: string) => {
    if (!goal) return;
    const res = await fetch(`/api/goals/${goal.id}/entries/${entryId}`, { method: "DELETE" });
    if (res.ok) {
      setGoal((prev) =>
        prev ? { ...prev, entries: (prev.entries ?? []).filter(e => e.id !== entryId) } : prev,
      );
    }
  }, [goal]);

  return { goal, isLoading, refresh, addEntry, saveGoal, deleteGoal, deleteEntry };
}
