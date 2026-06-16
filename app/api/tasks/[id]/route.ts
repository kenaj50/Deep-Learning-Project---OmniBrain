import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { updateTaskStatus, updateTaskSubtasks } from "@/lib/supabase/queries";
import type { Subtask } from "@/lib/supabase/types";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json();

  // Recurring task: mark completed for today (does NOT change status to done)
  if (body.action === "complete_recurring") {
    const supabase = getSupabaseAdmin();
    const date = body.date as string | undefined ?? new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from("tasks")
      .update({ recurrence_last_completed: date })
      .eq("id", id)
      .select("id, title, recurrence_last_completed")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // Full edit or partial field update (title, company_id, priority, etc.)
  if (body.title !== undefined || body.company_id !== undefined) {
    const supabase = getSupabaseAdmin();
    const update: Record<string, unknown> = {};
    if (body.title !== undefined)                    update.title                    = body.title;
    if (body.description !== undefined)              update.description              = body.description;
    if (body.priority !== undefined)                 update.priority                 = body.priority;
    if (body.urgency !== undefined)                  update.urgency                  = body.urgency;
    if (body.status !== undefined)                   update.status                   = body.status;
    if (body.due_date !== undefined)                 update.due_date                 = body.due_date;
    if (body.company_id !== undefined)               update.company_id               = body.company_id;
    if (body.recurrence_rule !== undefined)          update.recurrence_rule          = body.recurrence_rule;
    if (body.recurrence_days !== undefined)          update.recurrence_days          = body.recurrence_days;
    if (body.recurrence_last_completed !== undefined) update.recurrence_last_completed = body.recurrence_last_completed;
    if (body.duration_estimate !== undefined)          update.duration_estimate          = body.duration_estimate;

    const { data, error } = await supabase
      .from("tasks")
      .update(update)
      .eq("id", id)
      .select("*, companies(*)")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // Subtask toggle
  if (body.subtasks) {
    try {
      const task = await updateTaskSubtasks(id, body.subtasks as Subtask[]);
      return NextResponse.json(task);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Błąd aktualizacji";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  // Status-only update
  const status = body.status as string;
  const allowed = ["todo", "in_progress", "done", "blocked", "archived"];
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: "Nieprawidłowy status" }, { status: 400 });
  }

  try {
    const task = await updateTaskStatus(id, status);
    return NextResponse.json(task);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Błąd aktualizacji";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
