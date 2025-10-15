-- Insert the 6 security staff members into the profiles table
-- Note: Passwords will be hashed by the application before insertion

-- First, delete any existing security staff to avoid duplicates
DELETE FROM profiles WHERE file_id IN ('3252', '3242', '3253', '2234', '3245', '3248');

-- Insert security staff members
-- The password_hash will be set by running the /api/setup-staff-passwords endpoint
INSERT INTO profiles (id, file_id, full_name, email, role, created_at, updated_at)
VALUES
  (gen_random_uuid(), '3252', 'Mohus', 'mohus@security.com', 'staff', NOW(), NOW()),
  (gen_random_uuid(), '3242', 'Umair', 'umair@security.com', 'staff', NOW(), NOW()),
  (gen_random_uuid(), '3253', 'Salman', 'salman@security.com', 'staff', NOW(), NOW()),
  (gen_random_uuid(), '2234', 'Tanweer', 'tanweer@security.com', 'staff', NOW(), NOW()),
  (gen_random_uuid(), '3245', 'Tilak', 'tilak@security.com', 'staff', NOW(), NOW()),
  (gen_random_uuid(), '3248', 'Ramesh', 'ramesh@security.com', 'staff', NOW(), NOW())
ON CONFLICT (file_id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  updated_at = NOW();
