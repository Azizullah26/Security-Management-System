-- Drop the old table if it exists (to recreate with correct schema)
DROP TABLE IF EXISTS staff_sessions;

-- Create staff_sessions table for persistent session storage
CREATE TABLE staff_sessions (
  session_token TEXT PRIMARY KEY,
  staff_id TEXT NOT NULL,
  name TEXT NOT NULL,
  assigned_project TEXT,
  created_at BIGINT NOT NULL,
  expires_at BIGINT NOT NULL
);

-- Create index for faster lookups by staff_id
CREATE INDEX idx_staff_sessions_staff_id ON staff_sessions(staff_id);

-- Create index for faster cleanup of expired sessions
CREATE INDEX idx_staff_sessions_expires_at ON staff_sessions(expires_at);
