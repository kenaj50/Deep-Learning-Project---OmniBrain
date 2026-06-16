"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskModal } from "@/components/tasks/TaskModal";
import type { Company, Task } from "@/lib/supabase/types";

interface Props {
  tasks: Task[];
  companies: Company[];
  onUpdate: () => void;
}

const DAYS_PL = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];
const MONTHS_PL = [
  "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
  "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień",
];

export function CalendarWidget({ tasks, companies, onUpdate }: Props) {
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [addForDay, setAddForDay]     = useState<string | null>(null);

  const today = now.toISOString().slice(0, 10);

  // Map tasks by due_date
  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const task of tasks) {
      if (!task.due_date || task.status === "done" || task.status === "archived") continue;
      if (!map[task.due_date]) map[task.due_date] = [];
      map[task.due_date].push(task);
    }
    return map;
  }, [tasks]);

  // Build calendar grid
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (() => {
    // getDay() returns 0=Sun, convert to Mon-first (0=Mon, 6=Sun)
    const d = new Date(year, month, 1).getDay();
    return d === 0 ? 6 : d - 1;
  })();

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };
  const goToday = () => { setYear(now.getFullYear()); setMonth(now.getMonth()); };

  const selectedTasks = selectedDay ? (tasksByDate[selectedDay] ?? []) : [];

  const formatSelected = (dateStr: string) =>
    new Date(dateStr + "T12:00:00").toLocaleDateString("pl-PL", {
      weekday: "long", day: "numeric", month: "long",
    });

  // Default company for quick-add (first in list)
  const defaultCompany = companies[0];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Month navigation */}
        <div className="flex items-center justify-between">
          <button type="button" onClick={prevMonth} className="p-1 text-zinc-600 hover:text-zinc-300 transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-zinc-100">
              {MONTHS_PL[month]} {year}
            </span>
            {(year !== now.getFullYear() || month !== now.getMonth()) && (
              <button
                type="button"
                onClick={goToday}
                className="rounded-md border border-zinc-800 px-2 py-0.5 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Dziś
              </button>
            )}
          </div>
          <button type="button" onClick={nextMonth} className="p-1 text-zinc-600 hover:text-zinc-300 transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Day of week headers */}
        <div className="grid grid-cols-7 gap-0.5 text-center">
          {DAYS_PL.map((d) => (
            <div key={d} className="text-[10px] font-medium text-zinc-600 pb-1">{d}</div>
          ))}

          {/* Empty cells before first day */}
          {Array.from({ length: firstWeekday }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayTasks = tasksByDate[dateStr] ?? [];
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDay;
            const hasCritical = dayTasks.some((t) => t.urgency === "critical" || t.priority === "urgent");

            return (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                className={cn(
                  "relative flex flex-col items-center rounded-lg py-1.5 text-xs transition-all",
                  isToday && "font-bold",
                  isSelected
                    ? "bg-violet-600/30 text-violet-200"
                    : isToday
                    ? "bg-violet-600/15 text-violet-300"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
                )}
              >
                <span>{day}</span>
                {/* Task dots */}
                {dayTasks.length > 0 && (
                  <div className="mt-0.5 flex gap-0.5">
                    {dayTasks.slice(0, 3).map((t, i) => (
                      <span
                        key={i}
                        className={cn(
                          "h-1 w-1 rounded-full",
                          hasCritical ? "bg-red-400" : "bg-violet-400",
                        )}
                      />
                    ))}
                    {dayTasks.length > 3 && (
                      <span className="text-[8px] text-zinc-600">+{dayTasks.length - 3}</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected day panel */}
        {selectedDay && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60">
            <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2">
              <span className="text-xs font-medium capitalize text-zinc-300">
                {formatSelected(selectedDay)}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAddForDay(selectedDay)}
                  className="flex items-center gap-1 rounded-md border border-violet-500/40 bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-400 hover:bg-violet-500/20 transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  Dodaj
                </button>
                <button type="button" onClick={() => setSelectedDay(null)} className="text-zinc-600 hover:text-zinc-300">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="max-h-40 overflow-y-auto px-3 py-2 space-y-1.5">
              {selectedTasks.length === 0 ? (
                <p className="py-2 text-center text-xs text-zinc-700">Brak zadań — kliknij Dodaj</p>
              ) : (
                selectedTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-2">
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full shrink-0",
                        task.urgency === "critical" ? "bg-red-400" : "bg-violet-400",
                      )}
                    />
                    <span className="text-xs text-zinc-300 truncate">{task.title}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add task for specific day */}
      {addForDay && defaultCompany && (
        <TaskModal
          mode="create"
          company={defaultCompany}
          companies={companies}
          initialDueDate={addForDay}
          onSave={onUpdate}
          onClose={() => setAddForDay(null)}
        />
      )}
    </div>
  );
}
