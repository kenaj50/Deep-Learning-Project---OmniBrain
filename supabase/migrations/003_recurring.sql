-- Powtarzające się zadania
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS recurrence_rule TEXT
    CHECK (recurrence_rule IN ('daily', 'weekdays', 'weekends', 'weekly')),
  ADD COLUMN IF NOT EXISTS recurrence_days TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS recurrence_last_completed DATE;
