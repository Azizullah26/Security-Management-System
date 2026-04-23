-- Add project_name column to pm_project_assignments table to store project names directly
-- This allows PMs to be assigned to projects by name, matching the entries table structure

ALTER TABLE pm_project_assignments
ADD COLUMN project_name VARCHAR(255);

-- Create index on project_name for better query performance
CREATE INDEX idx_pm_project_assignments_project_name 
ON pm_project_assignments(pm_id, project_name);

-- Update any existing records that have project_id to also populate project_name
-- (if needed in the future when migrating data)

COMMENT ON COLUMN pm_project_assignments.project_name IS 'Name of the project assigned to the PM (matches project_name in assignments and entries tables)';
