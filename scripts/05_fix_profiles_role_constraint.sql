-- Fix the profiles table role constraint to allow 'admin' and 'staff' roles
-- This script drops the existing constraint and creates a new one with the correct values

-- Drop the existing check constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add a new check constraint that allows 'admin' and 'staff' roles
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('admin', 'staff', 'security_staff'));

-- Add a comment to document the allowed roles
COMMENT ON COLUMN profiles.role IS 'User role: admin, staff, or security_staff';

-- Verify the constraint was created successfully
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'profiles'::regclass
  AND conname = 'profiles_role_check';
