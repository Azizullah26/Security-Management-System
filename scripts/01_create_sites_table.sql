-- Create sites table to store site information
CREATE TABLE IF NOT EXISTS public.sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  location TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sites_name ON public.sites(name);

-- Insert the 6 sites for the 6 security staff members
INSERT INTO public.sites (name, location, description) VALUES
  ('Site A', 'Location A', 'Assigned to Mohus (3252)'),
  ('Site B', 'Location B', 'Assigned to Umair (3242)'),
  ('Site C', 'Location C', 'Assigned to Salman (3253)'),
  ('Site D', 'Location D', 'Assigned to Tanweer (2234)'),
  ('Site E', 'Location E', 'Assigned to Tilak (3245)'),
  ('Site F', 'Location F', 'Assigned to Ramesh (3248)')
ON CONFLICT (name) DO NOTHING;

-- Add site_id column to profiles table to link users to sites
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES public.sites(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_site_id ON public.profiles(site_id);

-- Add site_name column to entries table for easier querying
ALTER TABLE public.entries 
ADD COLUMN IF NOT EXISTS site_name TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_entries_site_name ON public.entries(site_name);
CREATE INDEX IF NOT EXISTS idx_entries_created_by ON public.entries(created_by);

COMMENT ON TABLE public.sites IS 'Stores site information for security staff assignments';
COMMENT ON COLUMN public.profiles.site_id IS 'Links user to their assigned site';
COMMENT ON COLUMN public.entries.site_name IS 'Site where the entry was recorded';
