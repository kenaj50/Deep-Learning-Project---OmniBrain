import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function buildFreeModelContext(): Promise<string> {
  const supabase = getSupabaseAdmin();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: tasks }, { data: wellbeing }] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, priority, urgency, due_date, companies(name, slug)")
      .not("status", "in", '("done","archived")')
      .order("priority", { ascending: true })
      .limit(50),
    supabase.from("wellbeing").select("energy_level, sleep_hours").eq("date", today).maybeSingle(),
  ]);

  const slugOrder = ["aiosystems", "kolmat", "hyper-human", "personal"] as const;
  const companyNames: Record<string, string> = {
    aiosystems: "AioSystems",
    kolmat: "Kolmat",
    "hyper-human": "Hyper Human",
    personal: "Personal",
  };

  type TaskRow = { id: string; title: string; priority: string; urgency: string; due_date: string | null };
  const byCompany: Record<string, TaskRow[]> = Object.fromEntries(slugOrder.map((s) => [s, []]));

  for (const t of tasks ?? []) {
    const slug = (t.companies as unknown as { slug: string } | null)?.slug ?? "personal";
    (byCompany[slug] ??= []).push(t as TaskRow);
  }

  let ctx = `=== TWOJE AKTYWNE TASKI (UUID do updateTaskStatus/deleteTask) ===\nDziś: ${today}\n`;

  for (const slug of slugOrder) {
    const list = byCompany[slug] ?? [];
    ctx += `\n[${companyNames[slug]}] ${list.length} aktywnych\n`;
    for (const t of list) {
      const prio = t.priority === "urgent" ? "🔴" : t.priority === "high" ? "🟡" : "⚪";
      const crit = t.urgency === "critical" ? " [CRITICAL]" : "";
      const due = t.due_date ? ` | termin: ${t.due_date}` : "";
      ctx += `  ${prio}${crit} ${t.title}${due}\n  uuid: ${t.id}\n`;
    }
  }

  ctx += `\nWellbeing dziś: ${wellbeing ? `energia ${wellbeing.energy_level}/10, sen ${wellbeing.sleep_hours}h` : "nie zalogowano"}`;
  return ctx;
}

export const FREE_MODEL_ACTIONS_INSTRUCTIONS = `
=== JAK WYKONYWAĆ AKCJE ===
Na końcu odpowiedzi (po tekście) dodaj blok — zostanie wykonany automatycznie:

<omni-actions>[
  {"action":"createTask","title":"Tytuł taska","company_slug":"aiosystems","priority":"high","urgency":"normal","due_date":"YYYY-MM-DD","duration_estimate":"2h","subtasks":[{"title":"Krok 1 od czasownika","estimate":"30min"},{"title":"Krok 2","estimate":"1h"}]},
  {"action":"logWellbeing","sleep_hours":7,"energy_level":8,"supplements":["magnez","D3"]},
  {"action":"updateTaskStatus","id":"PELNE-UUID-Z-POWYZEJ","status":"done"},
  {"action":"deleteTask","id":"PELNE-UUID-Z-POWYZEJ"}
]</omni-actions>

Pola (gwiazdka = wymagane):
- createTask: title*, company_slug* (aiosystems|kolmat|hyper-human|personal), priority (urgent|high|medium|low), urgency (critical|high|normal|low), due_date, duration_estimate (łączny czas np. "2h"), subtasks[] opcjonalne — tylko dla złożonych zadań (obiekty {title, estimate})
- logWellbeing: sleep_hours, energy_level (1-10), supplements[], bed_time (HH:MM), wake_time, notes
- updateTaskStatus: id*, status* (todo|in_progress|done|blocked|archived)
- deleteTask: id*

ZASADY:
- Blok <omni-actions> zawiera TYLKO poprawną tablicę JSON — zero tekstu wewnątrz
- Jeśli nie wykonujesz akcji — nie dodawaj bloku
- Surowa notatka → createTask dla KAŻDEGO zadania bez pytania
- Mapuj firmę na podstawie słów kluczowych (patrz mapowanie powyżej)
- Używaj PEŁNYCH UUID z sekcji "TWOJE AKTYWNE TASKI" powyżej`;
