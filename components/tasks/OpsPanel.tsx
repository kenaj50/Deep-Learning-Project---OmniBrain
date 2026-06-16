"use client";

import { useState, useEffect } from "react";
import { LayoutGrid, Plus, RefreshCw, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompanyCard } from "@/components/tasks/CompanyCard";
import { CompanyModal } from "@/components/tasks/CompanyModal";
import { TrashPanel } from "@/components/tasks/TrashPanel";
import { WellbeingWidget } from "@/components/wellbeing/WellbeingWidget";
import { cn } from "@/lib/utils";
import type { Company, Task, Wellbeing } from "@/lib/supabase/types";

interface Props {
  tasks: Task[];
  companies: Company[];
  wellbeing: Wellbeing | null;
  loading: boolean;
  refetch: () => void;
}

export function OpsPanel({ tasks, companies, wellbeing, loading, refetch }: Props) {
  const [localCompanies, setLocalCompanies] = useState<Company[]>(companies);
  const [addCompanyOpen, setAddCompanyOpen] = useState(false);
  const [trashOpen, setTrashOpen] = useState(false);
  const [search, setSearch]           = useState("");
  const [onlyUrgent, setOnlyUrgent]   = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const totalOpen = tasks.filter(t => t.status === "todo" || t.status === "in_progress").length;
  const totalCrit = tasks.filter(t => t.status === "todo" && (t.priority === "urgent" || t.urgency === "critical")).length;
  const doneToday = tasks.filter(t => t.status === "done" && t.updated_at?.slice(0, 10) === today).length;
  const doneTotal = tasks.filter(t => t.status === "done").length;

  useEffect(() => { setLocalCompanies(companies); }, [companies]);

  const filteredTasks = tasks.filter(t => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q || t.title.toLowerCase().includes(q) || (t.description ?? "").toLowerCase().includes(q);
    const matchPriority = !onlyUrgent || t.priority === "urgent" || t.urgency === "critical";
    return matchSearch && matchPriority;
  });

  async function moveCompany(id: string, direction: "up" | "down") {
    const idx = localCompanies.findIndex(c => c.id === id);
    const next = direction === "up" ? idx - 1 : idx + 1;
    if (next < 0 || next >= localCompanies.length) return;

    const newOrder = [...localCompanies];
    [newOrder[idx], newOrder[next]] = [newOrder[next], newOrder[idx]];
    setLocalCompanies(newOrder);

    await fetch("/api/companies/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: newOrder.map((c, i) => ({ id: c.id, sort_order: i })) }),
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-800/80 px-4 py-3">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-5 w-5 text-zinc-400" />
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Operacje</h2>
            <p className="text-xs text-zinc-500">
              {totalOpen} aktywnych
              {totalCrit > 0 && <span className="ml-1 text-red-400">· {totalCrit} kryt.</span>}
              {doneToday > 0 && <span className="ml-1 text-emerald-500">· ✓ {doneToday} dziś</span>}
              {doneTotal > 0 && <span className="ml-1 text-zinc-700">· {doneTotal} łącznie</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setAddCompanyOpen(true)} title="Dodaj obszar">
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setTrashOpen(true)} title="Kosz">
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={refetch} disabled={loading} aria-label="Odśwież">
            <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          </Button>
        </div>
      </header>

      {/* Search + filter bar */}
      <div className="shrink-0 flex items-center gap-2 border-b border-zinc-800/60 px-4 py-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-600 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Szukaj tasków…"
            className="w-full rounded-lg border pl-8 pr-7 py-1.5 text-xs placeholder:text-zinc-700 focus:outline-none focus:border-violet-500/50"
            style={{ background: "var(--surface)", borderColor: "var(--edge)", color: "var(--text)" }}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setOnlyUrgent(v => !v)}
          className={cn(
            "shrink-0 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors whitespace-nowrap",
            onlyUrgent
              ? "border-red-500/40 bg-red-500/15 text-red-400"
              : "border-zinc-800 text-zinc-600 hover:border-zinc-600 hover:text-zinc-400",
          )}
        >
          🔴 Pilne
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <WellbeingWidget data={wellbeing} />

        {!loading && localCompanies.length === 0 && (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            Uruchom supabase/schema.sql i uzupełnij .env.local — potem odśwież.
          </p>
        )}

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {localCompanies.map((company, idx) => (
            <CompanyCard
              key={company.id}
              company={company}
              companies={localCompanies}
              tasks={filteredTasks.filter(t => t.company_id === company.id)}
              onUpdate={refetch}
              canMoveUp={idx > 0}
              canMoveDown={idx < localCompanies.length - 1}
              onMoveUp={() => moveCompany(company.id, "up")}
              onMoveDown={() => moveCompany(company.id, "down")}
            />
          ))}
        </div>
      </div>

      {addCompanyOpen && (
        <CompanyModal mode="create" onSave={refetch} onClose={() => setAddCompanyOpen(false)} />
      )}
      {trashOpen && (
        <TrashPanel onClose={() => setTrashOpen(false)} onRestored={refetch} />
      )}
    </div>
  );
}
