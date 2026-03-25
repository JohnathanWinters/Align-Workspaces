-- Host Google Calendar connections (per-host OAuth)
CREATE TABLE IF NOT EXISTS host_calendar_connections (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  provider text NOT NULL DEFAULT 'google',
  access_token text,
  refresh_token text NOT NULL,
  token_expires_at timestamp,
  calendar_id text DEFAULT 'primary',
  sync_enabled integer DEFAULT 1,
  last_sync_at timestamp,
  last_sync_error text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- iCal feed imports (per space, multiple allowed)
CREATE TABLE IF NOT EXISTS ical_feeds (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id varchar NOT NULL,
  user_id text NOT NULL,
  feed_url text NOT NULL,
  feed_name text,
  is_active integer DEFAULT 1,
  last_fetch_at timestamp,
  last_fetch_error text,
  created_at timestamp DEFAULT now()
);

-- Cached blocked time slots from external calendars
CREATE TABLE IF NOT EXISTS external_calendar_blocks (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id varchar NOT NULL,
  source text NOT NULL,
  source_id text NOT NULL,
  external_event_id text,
  title text,
  block_date text NOT NULL,
  block_start_time text NOT NULL,
  block_end_time text NOT NULL,
  all_day integer DEFAULT 0,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_external_blocks_space_date ON external_calendar_blocks(space_id, block_date);
CREATE INDEX IF NOT EXISTS idx_external_blocks_source ON external_calendar_blocks(source_id);
CREATE INDEX IF NOT EXISTS idx_ical_feeds_space ON ical_feeds(space_id);
CREATE INDEX IF NOT EXISTS idx_host_calendar_user ON host_calendar_connections(user_id);
