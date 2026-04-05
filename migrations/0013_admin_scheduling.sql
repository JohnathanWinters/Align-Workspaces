CREATE TABLE IF NOT EXISTS admin_schedules (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_name TEXT NOT NULL,
  admin_email TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  weekly_schedule TEXT,
  meeting_duration_minutes INTEGER DEFAULT 30,
  buffer_minutes INTEGER DEFAULT 15,
  max_days_in_advance INTEGER DEFAULT 30,
  timezone TEXT DEFAULT 'America/New_York',
  meeting_title TEXT DEFAULT 'Meeting with Align',
  meeting_description TEXT,
  location TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_schedule_overrides (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id VARCHAR NOT NULL,
  override_date TEXT NOT NULL,
  is_blocked INTEGER DEFAULT 0,
  custom_open TEXT,
  custom_close TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_meeting_bookings (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id VARCHAR NOT NULL,
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT,
  meeting_date TEXT NOT NULL,
  meeting_start_time TEXT NOT NULL,
  meeting_duration_minutes INTEGER NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'confirmed',
  google_calendar_event_id TEXT,
  pipeline_contact_id VARCHAR,
  cancel_token TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
