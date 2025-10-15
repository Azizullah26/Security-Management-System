-- Insert or update the admin user
INSERT INTO public.profiles (file_id, full_name, role, email)
VALUES ('ADMIN', 'Administrator', 'admin', 'admin@security.com')
ON CONFLICT (file_id) 
DO UPDATE SET 
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  email = EXCLUDED.email,
  updated_at = NOW();

-- Insert or update the 6 security staff members and assign them to sites
WITH site_assignments AS (
  SELECT 
    '3252' as file_id, 'Mohus' as name, 'mohus@security.com' as email, 'Site A' as site_name
  UNION ALL SELECT '3242', 'Umair', 'umair@security.com', 'Site B'
  UNION ALL SELECT '3253', 'Salman', 'salman@security.com', 'Site C'
  UNION ALL SELECT '2234', 'Tanweer', 'tanweer@security.com', 'Site D'
  UNION ALL SELECT '3245', 'Tilak', 'tilak@security.com', 'Site E'
  UNION ALL SELECT '3248', 'Ramesh', 'ramesh@security.com', 'Site F'
)
INSERT INTO public.profiles (file_id, full_name, role, email, site_id)
SELECT 
  sa.file_id,
  sa.name,
  'staff',
  sa.email,
  s.id
FROM site_assignments sa
JOIN public.sites s ON s.name = sa.site_name
ON CONFLICT (file_id) 
DO UPDATE SET 
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  email = EXCLUDED.email,
  site_id = EXCLUDED.site_id,
  updated_at = NOW();

-- Verify the setup
SELECT 
  p.file_id,
  p.full_name,
  p.role,
  s.name as site_name,
  s.location
FROM public.profiles p
LEFT JOIN public.sites s ON p.site_id = s.id
ORDER BY p.role DESC, p.file_id;
