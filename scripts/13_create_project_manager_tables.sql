-- Create Project Manager users table
CREATE TABLE IF NOT EXISTS project_managers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES admin_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Create PM to Project assignments table
CREATE TABLE IF NOT EXISTS pm_project_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pm_id UUID NOT NULL REFERENCES project_managers(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  assigned_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID NOT NULL REFERENCES admin_users(id),
  UNIQUE(pm_id, project_id)
);

-- Create PM sessions table (similar to admin_sessions and staff_sessions)
CREATE TABLE IF NOT EXISTS pm_sessions (
  session_token TEXT PRIMARY KEY,
  pm_id UUID NOT NULL REFERENCES project_managers(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  expires_at BIGINT NOT NULL
);

-- Create PM audit log table
CREATE TABLE IF NOT EXISTS pm_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pm_id UUID NOT NULL REFERENCES project_managers(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- login, logout, view_records, export_report, etc.
  resource_type TEXT, -- entries, reports, etc.
  resource_id UUID,
  project_id UUID REFERENCES projects(id),
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on PM tables
ALTER TABLE project_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_project_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_pm_username ON project_managers(username);
CREATE INDEX idx_pm_is_active ON project_managers(is_active);
CREATE INDEX idx_pm_project_assignments_pm_id ON pm_project_assignments(pm_id);
CREATE INDEX idx_pm_project_assignments_project_id ON pm_project_assignments(project_id);
CREATE INDEX idx_pm_sessions_pm_id ON pm_sessions(pm_id);
CREATE INDEX idx_pm_sessions_expires_at ON pm_sessions(expires_at);
CREATE INDEX idx_pm_audit_logs_pm_id ON pm_audit_logs(pm_id);
CREATE INDEX idx_pm_audit_logs_created_at ON pm_audit_logs(created_at);

-- RLS Policies for project_managers table
CREATE POLICY "Service role has full access to project_managers"
  ON project_managers
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can view all PMs"
  ON project_managers
  FOR SELECT
  USING (true);

-- RLS Policies for pm_project_assignments table
CREATE POLICY "Service role has full access to pm_project_assignments"
  ON pm_project_assignments
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can manage PM assignments"
  ON pm_project_assignments
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for pm_sessions table
CREATE POLICY "Service role has full access to pm_sessions"
  ON pm_sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for pm_audit_logs table
CREATE POLICY "Service role has full access to pm_audit_logs"
  ON pm_audit_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can view PM audit logs"
  ON pm_audit_logs
  FOR SELECT
  USING (true);

-- Comment on tables for documentation
COMMENT ON TABLE project_managers IS 'Project Manager user accounts with role-based access';
COMMENT ON TABLE pm_project_assignments IS 'Maps Project Managers to their assigned projects';
COMMENT ON TABLE pm_sessions IS 'Active PM login sessions';
COMMENT ON TABLE pm_audit_logs IS 'Audit trail for PM actions';
