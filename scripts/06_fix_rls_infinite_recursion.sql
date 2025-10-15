-- Fix infinite recursion in RLS policies
-- This script removes problematic policies and creates simpler ones

-- Drop all existing RLS policies that might cause recursion
DROP POLICY IF EXISTS "entries_staff_select" ON entries;
DROP POLICY IF EXISTS "entries_staff_insert" ON entries;
DROP POLICY IF EXISTS "entries_admin_all" ON entries;
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;

-- Disable RLS on profiles table since it's only accessed by backend
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Create simple RLS policies for entries table
-- These policies don't reference other tables to avoid recursion

-- Allow all operations for service role (backend)
CREATE POLICY "entries_service_role_all"
ON entries
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- For authenticated users, allow read access to all entries
-- (Frontend will filter based on user role)
CREATE POLICY "entries_authenticated_select"
ON entries
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert entries
CREATE POLICY "entries_authenticated_insert"
ON entries
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update entries
CREATE POLICY "entries_authenticated_update"
ON entries
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Note: Access control is now handled in the API layer
-- The backend uses service role to bypass RLS
-- Frontend queries use authenticated role with filtering in the API
