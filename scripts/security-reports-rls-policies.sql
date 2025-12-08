-- Enable RLS on securityreport table (if not already enabled)
ALTER TABLE securityreport ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow service role full access to securityreport" ON securityreport;
DROP POLICY IF EXISTS "Allow authenticated users to read securityreport" ON securityreport;
DROP POLICY IF EXISTS "Allow authenticated users to insert securityreport" ON securityreport;
DROP POLICY IF EXISTS "Allow service role to delete securityreport" ON securityreport;

-- Policy 1: Service role has full access (for API routes using service key)
CREATE POLICY "Allow service role full access to securityreport"
ON securityreport
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy 2: Authenticated users can read all security reports
CREATE POLICY "Allow authenticated users to read securityreport"
ON securityreport
FOR SELECT
TO authenticated
USING (true);

-- Policy 3: Authenticated users can insert security reports
CREATE POLICY "Allow authenticated users to insert securityreport"
ON securityreport
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy 4: Only service role can delete (for admin operations)
CREATE POLICY "Allow service role to delete securityreport"
ON securityreport
FOR DELETE
TO service_role
USING (true);

-- Verify policies
SELECT * FROM pg_policies WHERE tablename = 'securityreport';
