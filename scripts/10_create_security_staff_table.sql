-- Create a dedicated table for security staff authentication
-- This avoids conflicts with the profiles table constraints

CREATE TABLE IF NOT EXISTS security_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_security_staff_file_id ON security_staff(file_id);

-- Insert the 6 security staff members with their names as passwords (hashed)
-- Password for each is their name: Mohus, Umair, Salman, Tanweer, Tilak, Ramesh
INSERT INTO security_staff (file_id, full_name, password_hash) VALUES
  ('3252', 'Mohus', encode(digest('Mohus', 'sha256'), 'hex')),
  ('3242', 'Umair', encode(digest('Umair', 'sha256'), 'hex')),
  ('3253', 'Salman', encode(digest('Salman', 'sha256'), 'hex')),
  ('2234', 'Tanweer', encode(digest('Tanweer', 'sha256'), 'hex')),
  ('3245', 'Tilak', encode(digest('Tilak', 'sha256'), 'hex')),
  ('3248', 'Ramesh', encode(digest('Ramesh', 'sha256'), 'hex'))
ON CONFLICT (file_id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  password_hash = EXCLUDED.password_hash,
  updated_at = NOW();

-- Enable RLS (Row Level Security)
ALTER TABLE security_staff ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role full access
CREATE POLICY "Service role has full access to security_staff"
  ON security_staff
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create policy to allow authenticated users to read their own record
CREATE POLICY "Users can read their own security_staff record"
  ON security_staff
  FOR SELECT
  TO authenticated
  USING (true);
