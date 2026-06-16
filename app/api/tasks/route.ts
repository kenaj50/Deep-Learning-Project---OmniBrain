import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { z } from "zod";

const CreateTaskSchema = z.object({
  title:            z.string().min(1).max(200),
  company_id:       z.string().uuid(),
  description:      z.string().max(2000).optional().nullable(),
  priority:         z.enum(["urgent", "high", "medium", "low"]).default("medium"),
  urgency:          z.enum(["critical", "high", "normal", "low"]).default("normal"),
  due_date:         z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  duration_estimate: z.string().max(50).optional().nullable(),
  recurrence_rule:  z.enum(["daily", "weekdays", "weekends", "weekly"]).optional().nullable(),
  recurrence_days:  z.array(z.string()).optional(),
  subtasks:         z.array(z.any()).optional(),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = CreateTaskSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const {
    title, company_id, description, priority, urgency,
    due_date, duration_estimate, recurrence_rule, recurrence_days,
  } = parsed.data;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      title: title.trim(),
      description: description || null,
      priority,
      urgency,
      due_date: due_date || null,
      duration_estimate: duration_estimate || null,
      company_id,
      subtasks: [],
      recurrence_rule: recurrence_rule ?? null,
      recurrence_days: recurrence_days ?? [],
    })
    .select("*, companies(*)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
