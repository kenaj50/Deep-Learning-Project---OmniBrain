-- Dodatkowe indeksy dla wydajności zapytań
CREATE INDEX IF NOT EXISTS idx_tasks_created_at        ON tasks (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_priority_urgency  ON tasks (priority, urgency) WHERE status NOT IN ('done', 'archived');
