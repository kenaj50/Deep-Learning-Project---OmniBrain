-- Cele finansowe z paskiem postępu
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
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id   UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  amount    NUMERIC(12,2) NOT NULL,
  date      DATE NOT NULL DEFAULT CURRENT_DATE,
  note      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE goals        ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON goals        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON goal_entries FOR ALL USING (true) WITH CHECK (true);
