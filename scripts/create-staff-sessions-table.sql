-- Create staff_sessions table for persistent session storage
CREATE TABLE IF NOT EXISTS staff_sessions (
  session_token TEXT PRIMARY KEY,
  staff_id TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  expires_at BIGINT NOT NULL
);

-- Create index for faster lookups by staff_id
CREATE INDEX IF NOT EXISTS idx_staff_sessions_staff_id ON staff_sessions(staff_id);

-- Create index for faster cleanup of expired sessions
CREATE INDEX IF NOT EXISTS idx_staff_sessions_expires_at ON staff_sessions(expires_at);
