-- Extend security_staff table to support full staff management
-- Add columns for email, phone, position, department, status, hire date, and assigned projects

ALTER TABLE security_staff
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS position TEXT DEFAULT 'Security Guard',
ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'Security',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active',
ADD COLUMN IF NOT EXISTS hire_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS assigned_projects JSONB DEFAULT '[]'::jsonb;

-- Add unique constraint on email if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'security_staff_email_key'
  ) THEN
    ALTER TABLE security_staff ADD CONSTRAINT security_staff_email_key UNIQUE (email);
  END IF;
END $$;

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_security_staff_email ON security_staff(email);

-- Update existing records with default email addresses
UPDATE security_staff 
SET 
  email = LOWER(full_name) || '@security.com',
  phone = '+971-50-' || LPAD((RANDOM() * 999999)::INT::TEXT, 6, '0'),
  position = 'Security Guard',
  department = 'Security',
  status = 'Active',
  hire_date = CURRENT_DATE - (RANDOM() * 365)::INT,
  assigned_projects = '[]'::jsonb
WHERE email IS NULL;

-- Update the RLS policies to allow service role to manage all staff data
DROP POLICY IF EXISTS "Service role has full access to security_staff" ON security_staff;
CREATE POLICY "Service role has full access to security_staff"
  ON security_staff
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
