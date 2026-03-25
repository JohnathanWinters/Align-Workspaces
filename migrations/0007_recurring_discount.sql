ALTER TABLE spaces ADD COLUMN IF NOT EXISTS recurring_discount_percent integer;
ALTER TABLE spaces ADD COLUMN IF NOT EXISTS recurring_discount_after integer DEFAULT 0;
