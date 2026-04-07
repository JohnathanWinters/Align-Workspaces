CREATE TABLE IF NOT EXISTS host_insurance_records (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  carrier_name TEXT NOT NULL,
  policy_number TEXT NOT NULL,
  coverage_type TEXT NOT NULL,
  coverage_amount INTEGER NOT NULL,
  policy_expiration_date TEXT NOT NULL,
  document_url TEXT NOT NULL,
  document_filename TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  verified_at TIMESTAMP,
  suspended_at TIMESTAMP,
  reminder_sent_30_day INTEGER DEFAULT 0,
  reminder_sent_7_day INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
