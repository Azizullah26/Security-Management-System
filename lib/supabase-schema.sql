-- Create entries table for visitor/staff/contractor entries
CREATE TABLE IF NOT EXISTS entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  file_id VARCHAR(50),
  company VARCHAR(255),
  phone VARCHAR(50),
  vehicle_no VARCHAR(50),
  items TEXT,
  purpose TEXT,
  host VARCHAR(255),
  photo TEXT,
  entry_time TIMESTAMPTZ NOT NULL,
  exit_time TIMESTAMPTZ,
  duration VARCHAR(50),
  project_name VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create assignments table for staff-project assignments
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id VARCHAR(50) NOT NULL UNIQUE,
  project_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create projects table for all projects
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(500) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  priority VARCHAR(50) DEFAULT 'medium',
  start_date DATE,
  assigned_to VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_entries_category ON entries(category);
CREATE INDEX IF NOT EXISTS idx_entries_file_id ON entries(file_id);
CREATE INDEX IF NOT EXISTS idx_entries_project_name ON entries(project_name);
CREATE INDEX IF NOT EXISTS idx_entries_entry_time ON entries(entry_time);
CREATE INDEX IF NOT EXISTS idx_assignments_staff_id ON assignments(staff_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name);

-- Enable Row Level Security (RLS)
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for production)
CREATE POLICY "Enable read access for all users" ON entries FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON entries FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON entries FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON assignments FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON assignments FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON assignments FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON assignments FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON projects FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON projects FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON projects FOR DELETE USING (true);
