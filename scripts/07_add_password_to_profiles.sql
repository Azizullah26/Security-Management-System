-- Add password_hash column to profiles table for authentication
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Add index on file_id for faster authentication lookups
CREATE INDEX IF NOT EXISTS idx_profiles_file_id ON profiles(file_id);

-- Add index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
