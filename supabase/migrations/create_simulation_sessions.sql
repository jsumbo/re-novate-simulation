-- Create simulation_sessions table for tracking user simulation progress
-- This table extends the existing sessions table concept specifically for simulation management

CREATE TABLE simulation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'completed', 'paused')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  current_round INTEGER DEFAULT 1,
  total_rounds INTEGER DEFAULT 5,
  scenario_id UUID REFERENCES scenarios(id),
  session_data JSONB DEFAULT '{}', -- Store additional session-specific data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX idx_simulation_sessions_user_id ON simulation_sessions(user_id);
CREATE INDEX idx_simulation_sessions_user_status ON simulation_sessions(user_id, status);
CREATE INDEX idx_simulation_sessions_status ON simulation_sessions(status);
CREATE INDEX idx_simulation_sessions_created_at ON simulation_sessions(created_at DESC);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_simulation_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_simulation_sessions_updated_at
  BEFORE UPDATE ON simulation_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_simulation_sessions_updated_at();

-- Enable Row Level Security
ALTER TABLE simulation_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Students can only access their own simulation sessions
CREATE POLICY "Students can view their own simulation sessions"
  ON simulation_sessions FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Students can insert their own simulation sessions"
  ON simulation_sessions FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Students can update their own simulation sessions"
  ON simulation_sessions FOR UPDATE
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

-- Teachers can view simulation sessions for students in their school
CREATE POLICY "Teachers can view school simulation sessions"
  ON simulation_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users teacher_user
      WHERE teacher_user.id::text = auth.uid()::text
        AND teacher_user.role = 'teacher'
        AND teacher_user.school_id = (
          SELECT school_id FROM users student_user
          WHERE student_user.id = simulation_sessions.user_id
        )
    )
  );

-- Service role bypass (for server-side operations)
CREATE POLICY "Service role can manage all simulation sessions"
  ON simulation_sessions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Create database functions for querying simulation sessions

-- Function to get user simulations by status
CREATE OR REPLACE FUNCTION get_user_simulations_by_status(
  p_user_id UUID,
  p_status TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  title VARCHAR(255),
  description TEXT,
  status VARCHAR(20),
  progress INTEGER,
  current_round INTEGER,
  total_rounds INTEGER,
  scenario_id UUID,
  session_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ss.id,
    ss.user_id,
    ss.title,
    ss.description,
    ss.status,
    ss.progress,
    ss.current_round,
    ss.total_rounds,
    ss.scenario_id,
    ss.session_data,
    ss.created_at,
    ss.updated_at
  FROM simulation_sessions ss
  WHERE ss.user_id = p_user_id
    AND (p_status IS NULL OR ss.status = p_status)
  ORDER BY ss.updated_at DESC, ss.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get simulation progress summary for a user
CREATE OR REPLACE FUNCTION get_user_simulation_summary(p_user_id UUID)
RETURNS TABLE (
  total_simulations INTEGER,
  completed_simulations INTEGER,
  ongoing_simulations INTEGER,
  average_progress DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_simulations,
    COUNT(CASE WHEN status = 'completed' THEN 1 END)::INTEGER as completed_simulations,
    COUNT(CASE WHEN status = 'ongoing' THEN 1 END)::INTEGER as ongoing_simulations,
    COALESCE(AVG(progress), 0)::DECIMAL(5,2) as average_progress
  FROM simulation_sessions
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update simulation progress
CREATE OR REPLACE FUNCTION update_simulation_progress(
  p_simulation_id UUID,
  p_progress INTEGER,
  p_current_round INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_total_rounds INTEGER;
  v_new_status VARCHAR(20);
BEGIN
  -- Get total rounds for the simulation
  SELECT total_rounds INTO v_total_rounds
  FROM simulation_sessions
  WHERE id = p_simulation_id;
  
  -- Determine new status based on progress
  IF p_progress >= 100 THEN
    v_new_status := 'completed';
  ELSE
    v_new_status := 'ongoing';
  END IF;
  
  -- Update the simulation session
  UPDATE simulation_sessions
  SET 
    progress = p_progress,
    current_round = COALESCE(p_current_round, current_round),
    status = v_new_status,
    updated_at = NOW()
  WHERE id = p_simulation_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_user_simulations_by_status(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_simulation_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_simulation_progress(UUID, INTEGER, INTEGER) TO authenticated;