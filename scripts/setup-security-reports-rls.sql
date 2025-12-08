-- Add RLS policies for security reports table to allow service role access
-- Drop existing policies if any
DROP POLICY IF EXISTS "Service role has full access" ON securityreport;
DROP POLICY IF EXISTS "Admins can view security reports" ON securityreport;
DROP POLICY IF EXISTS "Staff can insert security reports" ON securityreport;

-- Allow service role full access (bypasses RLS)
CREATE POLICY "Service role has full access"
ON securityreport
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow authenticated users to insert reports
CREATE POLICY "Staff can insert security reports"
ON securityreport
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to read reports
CREATE POLICY "Admins can view security reports"
ON securityreport
FOR SELECT
TO authenticated
USING (true);
