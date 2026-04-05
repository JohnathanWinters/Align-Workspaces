ALTER TABLE spaces ADD COLUMN IF NOT EXISTS recurring_min_bookings INTEGER DEFAULT 1;
UPDATE spaces SET recurring_discount_after = 0 WHERE recurring_discount_after = 3 AND (recurring_discount_percent IS NULL OR recurring_discount_percent = 0);
