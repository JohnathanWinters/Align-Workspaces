-- Phase 2: Check-in/check-out system for space bookings
-- Adds tracking columns for guest arrival, departure, overtime, and no-shows

ALTER TABLE space_bookings ADD COLUMN IF NOT EXISTS checked_in_at timestamp;
ALTER TABLE space_bookings ADD COLUMN IF NOT EXISTS checked_out_at timestamp;
ALTER TABLE space_bookings ADD COLUMN IF NOT EXISTS checked_in_by text;
ALTER TABLE space_bookings ADD COLUMN IF NOT EXISTS checked_out_by text;
ALTER TABLE space_bookings ADD COLUMN IF NOT EXISTS no_show integer DEFAULT 0;
ALTER TABLE space_bookings ADD COLUMN IF NOT EXISTS overtime_minutes integer DEFAULT 0;
ALTER TABLE space_bookings ADD COLUMN IF NOT EXISTS checkout_notes text;

-- Index for notification queries (find bookings by status + date efficiently)
CREATE INDEX IF NOT EXISTS idx_space_bookings_status_date ON space_bookings(status, booking_date);
