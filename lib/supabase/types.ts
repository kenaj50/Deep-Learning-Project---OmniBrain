export type CompanySlug = "aiosystems" | "kolmat" | "hyper-human" | "personal" | (string & {});
export type TaskPriority = "urgent" | "high" | "medium" | "low";
export type TaskUrgency = "critical" | "high" | "normal" | "low";
export type TaskStatus = "todo" | "in_progress" | "done" | "blocked" | "archived";

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
  estimate?: string;
}

export interface Company {
  id: string;
  name: string;
  slug: CompanySlug;
  accent_color: string;
  icon: string;
  sort_order: number;
  context?: string | null;
  created_at?: string;
}

export type RecurrenceRule = "daily" | "weekdays" | "weekends" | "weekly";

export interface Task {
  id: string;
  company_id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  urgency: TaskUrgency;
  status: TaskStatus;
  due_date: string | null;
  subtasks: Subtask[];
  duration_estimate: string | null;
  source_note: string | null;
  sort_order: number;
  recurrence_rule: RecurrenceRule | null;
  recurrence_days: string[] | null;
  recurrence_last_completed: string | null;
  created_at: string;
  updated_at: string;
  companies?: Company;
}

export interface Goal {
  id: string;
  title: string;
  target_amount: number;
  currency: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  entries?: GoalEntry[];
}

export interface GoalEntry {
  id: string;
  goal_id: string;
  amount: number;
  date: string;
  note: string | null;
  created_at: string;
}

export interface Wellbeing {
  id: string;
  date: string;
  sleep_score: number | null;
  sleep_hours: number | null;
  deep_sleep_hours: number | null;
  energy_level: number | null;
  bed_time: string | null;
  wake_time: string | null;
  supplements_taken: boolean;
  supplements_notes: string | null;
  supplements: string[];
  notes: string | null;
}

export interface DashboardData {
  companies: Company[];
  tasksByCompany: Record<string, Task[]>;
  wellbeing: Wellbeing | null;
}

// Web Speech API globals (not in standard TypeScript lib)
declare global {
  interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
  }
  interface SpeechRecognitionResultList {
    readonly length: number;
    [index: number]: SpeechRecognitionResult;
  }
  interface SpeechRecognitionResult {
    readonly length: number;
    readonly isFinal: boolean;
    [index: number]: SpeechRecognitionAlternative;
  }
  interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
  }
  interface SpeechRecognition extends EventTarget {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    start(): void;
    stop(): void;
    abort(): void;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onend: (() => void) | null;
    onerror: ((event: Event) => void) | null;
  }
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}
