-- Add calendar sync and duration fields to shoots table
ALTER TABLE shoots ADD COLUMN IF NOT EXISTS duration_hours text DEFAULT '2';
ALTER TABLE shoots ADD COLUMN IF NOT EXISTS google_calendar_event_id text;
