ALTER TABLE spaces ALTER COLUMN recurring_discount_after SET DEFAULT 3;
UPDATE spaces SET recurring_discount_after = 3 WHERE recurring_discount_after = 0 OR recurring_discount_after IS NULL;
