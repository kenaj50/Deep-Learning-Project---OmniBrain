-- Add sort_order to companies (for drag-and-drop reordering)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0 NOT NULL;
UPDATE companies SET sort_order = 0 WHERE sort_order IS NULL;

-- Add sort_order to tasks (for manual reordering within company)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0 NOT NULL;
UPDATE tasks SET sort_order = 0 WHERE sort_order IS NULL;

-- Index for faster ordering queries
CREATE INDEX IF NOT EXISTS companies_sort_order_idx ON companies (sort_order);
CREATE INDEX IF NOT EXISTS tasks_sort_order_idx ON tasks (sort_order);
