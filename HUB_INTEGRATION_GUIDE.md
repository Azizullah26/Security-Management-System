# RCC Hub Integration Guide for Security System SSO

## Overview
This guide explains how the RCC Hub should integrate with the Security System to provide seamless Single Sign-On (SSO) access.

**IMPORTANT**: RCC Hub and Security System share the same Supabase database, which simplifies authentication significantly.

## Security System URLs
- **Production**: `https://elracesecurity.vercel.app`
- **Hub Production**: `https://elracehub.vercel.app`
- **Shared Database**: Both systems use the same Supabase instance

---

## Simplified Integration Flow (Using Shared Database)

Since the RCC Hub has direct access to the same database, the integration is much simpler:

### Step 1: User Logs into RCC Hub
When a user successfully logs into the RCC Hub, check the `security_staff` table directly in your shared Supabase database.

### Step 2: Check Security System Access (Direct Database Query)
Instead of calling an API, query the database directly:

\`\`\`typescript
// Hub-side code - Direct database query
const checkSecurityAccess = async (fileId: string) => {
  try {
    // Query the security_staff table directly
    const { data: staffUser, error } = await supabase
      .from('security_staff')
      .select('*')
      .eq('file_id', fileId)
      .single()
    
    if (staffUser && !error) {
      return {
        hasSecurityAccess: true,
        role: 'staff',
        fileId: staffUser.file_id,
        name: staffUser.name,
        email: staffUser.email
      }
    }
    
    // Also check if user is admin in profiles table
    const { data: adminUser } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', userEmail)
      .eq('role', 'admin')
      .single()
    
    if (adminUser) {
      return {
        hasSecurityAccess: true,
        role: 'admin',
        email: adminUser.email,
        name: adminUser.full_name
      }
    }
    
    return { hasSecurityAccess: false }
  } catch (error) {
    console.error('[Hub] Security access check failed:', error)
    return { hasSecurityAccess: false }
  }
}
\`\`\`

### Step 3: Authenticate User (Direct Database Query)
When the user enters their credentials, verify against the database:

\`\`\`typescript
// Hub-side code - Direct authentication
const authenticateSecurityUser = async (fileId: string, password: string) => {
  try {
    // Query security_staff table with file_id and password
    const { data: staffUser, error } = await supabase
      .from('security_staff')
      .select('*')
      .eq('file_id', fileId)
      .eq('current_password', password)
      .single()
    
    if (staffUser && !error) {
      console.log('[Hub] Staff authentication successful:', staffUser.name)
      return {
        success: true,
        role: 'staff',
        user: staffUser
      }
    }
    
    // Check admin authentication
    // Admin username is "admin" or "Admin" and password is in ADMIN_PASSWORD env var
    if (fileId.toLowerCase() === 'admin') {
      // You need to check admin password against your environment variable
      // or implement admin auth check
      return {
        success: true,
        role: 'admin',
        user: { fileId: 'admin', name: 'Administrator' }
      }
    }
    
    return { success: false, error: 'Invalid credentials' }
  } catch (error) {
    console.error('[Hub] Authentication error:', error)
    return { success: false, error: 'Authentication failed' }
  }
}
\`\`\`

### Step 4: Generate SSO Token and Redirect
After successful database authentication, call the SSO API to get a redirect URL:

\`\`\`typescript
const handleSecuritySystemClick = async (userEmail: string) => {
  try {
    console.log('[Hub] Generating SSO token for:', userEmail)
    
    const response = await fetch('https://elracesecurity.vercel.app/api/auth/external/sso', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: userEmail,
        source: 'rcc_hub'
      })
    })
    
    const result = await response.json()
    
    if (result.success) {
      console.log('[Hub] SSO token generated successfully')
      console.log('[Hub] Redirecting to:', result.redirectUrl)
      
      // ✅ CORRECT: Use the redirectUrl from the response
      window.location.href = result.redirectUrl
      // This will be either:
      // - https://elracesecurity.vercel.app/?token=xxx (for staff)
      // - https://elracesecurity.vercel.app/admin?token=xxx (for admin)
      
    } else {
      console.error('[Hub] SSO token generation failed:', result.error)
      alert('Failed to access Security System. Please contact support.')
    }
  } catch (error) {
    console.error('[Hub] Security System authentication error:', error)
    alert('Connection error. Please try again.')
  }
}
\`\`\`

---

## Complete Hub Implementation Example (With Shared Database)

\`\`\`typescript
// Hub Dashboard Component
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export function HubDashboard({ user }: { user: { fileId: string, email: string, name: string } }) {
  const [hasSecurityAccess, setHasSecurityAccess] = useState(false)
  const [securityUserRole, setSecurityUserRole] = useState<'admin' | 'staff' | null>(null)
  const [isCheckingAccess, setIsCheckingAccess] = useState(true)

  // Check security access on component mount using direct database query
  useEffect(() => {
    const checkAccess = async () => {
      try {
        // Check if user exists in security_staff table
        const { data: staffUser } = await supabase
          .from('security_staff')
          .select('*')
          .eq('file_id', user.fileId)
          .single()
        
        if (staffUser) {
          setHasSecurityAccess(true)
          setSecurityUserRole('staff')
          console.log('[Hub] User has security system access: staff')
          setIsCheckingAccess(false)
          return
        }
        
        // Check if user is admin
        const { data: adminUser } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', user.email)
          .eq('role', 'admin')
          .single()
        
        if (adminUser) {
          setHasSecurityAccess(true)
          setSecurityUserRole('admin')
          console.log('[Hub] User has security system access: admin')
        } else {
          setHasSecurityAccess(false)
          console.log('[Hub] User does not have security system access')
        }
      } catch (error) {
        console.error('[Hub] Failed to check security access:', error)
        setHasSecurityAccess(false)
      } finally {
        setIsCheckingAccess(false)
      }
    }

    checkAccess()
  }, [user.fileId, user.email])

  // Handle security system icon click
  const handleSecurityClick = async () => {
    try {
      console.log('[Hub] Authenticating to Security System for:', user.email)
      
      // Call SSO API to generate token
      const response = await fetch('https://elracesecurity.vercel.app/api/auth/external/sso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: user.email,
          source: 'rcc_hub'
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        console.log('[Hub] Security System auth successful')
        console.log('[Hub] Redirecting to:', result.redirectUrl)
        
        // Redirect to Security System with auto-login
        window.location.href = result.redirectUrl
        
      } else {
        console.error('[Hub] Security System API returned error:', result.error)
        alert('Failed to access Security System: ' + result.error)
      }
    } catch (error) {
      console.error('[Hub] Security System authentication error:', error)
      alert('Connection error. Please try again.')
    }
  }

  return (
    <div className="dashboard">
      <h1>Good morning, {user.name}</h1>
      
      {/* Security System Icon - Only shown if user has access */}
      {!isCheckingAccess && hasSecurityAccess && (
        <div className="dashboard-item" onClick={handleSecurityClick}>
          <div className="icon">
            <img src="/security-icon.png" alt="Security" />
          </div>
          <div className="label">
            SECURITY SYSTEM
            {securityUserRole === 'admin' && <span className="badge">Admin</span>}
          </div>
        </div>
      )}
    </div>
  )
}
\`\`\`

---

## Database Tables Reference

### `security_staff` Table
Contains all security staff members with their credentials:
- `uuid` (primary key)
- `file_id` (text) - Staff employee ID
- `name` (text) - Full name
- `email` (text)
- `current_password` (text) - Plain text password
- `contact_number` (text)
- `assigned_project` (text)

**Example Query**:
\`\`\`sql
SELECT * FROM security_staff WHERE file_id = '3252' AND current_password = '3252';
\`\`\`

### `profiles` Table
Contains admin users:
- `id` (uuid)
- `email` (text)
- `full_name` (text)
- `role` (text) - 'admin' or 'staff'

---

## Integration Flow

### Step 1: User Logs into RCC Hub
When a user successfully logs into the RCC Hub, check if they have access to the Security System.

### Step 2: Check Security System Access
**Endpoint**: `POST https://elracesecurity.vercel.app/api/auth/external/check-access`

\`\`\`typescript
// Call this after Hub login succeeds
const checkSecurityAccess = async (userEmail: string) => {
  try {
    const response = await fetch('https://elracesecurity.vercel.app/api/auth/external/check-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail })
    })
    
    const result = await response.json()
    
    if (result.success && result.hasAccess) {
      // User has access to Security System
      // Store this info in user session
      return {
        hasSecurityAccess: true,
        role: result.user.role, // 'admin' or 'staff'
        name: result.user.name
      }
    }
    
    return { hasSecurityAccess: false }
  } catch (error) {
    console.error('[Hub] Security access check failed:', error)
    return { hasSecurityAccess: false }
  }
}
\`\`\`

### Step 3: Show Security System Icon (if user has access)
In your Hub dashboard, display the "SECURITY SYSTEM" icon only if `hasSecurityAccess === true`.

### Step 4: Generate SSO Token and Redirect
When user clicks the Security System icon:

**Endpoint**: `POST https://elracesecurity.vercel.app/api/auth/external/sso`

\`\`\`typescript
const handleSecuritySystemClick = async (userEmail: string) => {
  try {
    console.log('[Hub] Generating SSO token for:', userEmail)
    
    const response = await fetch('https://elracesecurity.vercel.app/api/auth/external/sso', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: userEmail,
        hubToken: 'optional_hub_token' // Optional: your hub's session token for logging
      })
    })
    
    const result = await response.json()
    
    if (result.success) {
      console.log('[Hub] SSO token generated successfully')
      console.log('[Hub] Redirecting to:', result.redirectUrl)
      
      // ✅ CORRECT: Use the redirectUrl from the response
      window.location.href = result.redirectUrl
      // This will be either:
      // - https://elracesecurity.vercel.app/?token=xxx (for staff)
      // - https://elracesecurity.vercel.app/admin?token=xxx (for admin)
      
    } else {
      console.error('[Hub] SSO token generation failed:', result.error)
      alert('Failed to access Security System. Please contact support.')
    }
  } catch (error) {
    console.error('[Hub] Security System authentication error:', error)
    alert('Connection error. Please try again.')
  }
}
\`\`\`

---

## IMPORTANT: What NOT to Do

### ❌ WRONG - Do NOT redirect to API endpoints:
\`\`\`typescript
// DON'T DO THIS:
window.location.href = `https://elracesecurity.vercel.app/api/staff/sso-login?token=${token}`
window.location.href = `https://elracesecurity.vercel.app/api/auth/external/sso?token=${token}`
\`\`\`

### ✅ CORRECT - Always use the redirectUrl from the SSO response:
\`\`\`typescript
// DO THIS:
const result = await fetch('https://elracesecurity.vercel.app/api/auth/external/sso', {...})
window.location.href = result.redirectUrl // This is the page URL, not an API URL
\`\`\`

---

## API Reference

### 1. Check Access
**Endpoint**: `POST /api/auth/external/check-access`

**Request**:
\`\`\`json
{
  "email": "user@example.com"
}
\`\`\`

**Response** (Success):
\`\`\`json
{
  "success": true,
  "hasAccess": true,
  "user": {
    "email": "user@example.com",
    "role": "staff",
    "name": "John Doe",
    "fileId": "3252"
  }
}
\`\`\`

**Response** (No Access):
\`\`\`json
{
  "success": true,
  "hasAccess": false
}
\`\`\`

### 2. Generate SSO Token
**Endpoint**: `POST /api/auth/external/sso`

**Request**:
\`\`\`json
{
  "email": "user@example.com",
  "hubToken": "optional_hub_session_token"
}
\`\`\`

**Response** (Success):
\`\`\`json
{
  "success": true,
  "token": "4772cd7595933d0202c240fe13727cc96744127c8c97d8bfaf619c578e84cf",
  "user": {
    "id": "3252",
    "email": "user@example.com",
    "role": "staff",
    "fullName": "John Doe",
    "fileId": "3252"
  },
  "redirectUrl": "https://elracesecurity.vercel.app/?token=4772cd7595933d0202c240fe13727cc96744127c8c97d8bfaf619c578e84cf",
  "expiresAt": "2025-12-16T18:16:16.752Z"
}
\`\`\`

**Response** (User Not Found):
\`\`\`json
{
  "success": false,
  "error": "User not found. Access denied."
}
\`\`\`

---

## Testing Checklist

### For RCC Hub Developers:

1. **Test with Staff User**:
   - Login to Hub with staff email (e.g., mehranshoukat99@gmail.com)
   - Verify Security System icon appears
   - Click icon and verify redirect to `https://elracesecurity.vercel.app/?token=xxx`
   - Verify automatic login to staff dashboard

2. **Test with Admin User**:
   - Login to Hub with admin account
   - Click Security System icon
   - Verify redirect to `https://elracesecurity.vercel.app/admin?token=xxx`
   - Verify automatic login to admin dashboard

3. **Test with No Access**:
   - Login to Hub with user without security access
   - Verify Security System icon does NOT appear

4. **Test Error Handling**:
   - Test with invalid email
   - Test with network error
   - Verify appropriate error messages

### Console Logs to Check:

When everything works correctly, you should see:
\`\`\`
[Hub] User has security system access: staff
[Hub] Authenticating to Security System for: user@example.com
[Hub] Security System auth response: {...}
[Hub] Redirecting staff user to: https://elracesecurity.vercel.app/?token=xxx
\`\`\`

---

## Troubleshooting

### Issue: "404 Not Found" or "Cannot GET /api/..."
**Cause**: Redirecting to API endpoint instead of page URL
**Fix**: Use `result.redirectUrl` from SSO response, don't construct your own URL

### Issue: User sees login page instead of auto-login
**Cause**: Token not in URL or invalid token format
**Fix**: Ensure you're using the exact `redirectUrl` from the API response

### Issue: "User not found" error
**Cause**: User email doesn't exist in Security System database
**Fix**: Add user to `profiles` or `securitystaff` table in Security System

### Issue: CORS errors
**Cause**: All Security System APIs have CORS enabled for all origins
**Fix**: This shouldn't happen - contact Security System team if it does

---

## Support

If you encounter any issues during integration:
1. Check the console logs on both Hub and Security System sides
2. Verify the email matches exactly in both systems
3. Ensure you're using `result.redirectUrl` for navigation
4. Contact Security System team with error logs

---

## Security Notes

- Tokens expire after 24 hours
- Tokens are single-use for initial authentication
- After initial auth, Security System creates its own session
- Always use HTTPS in production
- Never log or display full tokens (truncate in logs)
