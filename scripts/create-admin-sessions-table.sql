-- Create admin_sessions table for persistent session storage
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_accessed TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on token for fast lookups
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token);

-- Create index on expires_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);

-- Enable Row Level Security
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role full access
CREATE POLICY "Service role can manage admin sessions"
  ON admin_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
