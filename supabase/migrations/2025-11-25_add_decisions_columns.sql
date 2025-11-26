-- Ensure decisions table has required columns used by the app
-- Creates table if missing and adds columns if not present

CREATE TABLE IF NOT EXISTS decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  scenario_id UUID,
  user_id UUID NOT NULL,
  round_number INTEGER,
  selected_option TEXT,
  selected_option_id TEXT,
  ai_feedback TEXT,
  outcome_score INTEGER,
  skills_gained JSONB DEFAULT '{}',
  time_taken INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns defensively
ALTER TABLE decisions ADD COLUMN IF NOT EXISTS round_number INTEGER;
ALTER TABLE decisions ADD COLUMN IF NOT EXISTS selected_option TEXT;
ALTER TABLE decisions ADD COLUMN IF NOT EXISTS selected_option_id TEXT;
ALTER TABLE decisions ADD COLUMN IF NOT EXISTS ai_feedback TEXT;
ALTER TABLE decisions ADD COLUMN IF NOT EXISTS outcome_score INTEGER;
ALTER TABLE decisions ADD COLUMN IF NOT EXISTS skills_gained JSONB DEFAULT '{}';
ALTER TABLE decisions ADD COLUMN IF NOT EXISTS time_taken INTEGER;
ALTER TABLE decisions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
-- New columns used by text task submissions and non-UUID scenario keys
ALTER TABLE decisions ADD COLUMN IF NOT EXISTS task_response JSONB;
ALTER TABLE decisions ADD COLUMN IF NOT EXISTS scenario_key TEXT;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_decisions_user_id ON decisions(user_id);
CREATE INDEX IF NOT EXISTS idx_decisions_session_id ON decisions(session_id);
CREATE INDEX IF NOT EXISTS idx_decisions_created_at ON decisions(created_at DESC);

-- Enable RLS and basic policy for authenticated users managing own rows
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;

-- PostgreSQL doesn't support IF NOT EXISTS for policies; drop then recreate
DROP POLICY IF EXISTS "Users can manage their own decisions" ON decisions;

CREATE POLICY "Users can manage their own decisions"
  ON decisions FOR ALL
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);
