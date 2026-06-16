import { NextResponse } from "next/server";
import { insertTask, updateTaskStatus, logWellbeing } from "@/lib/supabase/queries";

type AnyAction = Record<string, unknown>;

export interface ActionResult {
  action: string;
  success: boolean;
  title?: string;
  company?: string;
  error?: string;
}

async function runAction(raw: AnyAction): Promise<ActionResult> {
  switch (raw.action) {
    case "createTask": {
      const task = await insertTask({
        title: raw.title as string,
        company_slug: raw.company_slug as string,
        priority: (raw.priority as string) ?? "medium",
        urgency: (raw.urgency as string) ?? "normal",
        due_date: raw.due_date as string | undefined,
        duration_estimate: raw.duration_estimate as string | undefined,
        subtasks_json: raw.subtasks as { title: string; estimate?: string }[] | string[] | undefined,
        description: raw.description as string | undefined,
      });
      return { action: "createTask", success: true, title: task.title, company: raw.company_slug as string };
    }
    case "logWellbeing": {
      await logWellbeing({
        sleep_hours: raw.sleep_hours as number | undefined,
        energy_level: raw.energy_level as number | undefined,
        supplements: raw.supplements as string[] | undefined,
        supplements_taken: (raw.supplements as string[] | undefined)?.length ? true : raw.supplements_taken as boolean | undefined,
        bed_time: raw.bed_time as string | undefined,
        wake_time: raw.wake_time as string | undefined,
        notes: raw.notes as string | undefined,
      });
      return { action: "logWellbeing", success: true };
    }
    case "updateTaskStatus": {
      const task = await updateTaskStatus(raw.id as string, raw.status as string);
      return { action: "updateTaskStatus", success: true, title: task.title };
    }
    case "deleteTask": {
      const task = await updateTaskStatus(raw.id as string, "archived");
      return { action: "deleteTask", success: true, title: task.title };
    }
    default:
      return { action: String(raw.action), success: false, error: `Nieznana akcja: ${raw.action}` };
  }
}

export async function POST(req: Request) {
  let actions: AnyAction[];
  try {
    const body = await req.json();
    actions = Array.isArray(body.actions) ? body.actions : [];
  } catch {
    return NextResponse.json({ error: "Niepoprawny JSON", results: [] }, { status: 400 });
  }

  if (actions.length === 0) return NextResponse.json({ results: [] });
  if (actions.length > 30) {
    return NextResponse.json({ error: "Maks. 30 akcji naraz", results: [] }, { status: 400 });
  }

  const results: ActionResult[] = [];
  for (const action of actions) {
    try {
      results.push(await runAction(action));
    } catch (err) {
      results.push({
        action: String(action.action ?? "unknown"),
        success: false,
        error: err instanceof Error ? err.message : "Nieznany błąd",
      });
    }
  }

  return NextResponse.json({ results });
}
