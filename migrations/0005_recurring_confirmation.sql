-- Add confirmation flow columns to recurring_bookings
ALTER TABLE recurring_bookings ADD COLUMN IF NOT EXISTS requested_by text;
ALTER TABLE recurring_bookings ADD COLUMN IF NOT EXISTS requested_by_role text;
ALTER TABLE recurring_bookings ADD COLUMN IF NOT EXISTS confirmed_by text;
ALTER TABLE recurring_bookings ADD COLUMN IF NOT EXISTS confirmed_at timestamp;
ALTER TABLE recurring_bookings ADD COLUMN IF NOT EXISTS declined_at timestamp;
ALTER TABLE recurring_bookings ADD COLUMN IF NOT EXISTS decline_reason text;

-- Link individual bookings back to their recurring parent
ALTER TABLE space_bookings ADD COLUMN IF NOT EXISTS recurring_booking_id varchar;

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_space_bookings_recurring ON space_bookings(recurring_booking_id);
CREATE INDEX IF NOT EXISTS idx_recurring_bookings_space_status ON recurring_bookings(space_id, status);

-- Backfill: existing active recurring bookings were created by the guest
UPDATE recurring_bookings SET requested_by = user_id, requested_by_role = 'guest' WHERE requested_by IS NULL;
