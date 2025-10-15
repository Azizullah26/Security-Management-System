-- Add created_by column to entries table to track which staff member added the record
ALTER TABLE entries ADD COLUMN IF NOT EXISTS created_by VARCHAR(50);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_entries_created_by ON entries(created_by);

-- Add index for created_at for faster date filtering
CREATE INDEX IF NOT EXISTS idx_entries_created_at ON entries(created_at);
