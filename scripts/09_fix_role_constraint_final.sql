-- Drop the existing check constraint on the role column
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add a new check constraint that allows 'admin', 'staff', and 'security_staff' roles
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('admin', 'staff', 'security_staff', 'user'));

-- Add a comment to document the allowed roles
COMMENT ON COLUMN profiles.role IS 'User role: admin, staff, security_staff, or user';
