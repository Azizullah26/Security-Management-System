-- Enable Row Level Security on entries table
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin can view all entries" ON public.entries;
DROP POLICY IF EXISTS "Staff can view their own entries" ON public.entries;
DROP POLICY IF EXISTS "Anyone can insert entries" ON public.entries;
DROP POLICY IF EXISTS "Staff can update their own entries" ON public.entries;
DROP POLICY IF EXISTS "Admin can update all entries" ON public.entries;

-- Policy 1: Admin can view all entries
CREATE POLICY "Admin can view all entries"
ON public.entries
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.role = 'admin'
    AND profiles.file_id = current_setting('app.current_user_id', true)
  )
);

-- Policy 2: Staff can view only their own entries (entries they created)
CREATE POLICY "Staff can view their own entries"
ON public.entries
FOR SELECT
USING (
  created_by IN (
    SELECT full_name FROM public.profiles
    WHERE profiles.file_id = current_setting('app.current_user_id', true)
    AND profiles.role = 'staff'
  )
);

-- Policy 3: Anyone can insert entries (for public check-in)
CREATE POLICY "Anyone can insert entries"
ON public.entries
FOR INSERT
WITH CHECK (true);

-- Policy 4: Staff can update their own entries
CREATE POLICY "Staff can update their own entries"
ON public.entries
FOR UPDATE
USING (
  created_by IN (
    SELECT full_name FROM public.profiles
    WHERE profiles.file_id = current_setting('app.current_user_id', true)
    AND profiles.role = 'staff'
  )
);

-- Policy 5: Admin can update all entries
CREATE POLICY "Admin can update all entries"
ON public.entries
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.role = 'admin'
    AND profiles.file_id = current_setting('app.current_user_id', true)
  )
);

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read profiles (needed for authentication)
DROP POLICY IF EXISTS "Anyone can read profiles" ON public.profiles;
CREATE POLICY "Anyone can read profiles"
ON public.profiles
FOR SELECT
USING (true);

-- Enable RLS on sites table
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read sites
DROP POLICY IF EXISTS "Anyone can read sites" ON public.sites;
CREATE POLICY "Anyone can read sites"
ON public.sites
FOR SELECT
USING (true);

COMMENT ON POLICY "Admin can view all entries" ON public.entries IS 'Allows admin to view all entries regardless of who created them';
COMMENT ON POLICY "Staff can view their own entries" ON public.entries IS 'Allows staff to view only entries they created';
COMMENT ON POLICY "Anyone can insert entries" ON public.entries IS 'Allows public check-in without authentication';
