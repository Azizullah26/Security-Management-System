# Security Staff Password Reference

This document contains the default passwords for security staff members. 

**IMPORTANT SECURITY NOTES:**
- All passwords are hashed using SHA-256 before storage in the database
- Default passwords are set to the employee's File ID
- Staff members should change their password after first login
- Never share passwords via insecure channels

## Default Password Policy

When a new security staff member is added to the system:
- **Default Password**: Employee File ID (e.g., if File ID is "3252", password is "3252")
- **Password Storage**: SHA-256 hashed in `security_staff.password_hash` column
- **Password Change**: Staff should change password on first login (feature to be implemented)

## Current Staff Members

| File ID | Full Name | Position | Department | Default Password | Status |
|---------|-----------|----------|------------|------------------|--------|
| 3252 | Mohus | Security Guard | Security | 3252 | Active |
| 3242 | Umair | Security Guard | Security | 3242 | Active |
| 3253 | Salman | Security Guard | Security | 3253 | Active |
| 2234 | Tanweer | Security Guard | Security | 2234 | Active |
| 3245 | Tilak | Security Guard | Security | 3245 | Active |
| 3248 | Ramesh | Security Guard | Security | 3248 | Active |

## Database Schema

The `security_staff` table contains:
- `id` (uuid): Unique identifier
- `file_id` (text): Employee ID / File Number
- `full_name` (text): Staff member's full name
- `password_hash` (text): SHA-256 hashed password
- `position` (text): Job position
- `department_staff` (text): Department assignment
- `created_at` (timestamp): Account creation date
- `updated_at` (timestamp): Last update date

## Password Hashing

Passwords are hashed using the Web Crypto API:
\`\`\`typescript
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  return hashHex
}
\`\`\`

## Adding New Staff

When adding a new staff member through the admin interface:
1. Enter the staff member's name and File ID
2. Select position and department
3. System automatically generates password hash using File ID
4. Staff member can log in using their File ID as both username and password
5. Advise staff to change password after first login

## Security Best Practices

1. **Never store plain text passwords**
2. **Use strong, unique passwords** (not just File IDs for production)
3. **Implement password change functionality**
4. **Add password complexity requirements**
5. **Implement account lockout after failed attempts** (already implemented)
6. **Use HTTPS in production** (enforced by Vercel)
7. **Regular security audits**

## Future Enhancements

- [ ] Password change functionality
- [ ] Password complexity requirements
- [ ] Password expiration policy
- [ ] Two-factor authentication
- [ ] Password reset via email
- [ ] Audit log for password changes
