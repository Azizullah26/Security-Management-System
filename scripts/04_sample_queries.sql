-- Sample Queries for Common Operations

-- ============================================
-- 1. STAFF: Fetch their own entries for today
-- ============================================
-- Set the current user context (replace '3242' with actual staff file_id)
SELECT set_config('app.current_user_id', '3242', false);

-- Query entries created by this staff member today
SELECT 
  e.id,
  e.name,
  e.file_id,
  e.company,
  e.phone,
  e.category,
  e.entry_time,
  e.exit_time,
  e.status,
  e.created_by,
  e.site_name
FROM public.entries e
WHERE e.created_by = (
  SELECT full_name FROM public.profiles WHERE file_id = '3242'
)
AND DATE(e.created_at) = CURRENT_DATE
ORDER BY e.entry_time DESC;

-- ============================================
-- 2. ADMIN: Fetch all entries with site and staff info
-- ============================================
-- Set the current user context for admin
SELECT set_config('app.current_user_id', 'ADMIN', false);

-- Query all entries with related information
SELECT 
  e.id,
  e.name as visitor_name,
  e.file_id,
  e.company,
  e.phone,
  e.category,
  e.entry_time,
  e.exit_time,
  e.status,
  e.created_by as staff_name,
  e.site_name,
  p.file_id as staff_file_id,
  s.location as site_location
FROM public.entries e
LEFT JOIN public.profiles p ON e.created_by = p.full_name
LEFT JOIN public.sites s ON e.site_name = s.name
ORDER BY e.entry_time DESC
LIMIT 100;

-- ============================================
-- 3. ADMIN: Get summary statistics by site
-- ============================================
SELECT 
  e.site_name,
  COUNT(*) as total_entries,
  COUNT(CASE WHEN e.status = 'inside' THEN 1 END) as currently_inside,
  COUNT(CASE WHEN e.status = 'checked_out' THEN 1 END) as checked_out,
  COUNT(CASE WHEN DATE(e.created_at) = CURRENT_DATE THEN 1 END) as today_entries
FROM public.entries e
WHERE e.site_name IS NOT NULL
GROUP BY e.site_name
ORDER BY total_entries DESC;

-- ============================================
-- 4. ADMIN: Get summary statistics by staff member
-- ============================================
SELECT 
  p.full_name as staff_name,
  p.file_id as staff_id,
  s.name as assigned_site,
  COUNT(e.id) as total_entries_created,
  COUNT(CASE WHEN DATE(e.created_at) = CURRENT_DATE THEN 1 END) as today_entries
FROM public.profiles p
LEFT JOIN public.sites s ON p.site_id = s.id
LEFT JOIN public.entries e ON e.created_by = p.full_name
WHERE p.role = 'staff'
GROUP BY p.full_name, p.file_id, s.name
ORDER BY total_entries_created DESC;

-- ============================================
-- 5. CREATE NEW ENTRY with validation
-- ============================================
-- Example: Staff member Umair (3242) creates a new visitor entry at Site B
INSERT INTO public.entries (
  category,
  name,
  file_id,
  company,
  phone,
  vehicle_number,
  purpose,
  host,
  entry_time,
  status,
  created_by,
  site_name,
  created_at
) VALUES (
  'visitors',
  'John Doe',
  'V001',
  'ABC Company',
  '+971501234567',
  'DXB-12345',
  'Business Meeting',
  'Manager Name',
  NOW(),
  'inside',
  'Umair',  -- Staff member who created this entry
  'Site B', -- Site where entry was created
  NOW()
)
RETURNING id, name, entry_time, created_by, site_name;

-- ============================================
-- 6. UPDATE ENTRY: Check out a visitor
-- ============================================
UPDATE public.entries
SET 
  exit_time = NOW(),
  status = 'checked_out',
  duration = EXTRACT(EPOCH FROM (NOW() - entry_time))::TEXT || ' seconds'
WHERE id = 'entry-id-here'
AND status = 'inside'
RETURNING id, name, entry_time, exit_time, duration;

-- ============================================
-- 7. STAFF: Get today's entries count
-- ============================================
SELECT 
  COUNT(*) as entries_today,
  COUNT(CASE WHEN status = 'inside' THEN 1 END) as currently_inside,
  COUNT(CASE WHEN status = 'checked_out' THEN 1 END) as checked_out
FROM public.entries
WHERE created_by = (
  SELECT full_name FROM public.profiles WHERE file_id = '3242'
)
AND DATE(created_at) = CURRENT_DATE;
