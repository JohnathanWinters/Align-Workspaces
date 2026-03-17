-- Phase 1: Three-tier fee structure, referral links, fee audit log
-- Adds new columns to space_bookings and creates supporting tables

-- New columns on space_bookings for three-tier fee tracking
ALTER TABLE space_bookings ADD COLUMN IF NOT EXISTS fee_tier text;
ALTER TABLE space_bookings ADD COLUMN IF NOT EXISTS host_fee_percent text;
ALTER TABLE space_bookings ADD COLUMN IF NOT EXISTS guest_fee_percent text;
ALTER TABLE space_bookings ADD COLUMN IF NOT EXISTS guest_fee_amount integer;
ALTER TABLE space_bookings ADD COLUMN IF NOT EXISTS tax_rate text;
ALTER TABLE space_bookings ADD COLUMN IF NOT EXISTS tax_amount integer;
ALTER TABLE space_bookings ADD COLUMN IF NOT EXISTS total_guest_charged integer;
ALTER TABLE space_bookings ADD COLUMN IF NOT EXISTS host_payout_amount integer;
ALTER TABLE space_bookings ADD COLUMN IF NOT EXISTS platform_revenue integer;
ALTER TABLE space_bookings ADD COLUMN IF NOT EXISTS referral_link_id text;
ALTER TABLE space_bookings ADD COLUMN IF NOT EXISTS stripe_transfer_id text;
ALTER TABLE space_bookings ADD COLUMN IF NOT EXISTS payout_status text;
ALTER TABLE space_bookings ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now();

-- Referral links table
CREATE TABLE IF NOT EXISTS referral_links (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id text NOT NULL,
  space_id varchar,
  unique_code text NOT NULL UNIQUE,
  click_count integer DEFAULT 0,
  booking_count integer DEFAULT 0,
  total_revenue_generated integer DEFAULT 0,
  created_at timestamp DEFAULT now()
);

-- Fee audit log — immutable record of every fee calculation
CREATE TABLE IF NOT EXISTS fee_audit_log (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id varchar NOT NULL,
  fee_tier text NOT NULL,
  base_price_cents integer NOT NULL,
  guest_fee_percent text NOT NULL,
  guest_fee_amount integer NOT NULL,
  host_fee_percent text NOT NULL,
  host_fee_amount integer NOT NULL,
  tax_rate text NOT NULL,
  tax_amount integer NOT NULL,
  total_guest_charged integer NOT NULL,
  host_payout_amount integer NOT NULL,
  platform_revenue integer NOT NULL,
  is_repeat_guest integer DEFAULT 0,
  is_host_referred integer DEFAULT 0,
  referral_link_id text,
  tax_jurisdiction text,
  created_at timestamp DEFAULT now()
);

-- Index for repeat guest check (completed bookings by user)
CREATE INDEX IF NOT EXISTS idx_space_bookings_user_status ON space_bookings(user_id, status);

-- Index for referral link lookups
CREATE INDEX IF NOT EXISTS idx_referral_links_code ON referral_links(unique_code);
CREATE INDEX IF NOT EXISTS idx_referral_links_host ON referral_links(host_id);

-- Index for fee audit log
CREATE INDEX IF NOT EXISTS idx_fee_audit_log_booking ON fee_audit_log(booking_id);
