-- Normalize recurring_discount_after values after the host form dropdown
-- was restricted to {0, 2, 3, 4, 8, 12}. Map any legacy values to the
-- closest remaining option so existing spaces render correctly in the UI.

UPDATE spaces SET recurring_discount_after = 2  WHERE recurring_discount_after = 1;
UPDATE spaces SET recurring_discount_after = 4  WHERE recurring_discount_after = 5;
UPDATE spaces SET recurring_discount_after = 12 WHERE recurring_discount_after = 10;

-- Catch-all for any other unexpected values (6, 7, 9, 11, >12, etc.):
-- snap to the nearest valid option.
UPDATE spaces SET recurring_discount_after = 2
  WHERE recurring_discount_after NOT IN (0, 2, 3, 4, 8, 12)
    AND recurring_discount_after < 3;
UPDATE spaces SET recurring_discount_after = 4
  WHERE recurring_discount_after NOT IN (0, 2, 3, 4, 8, 12)
    AND recurring_discount_after BETWEEN 3 AND 6;
UPDATE spaces SET recurring_discount_after = 8
  WHERE recurring_discount_after NOT IN (0, 2, 3, 4, 8, 12)
    AND recurring_discount_after BETWEEN 6 AND 10;
UPDATE spaces SET recurring_discount_after = 12
  WHERE recurring_discount_after NOT IN (0, 2, 3, 4, 8, 12)
    AND recurring_discount_after > 10;
