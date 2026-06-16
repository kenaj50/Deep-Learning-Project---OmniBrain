"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowRightLeft,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  GripVertical,
  Loader2,
  Pencil,
  Plus,
  Square,
  Trash2,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TaskItem } from "@/components/tasks/TaskItem";
import { TaskModal } from "@/components/tasks/TaskModal";
import { CompanyModal } from "@/components/tasks/CompanyModal";
import { cn } from "@/lib/utils";
import type { Company, Task } from "@/lib/supabase/types";

interface Props {
  company: Company;
  tasks: Task[];
  companies: Company[];
  onUpdate: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

/* ── Sortable task row with drag handle + move button ── */
function SortableTaskItem({
  task,
  companies,
  currentCompanyId,
  onUpdate,
  selectMode,
  selected,
  onToggleSelect,
}: {
  task: Task;
  companies: Company[];
  currentCompanyId: string;
  onUpdate: () => void;
  selectMode: boolean;
  selected: boolean;
  onToggleSelect: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });
  const [showMove, setShowMove] = useState(false);
  const [moving, setMoving] = useState(false);

  const otherCompanies = companies.filter(c => c.id !== currentCompanyId);

  async function moveToCompany(newCompanyId: string) {
    setMoving(true);
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company_id: newCompanyId }),
    });
    setMoving(false);
    setShowMove(false);
    onUpdate();
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.2 : 1,
      }}
      className="group/task-row relative flex items-start gap-1"
    >
      {/* Left: checkbox (select mode) or drag handle */}
      {selectMode ? (
        <button
          type="button"
          onClick={() => onToggleSelect(task.id)}
          className={cn(
            "mt-1 shrink-0 transition-colors",
            selected ? "text-violet-400" : "text-zinc-600 hover:text-zinc-400",
          )}
        >
          {selected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
        </button>
      ) : (
        <button
          type="button"
          className="mt-1.5 shrink-0 cursor-grab touch-none text-zinc-700 opacity-0 group-hover/task-row:opacity-100 transition-opacity active:cursor-grabbing"
          aria-label="Przeciągnij"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Task content */}
      <div className="flex-1 min-w-0">
        <TaskItem task={task} companies={companies} onUpdate={onUpdate} />
      </div>

      {/* Move to category button (hover, only when not in select mode) */}
      {!selectMode && otherCompanies.length > 0 && (
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setShowMove(v => !v)}
            disabled={moving}
            className="mt-1.5 text-zinc-700 opacity-0 group-hover/task-row:opacity-100 hover:text-violet-400 transition-all"
            title="Przenieś do kategorii"
          >
            <ArrowRightLeft className="h-3 w-3" />
          </button>

          {showMove && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 z-10" onClick={() => setShowMove(false)} />
              {/* Dropdown */}
              <div
                className="absolute right-0 top-5 z-20 min-w-[160px] rounded-xl border py-1 shadow-2xl"
                style={{ background: "var(--surface)", borderColor: "var(--edge)" }}
              >
                <p className="px-3 py-1.5 text-[10px] font-medium" style={{ color: "var(--text-dim)" }}>
                  Przenieś do:
                </p>
                {otherCompanies.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => moveToCompany(c.id)}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-xs transition-colors hover:bg-violet-500/10"
                    style={{ color: "var(--text-2)" }}
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: c.accent_color }}
                    />
                    {c.icon} {c.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function CompanyCard({
  company,
  tasks,
  companies,
  onUpdate,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
}: Props) {
  const [addOpen, setAddOpen]           = useState(false);
  const [editOpen, setEditOpen]         = useState(false);
  const [showDone, setShowDone]         = useState(false);
  const [selectMode, setSelectMode]     = useState(false);
  const [selected, setSelected]         = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [localActive, setLocalActive]   = useState<Task[]>([]);
  const [quickInput, setQuickInput]     = useState("");
  const [quickOpen, setQuickOpen]       = useState(false);
  const [quickAdding, setQuickAdding]   = useState(false);

  const activeTasks = tasks.filter(t => t.status !== "done" && t.status !== "archived");
  const doneTasks   = tasks.filter(t => t.status === "done");
  const urgentCount = activeTasks.filter(t => t.priority === "urgent" || t.urgency === "critical").length;

  // Sync local order while preserving manual sort
  const prevIds = localActive.map(t => t.id).join(",");
  const nextIds = activeTasks.map(t => t.id).join(",");
  if (prevIds !== nextIds) {
    const activeMap = new Map(activeTasks.map(t => [t.id, t]));
    const kept = localActive.filter(t => activeMap.has(t.id)).map(t => activeMap.get(t.id)!);
    const keptIds = new Set(kept.map(t => t.id));
    const newOnes = activeTasks.filter(t => !keptIds.has(t.id));
    // biome-ignore lint/correctness/noExplicitAny: sync pattern
    (setLocalActive as any)([...kept, ...newOnes]);
  }

  const allIds = [...(localActive.length ? localActive : activeTasks), ...(showDone ? doneTasks : [])].map(t => t.id);
  const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id));

  function toggleSelect(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleSelectAll() { setSelected(allSelected ? new Set() : new Set(allIds)); }
  function exitSelectMode() { setSelectMode(false); setSelected(new Set()); }

  async function bulkDelete() {
    if (!selected.size) return;
    setBulkDeleting(true);
    await Promise.all([...selected].map(id =>
      fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "archived" }),
      }),
    ));
    setBulkDeleting(false);
    exitSelectMode();
    onUpdate();
  }

  async function handleQuickAdd() {
    const title = quickInput.trim();
    if (!title) return;
    setQuickAdding(true);
    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, company_id: company.id, priority: "medium", urgency: "normal" }),
      });
      setQuickInput("");
      onUpdate();
    } catch {
      /* ignore */
    } finally {
      setQuickAdding(false);
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function handleTaskDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const displayed = localActive.length ? localActive : activeTasks;
    const oldIdx = displayed.findIndex(t => t.id === active.id);
    const newIdx = displayed.findIndex(t => t.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    const newOrder = arrayMove(displayed, oldIdx, newIdx);
    setLocalActive(newOrder);
    await fetch("/api/tasks/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: newOrder.map((t, i) => ({ id: t.id, sort_order: i })) }),
    });
  }

  const displayedActive = localActive.length ? localActive : activeTasks;

  return (
    <>
      <Card
        className="flex min-h-[180px] flex-col"
        style={{ borderTopColor: company.accent_color, borderTopWidth: 2 }}
      >
        <CardHeader>
          <div className="flex items-center gap-2 min-w-0">
            {/* Up/Down order buttons */}
            <div className="flex shrink-0 flex-col">
              <button
                type="button"
                onClick={onMoveUp}
                disabled={!canMoveUp}
                className="text-zinc-600 hover:text-zinc-300 disabled:opacity-20 transition-colors"
                title="Przesuń wyżej"
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={onMoveDown}
                disabled={!canMoveDown}
                className="text-zinc-600 hover:text-zinc-300 disabled:opacity-20 transition-colors"
                title="Przesuń niżej"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>

            <span className="text-base leading-none shrink-0">{company.icon}</span>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>{company.name}</h3>
              <p className="text-xs" style={{ color: "var(--text-dim)" }}>
                {activeTasks.length} aktywnych
                {urgentCount > 0 && <span className="ml-1 text-red-400">· {urgentCount} kryt.</span>}
                {doneTasks.length > 0 && <span className="ml-1 text-emerald-600">· {doneTasks.length} zrobione</span>}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            {selectMode ? (
              <>
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="flex items-center gap-1 rounded px-1.5 py-1 text-[11px] transition-colors"
                  style={{ color: "var(--text-2)" }}
                >
                  {allSelected ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
                  Wszystkie
                </button>
                <button
                  type="button"
                  onClick={exitSelectMode}
                  className="rounded p-1 transition-colors"
                  style={{ color: "var(--text-dim)" }}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setSelectMode(true)}
                  className="flex items-center justify-center rounded-lg border p-1.5 transition-colors"
                  style={{ borderColor: "var(--edge)", color: "var(--text-dim)" }}
                  title="Zaznacz wiele"
                >
                  <CheckSquare className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className="flex items-center justify-center rounded-lg border p-1.5 transition-colors"
                  style={{ borderColor: "var(--edge)", color: "var(--text-dim)" }}
                  title="Edytuj obszar"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setAddOpen(true)}
                  className="flex items-center gap-1 rounded-lg border border-violet-500/40 bg-violet-500/10 px-2 py-1 text-xs text-violet-400 hover:bg-violet-500/20 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Dodaj
                </button>
              </>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto max-h-80 space-y-1.5">
          {displayedActive.length === 0 && doneTasks.length === 0 && (
            <p className="py-4 text-center text-xs" style={{ color: "var(--text-dim)" }}>
              Brak zadań — dodaj przez AI lub kliknij +
            </p>
          )}

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleTaskDragEnd}>
            <SortableContext items={displayedActive.map(t => t.id)} strategy={verticalListSortingStrategy}>
              {displayedActive.map(task => (
                <SortableTaskItem
                  key={task.id}
                  task={task}
                  companies={companies}
                  currentCompanyId={company.id}
                  onUpdate={onUpdate}
                  selectMode={selectMode}
                  selected={selected.has(task.id)}
                  onToggleSelect={toggleSelect}
                />
              ))}
            </SortableContext>
          </DndContext>

          {/* Inline quick-add */}
          {!selectMode && (
            quickOpen ? (
              <div className="flex items-center gap-1.5 mt-1">
                <input
                  // biome-ignore lint/a11y/noAutofocus: inline quick-add needs focus
                  autoFocus
                  value={quickInput}
                  onChange={(e) => setQuickInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { handleQuickAdd(); }
                    if (e.key === "Escape") { setQuickOpen(false); setQuickInput(""); }
                  }}
                  onBlur={() => {
                    if (!quickInput.trim()) { setQuickOpen(false); }
                  }}
                  placeholder="Tytuł zadania… Enter = dodaj, Esc = anuluj"
                  disabled={quickAdding}
                  className="flex-1 min-w-0 rounded-lg border px-2.5 py-1.5 text-xs placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 disabled:opacity-50"
                  style={{ background: "var(--surface-2)", borderColor: "var(--edge)", color: "var(--text)" }}
                />
                <button
                  type="button"
                  onClick={() => setAddOpen(true)}
                  className="shrink-0 rounded-lg border px-2 py-1.5 text-[10px] transition-colors hover:border-zinc-600 hover:text-zinc-300"
                  style={{ borderColor: "var(--edge)", color: "var(--text-dim)" }}
                  title="Więcej opcji"
                >
                  ···
                </button>
                {quickAdding && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-zinc-500" />}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setQuickOpen(true)}
                className="mt-1 flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] text-zinc-700 transition-colors hover:bg-zinc-800/50 hover:text-zinc-400"
              >
                <Plus className="h-3 w-3" />
                Dodaj zadanie
              </button>
            )
          )}

          {doneTasks.length > 0 && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowDone(v => !v)}
                className="flex w-full items-center gap-1.5 py-1 text-[10px] transition-colors"
                style={{ color: "var(--text-dim)" }}
              >
                {showDone ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                Zrobione ({doneTasks.length})
              </button>
              {showDone && (
                <div className="mt-1 space-y-1.5 border-l pl-3" style={{ borderColor: "var(--edge)" }}>
                  {doneTasks.map(task => (
                    <div key={task.id} className="flex items-start gap-1">
                      {selectMode && (
                        <button
                          type="button"
                          onClick={() => toggleSelect(task.id)}
                          className={cn("mt-1 shrink-0", selected.has(task.id) ? "text-violet-400" : "text-zinc-600")}
                        >
                          {selected.has(task.id) ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                        </button>
                      )}
                      <div className="flex-1 min-w-0">
                        <TaskItem task={task} companies={companies} onUpdate={onUpdate} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>

        {selectMode && selected.size > 0 && (
          <div
            className="flex shrink-0 items-center justify-between border-t px-4 py-2.5"
            style={{ borderColor: "var(--edge)" }}
          >
            <span className="text-xs" style={{ color: "var(--text-2)" }}>{selected.size} zaznaczone</span>
            <button
              type="button"
              onClick={bulkDelete}
              disabled={bulkDeleting}
              className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {bulkDeleting ? "Usuwam…" : "Usuń zaznaczone"}
            </button>
          </div>
        )}
      </Card>

      {addOpen && (
        <TaskModal mode="create" company={company} companies={companies} onSave={onUpdate} onClose={() => setAddOpen(false)} />
      )}
      {editOpen && (
        <CompanyModal mode="edit" company={company} onSave={onUpdate} onClose={() => setEditOpen(false)} />
      )}
    </>
  );
}
