import { getSupabaseAdmin } from "./admin";
import type { CompanySlug, Goal, GoalEntry, Subtask, Task, Wellbeing } from "./types";

export const COMPANY_SLUGS = [
  "aiosystems",
  "kolmat",
  "hyper-human",
  "personal",
] as const;

export function normalizeSubtasks(
  raw?: Subtask[] | string[] | string | { title: string; estimate?: string }[],
): Subtask[] {
  if (!raw) return [];
  if (typeof raw === "string") {
    try {
      return normalizeSubtasks(JSON.parse(raw) as Subtask[]);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(raw) || raw.length === 0) return [];
  if (typeof raw[0] === "string") {
    return (raw as string[]).map((title, i) => ({ id: String(i + 1), title, done: false }));
  }
  return (raw as Array<Record<string, unknown>>).map((s, i) => ({
    id: (s.id as string) ?? String(i + 1),
    title: (s.title as string) ?? "",
    done: (s.done as boolean) ?? false,
    ...(s.estimate ? { estimate: s.estimate as string } : {}),
  }));
}

// Fuzzy company resolver — AI can say "Prywatne", "HH", "aio" etc.
export async function resolveCompanyId(company: string): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const normalized = company.toLowerCase().trim();

  const slugMap: Record<string, CompanySlug> = {
    aiosystems: "aiosystems",
    aio: "aiosystems",
    "aio systems": "aiosystems",
    kolmat: "kolmat",
    "kolmat trade": "kolmat",
    "hyper human": "hyper-human",
    "hyper human club": "hyper-human",
    hyper_human: "hyper-human",
    "hyper-human": "hyper-human",
    hyperhuman: "hyper-human",
    hh: "hyper-human",
    personal: "personal",
    prywatne: "personal",
    wellbeing: "personal",
    zdrowie: "personal",
    studia: "personal",
    rodzina: "personal",
  };

  const slug = slugMap[normalized] ?? (normalized.replace(/_/g, "-") as CompanySlug);

  const { data } = await supabase
    .from("companies")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (data?.id) return data.id;

  // fallback: fuzzy name match
  const { data: byName } = await supabase
    .from("companies")
    .select("id")
    .ilike("name", `%${company}%`)
    .maybeSingle();

  return byName?.id ?? null;
}

export async function fetchDashboard() {
  const supabase = getSupabaseAdmin();

  const [{ data: companies }, { data: tasks }, { data: wellbeingRows }] =
    await Promise.all([
      supabase.from("companies").select("*").order("sort_order").order("name"),
      supabase
        .from("tasks")
        .select("*, companies(*)")
        .neq("status", "archived")
        .order("due_date", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("wellbeing")
        .select("*")
        .order("date", { ascending: false })
        .limit(1),
    ]);

  const tasksByCompany: Record<string, Task[]> = {};
  for (const company of companies ?? []) {
    tasksByCompany[company.id] = [];
  }
  for (const task of (tasks ?? []) as Task[]) {
    if (!tasksByCompany[task.company_id]) {
      tasksByCompany[task.company_id] = [];
    }
    tasksByCompany[task.company_id].push(task);
  }

  // Sort by priority + due date within each company
  const priorityOrder: Record<string, number> = {
    urgent: 0, high: 1, medium: 2, low: 3,
  };
  for (const id of Object.keys(tasksByCompany)) {
    tasksByCompany[id].sort(
      (a, b) =>
        (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3) ||
        (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999"),
    );
  }

  return {
    companies: (companies ?? []) as Company[],
    tasksByCompany,
    wellbeing: (wellbeingRows?.[0] as Wellbeing) ?? null,
  };
}

// Needed for the return type above
import type { Company } from "./types";

export async function insertTask(params: {
  title: string;
  company?: string;
  company_slug?: string;
  priority?: string;
  urgency?: string;
  due_date?: string | null;
  description?: string | null;
  duration_estimate?: string | null;
  subtasks?: string[] | { title: string; estimate?: string }[];
  subtasks_json?: Subtask[] | string[] | string | { title: string; estimate?: string }[];
  source_note?: string | null;
}) {
  const supabase = getSupabaseAdmin();
  const companyKey = params.company_slug ?? params.company ?? "";
  const companyId = await resolveCompanyId(companyKey);
  if (!companyId) {
    throw new Error(`Nieznana firma/obszar: ${companyKey}`);
  }

  const subtasks = normalizeSubtasks(params.subtasks_json ?? params.subtasks);

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      company_id: companyId,
      title: params.title,
      description: params.description ?? null,
      priority: params.priority ?? "medium",
      urgency: params.urgency ?? "normal",
      due_date: params.due_date ?? null,
      duration_estimate: params.duration_estimate ?? null,
      subtasks,
      source_note: params.source_note ?? null,
    })
    .select("*, companies(*)")
    .single();

  if (error) throw error;
  return data;
}

export async function updateTaskStatus(id: string, status: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("tasks")
    .update({ status })
    .eq("id", id)
    .select("*, companies(*)")
    .single();
  if (error) throw error;
  return data;
}

export async function updateTaskSubtasks(id: string, subtasks: Subtask[]) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("tasks")
    .update({ subtasks })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function listTasks(filters?: {
  company_slug?: string;
  status?: string;
  priority?: string;
}) {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("tasks")
    .select("id, title, priority, urgency, status, due_date, companies(name, slug)")
    .not("status", "eq", "archived");

  if (filters?.company_slug) {
    const companyId = await resolveCompanyId(filters.company_slug);
    if (companyId) query = query.eq("company_id", companyId);
  }
  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.priority) query = query.eq("priority", filters.priority);

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(25);

  if (error) throw error;
  return { tasks: data ?? [], count: data?.length ?? 0 };
}

export async function getDailyBriefing() {
  const supabase = getSupabaseAdmin();
  const today = new Date().toISOString().slice(0, 10);
  const in7Days = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);

  const [{ data: urgent }, { data: overdue }, { data: wellbeingToday }] =
    await Promise.all([
      supabase
        .from("tasks")
        .select("id, title, priority, urgency, due_date, duration_estimate, companies(name, slug)")
        .in("priority", ["urgent", "high"])
        .eq("status", "todo")
        .lte("due_date", in7Days)
        .order("due_date", { ascending: true })
        .limit(12),
      supabase
        .from("tasks")
        .select("id, title, due_date, companies(name, slug)")
        .lt("due_date", today)
        .eq("status", "todo"),
      supabase.from("wellbeing").select("*").eq("date", today).maybeSingle(),
    ]);

  const { data: urgentNoDate } = await supabase
    .from("tasks")
    .select("id, title, priority, urgency, companies(name, slug)")
    .in("urgency", ["critical", "high"])
    .eq("status", "todo")
    .is("due_date", null)
    .limit(8);

  return {
    urgent_this_week: urgent ?? [],
    overdue: overdue ?? [],
    urgent_no_date: urgentNoDate ?? [],
    wellbeing_today: wellbeingToday ?? null,
    generated_at: new Date().toISOString(),
  };
}

export async function logWellbeing(params: {
  sleep_score?: number | null;
  sleep_hours?: number | null;
  deep_sleep_hours?: number | null;
  energy_level?: number | null;
  bed_time?: string | null;
  wake_time?: string | null;
  supplements_taken?: boolean;
  supplements?: string[];
  supplements_notes?: string | null;
  notes?: string | null;
}) {
  const supabase = getSupabaseAdmin();
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("wellbeing")
    .upsert(
      {
        date: today,
        sleep_score: params.sleep_score ?? null,
        sleep_hours: params.sleep_hours ?? null,
        deep_sleep_hours: params.deep_sleep_hours ?? null,
        energy_level: params.energy_level ?? null,
        bed_time: params.bed_time ?? null,
        wake_time: params.wake_time ?? null,
        supplements_taken: params.supplements_taken ?? false,
        supplements: params.supplements ?? [],
        supplements_notes: params.supplements_notes ?? null,
        notes: params.notes ?? null,
      },
      { onConflict: "date" },
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function saveInboxCapture(rawText: string) {
  const supabase = getSupabaseAdmin();
  await supabase.from("inbox_captures").insert({ raw_text: rawText });
}

export async function fetchCompanyContexts(): Promise<Record<string, string>> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from("companies").select("slug, context").not("context", "is", null);
  const result: Record<string, string> = {};
  for (const row of data ?? []) {
    if (row.context) result[row.slug as string] = row.context as string;
  }
  return result;
}

export async function getWeeklyReview() {
  const supabase = getSupabaseAdmin();
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10);

  const [{ data: completed }, { data: overdue }, { data: opened }, { data: wellbeingRows }] =
    await Promise.all([
      supabase.from("tasks").select("id, title, companies(name, slug)")
        .eq("status", "done").gte("updated_at", weekAgo)
        .order("updated_at", { ascending: false }).limit(30),
      supabase.from("tasks").select("id, title, priority, due_date, companies(name, slug)")
        .lt("due_date", today).not("status", "in", '("done","archived")'),
      supabase.from("tasks").select("id, title, priority, companies(name, slug)")
        .gte("created_at", weekAgo).not("status", "in", '("done","archived")').limit(20),
      supabase.from("wellbeing").select("date, energy_level, sleep_hours")
        .gte("date", weekAgo).order("date", { ascending: true }),
    ]);

  return {
    completed: completed ?? [],
    overdue: overdue ?? [],
    opened_this_week: opened ?? [],
    wellbeing: wellbeingRows ?? [],
    week_from: weekAgo,
    week_to: today,
  };
}

export async function createCompany(params: {
  name: string;
  slug: string;
  icon: string;
  accent_color: string;
  context?: string | null;
}) {
  const supabase = getSupabaseAdmin();
  const { data: last } = await supabase
    .from("companies")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sort_order = (last?.sort_order ?? -1) + 1;
  const { data, error } = await supabase
    .from("companies")
    .insert({ ...params, sort_order })
    .select()
    .single();
  if (error) throw error;
  return data as Company;
}

export async function updateCompany(
  id: string,
  params: Partial<{ name: string; slug: string; icon: string; accent_color: string; sort_order: number; context: string | null }>,
) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("companies")
    .update(params)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Company;
}

export async function deleteCompany(id: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("companies").delete().eq("id", id);
  if (error) throw error;
}

export async function reorderCompanies(order: { id: string; sort_order: number }[]) {
  const supabase = getSupabaseAdmin();
  await Promise.all(
    order.map(({ id, sort_order }) =>
      supabase.from("companies").update({ sort_order }).eq("id", id),
    ),
  );
}

export async function deleteTask(id: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
}

export async function completeRecurringTask(id: string, date: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("tasks")
    .update({ recurrence_last_completed: date })
    .eq("id", id)
    .select("id, title, recurrence_last_completed")
    .single();
  if (error) throw error;
  return data;
}

export async function updateTask(
  id: string,
  params: {
    title?: string;
    company_slug?: string;
    priority?: string;
    urgency?: string;
    status?: string;
    due_date?: string | null;
    description?: string | null;
  },
) {
  const supabase = getSupabaseAdmin();
  const update: Record<string, unknown> = {};

  if (params.title !== undefined) update.title = params.title;
  if (params.priority !== undefined) update.priority = params.priority;
  if (params.urgency !== undefined) update.urgency = params.urgency;
  if (params.status !== undefined) update.status = params.status;
  if (params.due_date !== undefined) update.due_date = params.due_date;
  if (params.description !== undefined) update.description = params.description;

  if (params.company_slug) {
    const companyId = await resolveCompanyId(params.company_slug);
    if (!companyId) throw new Error(`Nieznana firma: ${params.company_slug}`);
    update.company_id = companyId;
  }

  const { data, error } = await supabase
    .from("tasks")
    .update(update)
    .eq("id", id)
    .select("*, companies(*)")
    .single();
  if (error) throw error;
  return data;
}

// ─── Goals ────────────────────────────────────────────────

export async function getActiveGoal(): Promise<Goal | null> {
  const supabase = getSupabaseAdmin();
  const { data: goal } = await supabase
    .from("goals")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!goal) return null;

  const { data: entries } = await supabase
    .from("goal_entries")
    .select("*")
    .eq("goal_id", goal.id)
    .order("date", { ascending: false });

  return { ...goal, entries: (entries ?? []) as GoalEntry[] } as Goal;
}

export async function createGoal(params: {
  title: string;
  target_amount: number;
  currency?: string;
  start_date: string;
  end_date: string;
}): Promise<Goal> {
  const supabase = getSupabaseAdmin();
  await supabase.from("goals").update({ is_active: false }).eq("is_active", true);
  const { data, error } = await supabase
    .from("goals")
    .insert({ ...params, currency: params.currency ?? "PLN", is_active: true })
    .select()
    .single();
  if (error) throw error;
  return data as Goal;
}

export async function updateGoal(
  id: string,
  params: Partial<{ title: string; target_amount: number; start_date: string; end_date: string; is_active: boolean }>,
): Promise<Goal> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("goals")
    .update({ ...params, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Goal;
}

export async function deleteGoal(id: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("goals").delete().eq("id", id);
  if (error) throw error;
}

export async function addGoalEntry(goalId: string, amount: number, note?: string): Promise<GoalEntry> {
  const supabase = getSupabaseAdmin();
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("goal_entries")
    .insert({ goal_id: goalId, amount, date: today, note: note ?? null })
    .select()
    .single();
  if (error) throw error;
  return data as GoalEntry;
}

export async function deleteGoalEntry(entryId: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("goal_entries").delete().eq("id", entryId);
  if (error) throw error;
}
