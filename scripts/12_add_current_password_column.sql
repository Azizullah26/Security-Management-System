-- Add a column to store the current password for admin viewing
-- This is separate from password_hash which is used for authentication
ALTER TABLE security_staff
ADD COLUMN IF NOT EXISTS current_password TEXT;

-- Update existing records to set current_password to their file_id (default password)
UPDATE security_staff
SET current_password = file_id
WHERE current_password IS NULL;

-- Add a comment explaining the column
COMMENT ON COLUMN security_staff.current_password IS 'Plain text password for admin viewing - kept in sync with password_hash';
