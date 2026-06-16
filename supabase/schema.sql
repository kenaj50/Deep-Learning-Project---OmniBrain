-- ============================================================
-- OmniBrain — Schema kompletny (DDL)
-- Ten plik zawiera PEŁNY schemat łącznie z migracjami 002–007.
-- Uruchom go przy fresh install zamiast migracji po kolei.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- COMPANIES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS companies (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL UNIQUE,
  slug         TEXT NOT NULL UNIQUE,
  accent_color TEXT NOT NULL DEFAULT '#6366f1',
  icon         TEXT NOT NULL DEFAULT '🏢',
  sort_order   INTEGER NOT NULL DEFAULT 0,   -- migration 002
  context      TEXT,                          -- migration 007 (notatki dla AI)
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS companies_sort_order_idx ON companies (sort_order);

-- ─────────────────────────────────────────────────────────────
-- TASKS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id                 UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title                      TEXT NOT NULL,
  description                TEXT,
  priority                   TEXT NOT NULL DEFAULT 'medium'
                               CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
  urgency                    TEXT NOT NULL DEFAULT 'normal'
                               CHECK (urgency IN ('critical', 'high', 'normal', 'low')),
  status                     TEXT NOT NULL DEFAULT 'todo'
                               CHECK (status IN ('todo', 'in_progress', 'done', 'blocked', 'archived')),
  due_date                   DATE,
  subtasks                   JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_note                TEXT,
  sort_order                 INTEGER NOT NULL DEFAULT 0,    -- migration 002
  recurrence_rule            TEXT                           -- migration 003
                               CHECK (recurrence_rule IN ('daily', 'weekdays', 'weekends', 'weekly')),
  recurrence_days            TEXT[] DEFAULT '{}',           -- migration 003
  recurrence_last_completed  DATE,                          -- migration 003
  duration_estimate          TEXT,                          -- migration 006 (np. "2h", "30min")
  created_at                 TIMESTAMPTZ DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_company_status   ON tasks(company_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date         ON tasks(due_date) WHERE status NOT IN ('done', 'archived');
CREATE INDEX IF NOT EXISTS tasks_sort_order_idx       ON tasks (sort_order);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at       ON tasks (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_priority_urgency ON tasks (priority, urgency) WHERE status NOT IN ('done', 'archived');

-- ─────────────────────────────────────────────────────────────
-- WELLBEING
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wellbeing (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date              DATE NOT NULL UNIQUE DEFAULT CURRENT_DATE,
  sleep_score       INT  CHECK (sleep_score IS NULL OR sleep_score BETWEEN 0 AND 100),
  sleep_hours       NUMERIC(4,2),
  deep_sleep_hours  NUMERIC(4,2),
  energy_level      INT  CHECK (energy_level IS NULL OR energy_level BETWEEN 1 AND 10),
  bed_time          TIME,
  wake_time         TIME,
  supplements_taken BOOLEAN DEFAULT false,
  supplements       JSONB NOT NULL DEFAULT '[]'::jsonb,
  supplements_notes TEXT,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- INBOX CAPTURES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inbox_captures (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_text   TEXT NOT NULL,
  processed  BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- GOALS (migration 004) — cele finansowe
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS goals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  target_amount NUMERIC(12,2) NOT NULL,
  currency      TEXT NOT NULL DEFAULT 'PLN',
  start_date    DATE NOT NULL,
  end_date      DATE NOT NULL,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goal_entries (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id    UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  amount     NUMERIC(12,2) NOT NULL,
  date       DATE NOT NULL DEFAULT CURRENT_DATE,
  note       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- CHAT SESSIONS (migration 005) — historia rozmów z AI
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_sessions (
  id         TEXT PRIMARY KEY,
  title      TEXT NOT NULL DEFAULT 'Rozmowa',
  messages   JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS chat_sessions_updated_at_idx ON chat_sessions (updated_at DESC);

-- ─────────────────────────────────────────────────────────────
-- TRIGGERS
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tasks_updated_at ON tasks;
CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- RLS — permissive (single-user MVP)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE companies      ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellbeing      ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbox_captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals          ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_entries   ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON companies      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON tasks          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON wellbeing      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON inbox_captures FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON goals          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON goal_entries   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON chat_sessions  FOR ALL USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- SEED — 4 obszary operacyjne
-- ─────────────────────────────────────────────────────────────
INSERT INTO companies (name, slug, accent_color, icon, sort_order) VALUES
  ('AioSystems',       'aiosystems',  '#8b5cf6', '🤖', 0),
  ('Kolmat Trade',     'kolmat',      '#22c55e', '🏪', 1),
  ('Hyper Human Club', 'hyper-human', '#f59e0b', '🧠', 2),
  ('Prywatne',         'personal',    '#3b82f6', '👤', 3)
ON CONFLICT (slug) DO UPDATE SET
  accent_color = EXCLUDED.accent_color,
  icon         = EXCLUDED.icon;
