import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = getSupabaseAdmin();
  const today = new Date().toISOString().slice(0, 10);

  const [regularResult, recurringResult] = await Promise.all([
    supabase
      .from("tasks")
      .select("*, companies(id, name, slug, accent_color, icon, sort_order)")
      .in("status", ["todo", "in_progress", "blocked"])
      .is("recurrence_rule", null)
      .or(`due_date.lte.${today},urgency.in.(critical,high),priority.in.(urgent,high)`)
      .order("created_at", { ascending: false }),
    supabase
      .from("tasks")
      .select("*, companies(id, name, slug, accent_color, icon, sort_order)")
      .in("status", ["todo", "in_progress", "blocked"])
      .not("recurrence_rule", "is", null)
      .order("sort_order", { ascending: true }),
  ]);

  if (regularResult.error) return NextResponse.json({ error: regularResult.error.message }, { status: 500 });

  const urgencyOrder: Record<string, number> = { critical: 0, high: 1, normal: 2, low: 3 };
  const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

  const sorted = (regularResult.data ?? []).sort((a, b) => {
    const uDiff = (urgencyOrder[a.urgency] ?? 3) - (urgencyOrder[b.urgency] ?? 3);
    if (uDiff !== 0) return uDiff;
    const pDiff = (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3);
    if (pDiff !== 0) return pDiff;
    if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
    if (a.due_date) return -1;
    if (b.due_date) return 1;
    return 0;
  });

  return NextResponse.json({
    tasks: sorted,
    recurring: recurringResult.data ?? [],
    date: today,
  });
}
