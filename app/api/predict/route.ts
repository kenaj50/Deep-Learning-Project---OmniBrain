import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const FASTAPI_URL = process.env.FASTAPI_URL ?? "http://localhost:8000";

const TASK_KEYWORDS: Record<string, RegExp> = {
  programming: /kod|bug|deploy|api|serwer|program|develop|fix|feature|github|implementa|backend|frontend/i,
  meeting:     /spotkani|meeting|call|rozmow|konferencj|prezenta|demo|sync/i,
  admin:       /email|faktur|ksiegow|admin|dokument|papier|wyśl|napisz|umowa|płatno/i,
  creative:    /projekt|design|content|post|artykuł|video|grafik|kreacja|kampani/i,
  planning:    /plan|harmonogram|lista|priorytet|przeglą|strategia|analiz/i,
};

function detectTaskType(title: string, description = ""): string {
  const text = title + " " + description;
  for (const [type, re] of Object.entries(TASK_KEYWORDS)) {
    if (re.test(text)) return type;
  }
  return "admin";
}

export async function POST(req: Request) {
  const { title = "", description = "" } = await req.json();

  const supabase = getSupabaseAdmin();
  const today = new Date().toISOString().slice(0, 10);
  const { data: wb } = await supabase.from("wellbeing").select("sleep_hours, energy_level").eq("date", today).maybeSingle();

  const now = new Date();
  const body = {
    task_type:       detectTaskType(title, description),
    sleep_hours:     wb?.sleep_hours ?? 7,
    energy_level:    wb?.energy_level ?? 7,
    day_of_week:     now.getDay() === 0 ? 6 : now.getDay() - 1,
    hour_of_day:     now.getHours(),
    description_len: (title + description).length,
  };

  try {
    const res = await fetch(`${FASTAPI_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) return NextResponse.json({ available: false });
    const data = await res.json();
    return NextResponse.json({ available: true, ...data, wellbeing: wb ?? null });
  } catch {
    return NextResponse.json({ available: false });
  }
}
