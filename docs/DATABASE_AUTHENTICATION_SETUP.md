# Database Authentication Setup

This document explains how to set up database-based authentication for security staff members.

## Overview

The system now stores staff credentials in the Supabase `profiles` table instead of environment variables. Passwords are hashed using SHA-256 before storage for security.

## Setup Steps

### 1. Add Password Column to Profiles Table

Run the SQL script to add the `password_hash` column:

\`\`\`bash
# Execute script 07
scripts/07_add_password_to_profiles.sql
\`\`\`

### 2. Insert Security Staff Members

Run the SQL script to insert the 6 security staff members:

\`\`\`bash
# Execute script 08
scripts/08_insert_security_staff.sql
\`\`\`

This creates profiles for:
- File ID 3252 - Mohus
- File ID 3242 - Umair
- File ID 3253 - Salman
- File ID 2234 - Tanweer
- File ID 3245 - Tilak
- File ID 3248 - Ramesh

### 3. Hash and Store Passwords

Call the setup endpoint to hash passwords from environment variables and store them in the database:

\`\`\`bash
POST /api/setup-staff-passwords
\`\`\`

This endpoint:
- Reads passwords from environment variables (STAFF_3252_PASSWORD, etc.)
- Hashes each password using SHA-256
- Stores the hashed passwords in the `profiles` table

**Important:** This endpoint should only be called once during initial setup.

### 4. Verify Authentication

After setup, staff members can log in using:
- **File ID**: Their employee file ID (e.g., 3252)
- **Password**: Their assigned password

The system will:
1. Look up the staff member in the database by file_id
2. Verify the password against the stored hash
3. Create a session token if authentication succeeds
4. Store the session and return it to the client

## Security Features

- **Password Hashing**: All passwords are hashed using SHA-256 before storage
- **Timing-Safe Comparison**: Password verification uses timing-safe comparison to prevent timing attacks
- **Rate Limiting**: Failed login attempts are rate-limited (5 attempts per 5 minutes)
- **Session Management**: Sessions expire after 8 hours (one work shift)
- **No Plain Text**: Passwords are never stored in plain text

## Database Schema

The `profiles` table includes:
- `id`: UUID primary key
- `file_id`: Staff member's file ID (used for login)
- `full_name`: Staff member's full name
- `email`: Staff member's email
- `role`: User role (should be 'staff' for security guards)
- `password_hash`: SHA-256 hash of the password
- `site_id`: UUID reference to assigned site
- `created_at`: Timestamp when profile was created
- `updated_at`: Timestamp when profile was last updated

## Maintenance

### Adding New Staff Members

1. Insert new profile record in the database
2. Set the password using the setup endpoint or manually hash and insert

### Changing Passwords

1. Update the environment variable for the staff member
2. Call the setup endpoint to re-hash and store the new password

### Removing Staff Members

1. Delete the profile record from the database
2. Any active sessions will remain valid until they expire
