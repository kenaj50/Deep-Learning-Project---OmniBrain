import { tool } from "ai";
import { z } from "zod";
import {
  COMPANY_SLUGS,
  deleteTask,
  getDailyBriefing,
  getWeeklyReview,
  insertTask,
  listTasks,
  logWellbeing,
  saveInboxCapture,
  updateTask,
  updateTaskStatus,
} from "@/lib/supabase/queries";

const companySlugSchema = z.enum(COMPANY_SLUGS);

export const omniBrainTools = {
  createTask: tool({
    description:
      "Tworzy zadanie w obszarze operacyjnym z sub-taskami i terminem. Wywołuj dla każdego rozpoznanego zadania z notatki.",
    inputSchema: z.object({
      title: z.string().max(120).describe("Krótki tytuł zadania"),
      company_slug: companySlugSchema.describe(
        "Obszar: aiosystems | kolmat | hyper-human | personal",
      ),
      priority: z
        .enum(["urgent", "high", "medium", "low"])
        .default("medium")
        .describe("urgent=dziś, high=tydzień, medium=miesiąc, low=kiedy indziej"),
      urgency: z
        .enum(["critical", "high", "normal", "low"])
        .default("normal")
        .describe("critical=blokuje, high=ważne"),
      due_date: z.string().optional().describe("Termin YYYY-MM-DD"),
      description: z.string().optional(),
      duration_estimate: z.string().optional().describe("Łączny szacowany czas, np. '30min', '2h', '1-3h', '2 dni'"),
      subtasks: z
        .array(
          z.object({
            title: z.string().describe("Krok zaczynający się od czasownika"),
            estimate: z.string().optional().describe("Czas kroku, np. '15min', '1h'"),
          }),
        )
        .max(6)
        .optional()
        .describe("Opcjonalne — tylko gdy zadanie wymaga wielu kroków. Proste taski bez subtasków. Złożone: 2-5 kroków od czasownika z estimate."),
      source_note: z.string().optional().describe("Oryginalny fragment notatki"),
    }),
    execute: async (input) => {
      const task = await insertTask({
        title: input.title,
        company_slug: input.company_slug,
        priority: input.priority,
        urgency: input.urgency,
        due_date: input.due_date,
        description: input.description,
        duration_estimate: input.duration_estimate,
        subtasks_json: input.subtasks as { title: string; estimate?: string }[],
        source_note: input.source_note,
      });
      return { success: true, task_id: task.id, title: task.title, company: input.company_slug };
    },
  }),

  updateTaskStatus: tool({
    description: "Zmienia status istniejącego zadania po UUID.",
    inputSchema: z.object({
      id: z.string().uuid(),
      status: z.enum(["todo", "in_progress", "done", "blocked", "archived"]),
    }),
    execute: async ({ id, status }) => {
      const task = await updateTaskStatus(id, status);
      return { success: true, task_id: task.id, title: task.title };
    },
  }),

  listTasks: tool({
    description: "Pobiera listę zadań z opcjonalnymi filtrami.",
    inputSchema: z.object({
      company_slug: companySlugSchema.optional(),
      status: z
        .enum(["todo", "in_progress", "done", "blocked", "archived"])
        .optional(),
      priority: z.enum(["urgent", "high", "medium", "low"]).optional(),
    }),
    execute: async (filters) => listTasks(filters),
  }),

  getDailyBriefing: tool({
    description:
      "Briefing dnia: pilne na tydzień, zaległe terminy, critical bez daty, wellbeing dziś.",
    inputSchema: z.object({}),
    execute: async () => getDailyBriefing(),
  }),

  deleteTask: tool({
    description:
      "Przenosi zadanie do kosza (status: archived). Zadanie można przywrócić. Używaj gdy użytkownik prosi o usunięcie lub wyrzucenie taska.",
    inputSchema: z.object({
      id: z.string().uuid().describe("UUID zadania do archiwizacji"),
    }),
    execute: async ({ id }) => {
      const task = await updateTaskStatus(id, "archived");
      return { success: true, task_id: task.id, title: task.title, note: "przeniesione do kosza (archived)" };
    },
  }),

  updateTask: tool({
    description:
      "Aktualizuje dowolne pole zadania: tytuł, priorytet, pilność, termin, opis, status. Użyj company_slug żeby przenieść taska do innej firmy/obszaru.",
    inputSchema: z.object({
      id: z.string().uuid().describe("UUID zadania"),
      title: z.string().max(120).optional(),
      company_slug: companySlugSchema
        .optional()
        .describe("Nowy obszar — przenosi taska do innej firmy"),
      priority: z.enum(["urgent", "high", "medium", "low"]).optional(),
      urgency: z.enum(["critical", "high", "normal", "low"]).optional(),
      status: z
        .enum(["todo", "in_progress", "done", "blocked", "archived"])
        .optional(),
      due_date: z
        .string()
        .nullable()
        .optional()
        .describe("YYYY-MM-DD albo null żeby usunąć termin"),
      description: z.string().nullable().optional(),
    }),
    execute: async ({ id, ...params }) => {
      const task = await updateTask(id, params);
      return { success: true, task_id: task.id, title: task.title };
    },
  }),

  getWeeklyReview: tool({
    description:
      "Pobiera dane do weekly review: taski ukończone w tym tygodniu, zaległe, otwarte, wellbeing. Wywołaj gdy użytkownik prosi o weekly review lub podsumowanie tygodnia.",
    inputSchema: z.object({}),
    execute: async () => getWeeklyReview(),
  }),

  logWellbeing: tool({
    description: "Loguje wellbeing na dziś: sen, energia, suplementy.",
    inputSchema: z.object({
      sleep_score: z.number().min(0).max(100).optional().describe("Jakość snu 0-100%"),
      sleep_hours: z.number().min(0).max(24).optional().describe("Godziny snu"),
      deep_sleep_hours: z.number().optional(),
      energy_level: z.number().min(1).max(10).optional().describe("Energia 1-10"),
      bed_time: z.string().optional().describe("HH:MM"),
      wake_time: z.string().optional().describe("HH:MM"),
      supplements_taken: z.boolean().optional(),
      supplements: z.array(z.string()).optional().describe("Lista suplementów"),
      supplements_notes: z.string().optional(),
      notes: z.string().optional(),
    }),
    execute: async (input) => {
      const entry = await logWellbeing(input);
      return { success: true, entry };
    },
  }),
};

export async function captureRawInbox(text: string) {
  try {
    await saveInboxCapture(text);
  } catch {
    /* inbox optional — never block the main request */
  }
}
