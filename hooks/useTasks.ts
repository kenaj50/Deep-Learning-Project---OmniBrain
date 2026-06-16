"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import type { Company, Task, Wellbeing } from "@/lib/supabase/types";

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [wellbeing, setWellbeing] = useState<Wellbeing | null>(null);
  const [loading, setLoading] = useState(true);
  const [useApiFallback, setUseApiFallback] = useState(false);

  // Fallback: fetch through Next.js API route (always works, even without browser Supabase)
  const fetchViaApi = useCallback(async () => {
    const res = await fetch("/api/dashboard");
    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    const flat: Task[] = [];
    for (const company of data.companies as Company[]) {
      flat.push(...((data.tasksByCompany[company.id] ?? []) as Task[]));
    }
    setCompanies(data.companies);
    setTasks(flat);
    setWellbeing(data.wellbeing);
  }, []);

  // Primary: query Supabase browser client directly (no server round-trip, faster)
  const fetchViaSupabase = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setUseApiFallback(true);
      await fetchViaApi();
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const [{ data: companyRows }, { data: taskRows }, { data: wb }] =
      await Promise.all([
        supabase.from("companies").select("*").order("name"),
        supabase
          .from("tasks")
          .select("*")
          .neq("status", "archived")
          .order("created_at", { ascending: false }),
        supabase.from("wellbeing").select("*").eq("date", today).maybeSingle(),
      ]);

    if (companyRows) setCompanies(companyRows as Company[]);
    if (taskRows) setTasks(taskRows as Task[]);
    setWellbeing((wb as Wellbeing) ?? null);
  }, [fetchViaApi]);

  const refetch = useCallback(async () => {
    if (useApiFallback) await fetchViaApi();
    else await fetchViaSupabase();
  }, [useApiFallback, fetchViaApi, fetchViaSupabase]);

  // Debounced version for Realtime — batches rapid bursts (e.g. AI creating 5 tasks at once)
  const realtimeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedRealtime = useCallback(() => {
    if (realtimeDebounceRef.current) clearTimeout(realtimeDebounceRef.current);
    realtimeDebounceRef.current = setTimeout(() => {
      fetchViaSupabase().catch(() => {});
    }, 400);
  }, [fetchViaSupabase]);

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        await fetchViaSupabase();
      } catch {
        setUseApiFallback(true);
        try { await fetchViaApi(); } catch { /* offline */ }
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [fetchViaSupabase, fetchViaApi]);

  // Supabase Realtime — subscribe to tasks AND wellbeing changes
  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase || useApiFallback) return;

    const channel = supabase
      .channel("omnibrain-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        (payload) => {
          if (payload.eventType === "INSERT" && payload.new?.id) {
            window.dispatchEvent(new CustomEvent("omni-new-task", { detail: { id: payload.new.id } }));
          }
          debouncedRealtime();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "wellbeing" },
        () => { debouncedRealtime(); },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [useApiFallback, debouncedRealtime]);

  return { tasks, companies, wellbeing, loading, refetch };
}
