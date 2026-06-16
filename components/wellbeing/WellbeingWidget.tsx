"use client";

import { Moon, Pill, Zap } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Wellbeing } from "@/lib/supabase/types";

export function WellbeingWidget({ data }: { data: Wellbeing | null }) {
  const todayLabel = new Date().toLocaleDateString("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const supplements =
    data?.supplements?.length
      ? data.supplements.join(", ")
      : data?.supplements_notes;

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
          <Moon className="h-4 w-4 text-violet-400" />
          Wellbeing
        </div>
        <span className="text-[10px] capitalize text-zinc-600">{todayLabel}</span>
      </CardHeader>

      <CardContent className="grid grid-cols-2 gap-3 pt-0 sm:grid-cols-4">
        <Metric
          label="Sen"
          value={
            data?.sleep_hours != null
              ? `${data.sleep_hours}h`
              : data?.sleep_score != null
              ? `${data.sleep_score}%`
              : "—"
          }
        />
        <Metric
          label="Deep"
          value={data?.deep_sleep_hours != null ? `${data.deep_sleep_hours}h` : "—"}
        />
        <Metric
          label="Energia"
          value={data?.energy_level != null ? `${data.energy_level}/10` : "—"}
          icon={<Zap className="h-3 w-3 text-amber-400" />}
        />
        <Metric
          label="Suplementy"
          value={
            supplements
              ? supplements.slice(0, 20) + (supplements.length > 20 ? "…" : "")
              : data?.supplements_taken
              ? "Tak"
              : "—"
          }
          icon={<Pill className="h-3 w-3 text-emerald-400" />}
        />
      </CardContent>

      {!data && (
        <p className="border-t border-zinc-800/60 px-4 py-2 text-[11px] text-zinc-600">
          Napisz w czacie: „Spałem 7.5h, energia 8/10, magnez, D3"
        </p>
      )}
      {data?.notes && (
        <p className="border-t border-zinc-800/60 px-4 py-2 text-xs text-zinc-500">
          {data.notes}
        </p>
      )}
    </Card>
  );
}

function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</span>
      <span className="flex items-center gap-1 text-sm font-semibold text-zinc-100">
        {icon}
        {value}
      </span>
    </div>
  );
}
