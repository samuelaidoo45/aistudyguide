-- Add concepts field to study_sessions table
ALTER TABLE study_sessions ADD COLUMN IF NOT EXISTS concepts TEXT[] DEFAULT '{}'::TEXT[]; 