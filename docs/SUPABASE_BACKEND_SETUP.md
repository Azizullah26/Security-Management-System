# Supabase Backend Setup Documentation

## Overview

This document describes the complete Supabase backend setup for the Security Management System, including database schema, Row Level Security (RLS) policies, and sample queries.

## Database Schema

### 1. Users (profiles table)
Stores information about admin and security staff members.

**Columns:**
- `id` (UUID): Primary key
- `file_id` (TEXT): Unique identifier (e.g., "3242" for Umair, "ADMIN" for admin)
- `full_name` (TEXT): User's full name
- `role` (TEXT): Either "admin" or "staff"
- `email` (TEXT): User's email address
- `site_id` (UUID): Foreign key to sites table (for staff members)
- `created_at` (TIMESTAMPTZ): Record creation timestamp
- `updated_at` (TIMESTAMPTZ): Record update timestamp

**Users:**
- 1 Admin: file_id = "ADMIN"
- 6 Security Staff:
  - Mohus (3252) → Site A
  - Umair (3242) → Site B
  - Salman (3253) → Site C
  - Tanweer (2234) → Site D
  - Tilak (3245) → Site E
  - Ramesh (3248) → Site F

### 2. Sites (sites table)
Stores site information where security staff are assigned.

**Columns:**
- `id` (UUID): Primary key
- `name` (TEXT): Site name (unique)
- `location` (TEXT): Site location
- `description` (TEXT): Site description
- `created_at` (TIMESTAMPTZ): Record creation timestamp
- `updated_at` (TIMESTAMPTZ): Record update timestamp

**Sites:**
- Site A, Site B, Site C, Site D, Site E, Site F

### 3. Entries (entries table)
Stores visitor and staff entry/exit records.

**Key Columns:**
- `id` (UUID): Primary key
- `category` (VARCHAR): Entry type (staff, visitors, clients, suppliers, subcontractors)
- `name` (VARCHAR): Person's name
- `file_id` (VARCHAR): Person's file/ID number
- `company` (VARCHAR): Company name
- `phone` (VARCHAR): Phone number
- `vehicle_number` (TEXT): Vehicle registration
- `purpose` (TEXT): Visit purpose
- `host` (VARCHAR): Person being visited
- `entry_time` (TIMESTAMPTZ): Check-in time
- `exit_time` (TIMESTAMPTZ): Check-out time
- `status` (TEXT): "inside" or "checked_out"
- `created_by` (VARCHAR): Staff member who created the entry
- `site_name` (TEXT): Site where entry was created
- `photo` (TEXT): Photo URL
- `created_at` (TIMESTAMPTZ): Record creation timestamp

## Row Level Security (RLS) Policies

### Entries Table Policies

1. **Admin can view all entries**
   - Allows admin to view all entries regardless of who created them
   - Uses `app.current_user_id` setting to identify admin

2. **Staff can view their own entries**
   - Allows staff to view only entries they created
   - Filters by `created_by` matching staff member's name

3. **Anyone can insert entries**
   - Allows public check-in without authentication
   - Enables visitors to check in at the gate

4. **Staff can update their own entries**
   - Allows staff to update entries they created
   - Used for checkout operations

5. **Admin can update all entries**
   - Allows admin to update any entry
   - Full administrative control

### Profiles Table Policies

- **Anyone can read profiles**: Needed for authentication and user lookup

### Sites Table Policies

- **Anyone can read sites**: Needed for displaying site information

## Setup Instructions

### Step 1: Create Sites Table
Run the SQL script to create the sites table and link it to profiles:

\`\`\`bash
# Execute in Supabase SQL Editor or via API
scripts/01_create_sites_table.sql
\`\`\`

### Step 2: Setup Users and Site Assignments
Run the SQL script to insert admin and staff users with site assignments:

\`\`\`bash
scripts/02_setup_users_and_sites.sql
\`\`\`

### Step 3: Setup RLS Policies
Run the SQL script to enable RLS and create security policies:

\`\`\`bash
scripts/03_setup_rls_policies.sql
\`\`\`

### Step 4: Test with Sample Queries
Use the sample queries to verify the setup:

\`\`\`bash
scripts/04_sample_queries.sql
\`\`\`

## Usage Examples

### For Security Staff (e.g., Umair - 3242)

**Fetch today's entries:**
\`\`\`sql
SELECT set_config('app.current_user_id', '3242', false);

SELECT * FROM public.entries
WHERE created_by = (SELECT full_name FROM public.profiles WHERE file_id = '3242')
AND DATE(created_at) = CURRENT_DATE;
\`\`\`

**Create new entry:**
\`\`\`sql
INSERT INTO public.entries (category, name, company, created_by, site_name, ...)
VALUES ('visitors', 'John Doe', 'ABC Corp', 'Umair', 'Site B', ...);
\`\`\`

### For Admin

**Fetch all entries with site info:**
\`\`\`sql
SELECT set_config('app.current_user_id', 'ADMIN', false);

SELECT e.*, p.file_id as staff_id, s.location
FROM public.entries e
LEFT JOIN public.profiles p ON e.created_by = p.full_name
LEFT JOIN public.sites s ON e.site_name = s.name;
\`\`\`

**Get statistics by site:**
\`\`\`sql
SELECT site_name, COUNT(*) as total, 
       COUNT(CASE WHEN status = 'inside' THEN 1 END) as inside
FROM public.entries
GROUP BY site_name;
\`\`\`

## Security Considerations

1. **RLS Enforcement**: All queries must set `app.current_user_id` to enforce RLS policies
2. **Public Insert**: Entry creation is public to allow gate check-ins
3. **Staff Isolation**: Staff can only see their own entries
4. **Admin Override**: Admin has full access to all data

## Integration with Application

The application code should:

1. Set the user context before queries:
\`\`\`typescript
await supabase.rpc('set_config', {
  setting: 'app.current_user_id',
  value: staffFileId,
  is_local: false
})
\`\`\`

2. Use the Supabase client with proper authentication
3. Handle RLS policy violations gracefully
4. Log all data access for audit purposes

## Maintenance

- Regularly review RLS policies for security
- Monitor query performance and add indexes as needed
- Backup database regularly
- Update site assignments as staff changes occur
