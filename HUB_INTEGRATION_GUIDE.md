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

Since the RCC Hub has direct access to the same database, the integration is very simple:

### Step 1: User Logs into RCC Hub
When a user successfully logs into the RCC Hub using their `file_id` and password, verify credentials against the `security_staff` table.

### Step 2: Authenticate User (Direct Database Query)
When authenticating, verify credentials against the database:

\`\`\`typescript
// Hub-side code - Direct authentication
const authenticateUser = async (fileId: string, password: string) => {
  try {
    const { data: staffUser } = await supabase
      .from('security_staff')
      .select('*')
      .eq('file_id', fileId)
      .eq('current_password', password)
      .single()
    
    if (staffUser) {
      return {
        success: true,
        role: 'staff',
        user: staffUser
      }
    }
    
    // Check if admin (file_id === "Admin")
    if (fileId.toLowerCase() === 'admin' && password === process.env.ADMIN_PASSWORD) {
      return {
        success: true,
        role: 'admin',
        user: { file_id: 'Admin', full_name: 'Administrator' }
      }
    }
    
    return { success: false }
  } catch (error) {
    return { success: false }
  }
}
\`\`\`

### Step 3: Generate SSO Token and Redirect
After successful authentication, call the SSO API to get a redirect URL:

\`\`\`typescript
const handleSecuritySystemClick = async (fileId: string, password: string) => {
  try {
    console.log('[Hub] Generating SSO token for file_id:', fileId)
    
    const response = await fetch('https://elracesecurity.vercel.app/api/auth/external/sso', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        file_id: fileId,
        password: password,
        source: 'rcc_hub'
      })
    })
    
    const result = await response.json()
    
    if (result.success) {
      console.log('[Hub] Redirecting to:', result.redirectUrl)
      
      // ✅ CRITICAL: Use the redirectUrl from the response
      // This will be: https://elracesecurity.vercel.app/?token=xxx (staff)
      // or: https://elracesecurity.vercel.app/admin?token=xxx (admin)
      window.location.href = result.redirectUrl
      
    } else {
      alert('Failed to access Security System: ' + result.error)
    }
  } catch (error) {
    console.error('[Hub] Error:', error)
    alert('Connection error. Please try again.')
  }
}
\`\`\`

---

## CRITICAL: What NOT to Do

### ❌ WRONG - Do NOT redirect to these URLs:
\`\`\`typescript
// DON'T DO THIS - These are API endpoints, not pages:
window.location.href = `https://elracesecurity.vercel.app/api/staff/sso-login?token=${token}` // ❌
window.location.href = `https://elracesecurity.vercel.app/api/auth/external/sso?token=${token}` // ❌
\`\`\`

These URLs return JSON, not HTML pages, and will show "Method Not Allowed" errors.

### ✅ CORRECT - Always use the redirectUrl from the SSO API response:
\`\`\`typescript
// DO THIS - Use the redirectUrl from the response:
const result = await fetch('https://elracesecurity.vercel.app/api/auth/external/sso', {
  method: 'POST',
  body: JSON.stringify({ email: userEmail })
})

if (result.success) {
  window.location.href = result.redirectUrl // ✅ This is a page URL, not API
}
\`\`\`

The `redirectUrl` will automatically be:
- `https://elracesecurity.vercel.app/?token=xxx` for staff users
- `https://elracesecurity.vercel.app/admin?token=xxx` for admin users

---

## Complete Hub Implementation Example

\`\`\`typescript
// Hub Dashboard Component
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export function HubDashboard({ user }: { user: { fileId: string, password: string } }) {
  const [hasSecurityAccess, setHasSecurityAccess] = useState(false)

  useEffect(() => {
    const checkAccess = async () => {
      const { data: staffUser } = await supabase
        .from('security_staff')
        .select('*')
        .eq('file_id', user.fileId)
        .single()
      
      if (staffUser) {
        setHasSecurityAccess(true)
        return
      }
      
      // Check if admin
      if (user.fileId.toLowerCase() === 'admin') {
        setHasSecurityAccess(true)
      }
    }

    checkAccess()
  }, [user.fileId])

  const handleSecurityClick = async () => {
    try {
      const response = await fetch('https://elracesecurity.vercel.app/api/auth/external/sso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          file_id: user.fileId,
          password: user.password,
          source: 'rcc_hub' 
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Use the redirectUrl - it's already the correct page URL with token
        window.location.href = result.redirectUrl
      } else {
        alert('Access denied: ' + result.error)
      }
    } catch (error) {
      alert('Connection error')
    }
  }

  return (
    <div>
      {hasSecurityAccess && (
        <div onClick={handleSecurityClick}>
          <img src="/security-icon.png" alt="Security" />
          <span>SECURITY SYSTEM</span>
        </div>
      )}
    </div>
  )
}
\`\`\`

---

## API Reference

### Generate SSO Token
**Endpoint**: `POST https://elracesecurity.vercel.app/api/auth/external/sso`

**Request**:
\`\`\`json
{
  "file_id": "3252",
  "password": "3252",
  "source": "rcc_hub"
}
\`\`\`

**Success Response**:
\`\`\`json
{
  "success": true,
  "token": "abc123...",
  "user": {
    "file_id": "3252",
    "role": "staff",
    "fullName": "Mehran Shoukat Muhammad Shoukat",
    "position": "Security Guard"
  },
  "redirectUrl": "https://elracesecurity.vercel.app/?token=abc123...",
  "expiresAt": "2025-12-16T18:16:16.752Z"
}
\`\`\`

**Error Response**:
\`\`\`json
{
  "success": false,
  "error": "Invalid credentials"
}
\`\`\`

---

## Database Tables

### `security_staff` Table
- `id` (uuid) - Primary key
- `file_id` (text) - Staff ID (e.g., "3252", "Admin")
- `full_name` (text) - Staff full name
- `current_password` (text) - Plain text password
- `position` (text) - Job position
- `department_staff` (text) - Department

---

## Testing Checklist

1. **Staff User Test**:
   - Login to Hub with file_id: "3252" and password: "3252"
   - Click Security System icon
   - Should redirect to `https://elracesecurity.vercel.app/?token=xxx`
   - Should auto-login to staff dashboard

2. **Admin User Test**:
   - Login to Hub with file_id: "Admin" and password: "RCC0085"
   - Click Security System icon
   - Should redirect to `https://elracesecurity.vercel.app/admin?token=xxx`
   - Should auto-login to admin dashboard

3. **No Access Test**:
   - Login to Hub without security access
   - Security System icon should NOT appear

---

## Troubleshooting

### Issue: "405 Method Not Allowed"
**Cause**: Redirecting to `/api/staff/sso-login?token=xxx` instead of using `result.redirectUrl`
**Fix**: Always use `result.redirectUrl` from the SSO API response

### Issue: "404 Not Found"
**Cause**: Constructing URL manually instead of using API response
**Fix**: Use `result.redirectUrl` exactly as provided

### Issue: User sees login page
**Cause**: Token not in URL or invalid
**Fix**: Verify you're redirecting to the exact URL from `result.redirectUrl`

### Issue: "User not found"
**Cause**: Email doesn't exist in Security System database
**Fix**: Add user to `security_staff` or `profiles` table

---

## Summary

**The Correct Flow:**
1. Hub authenticates user using `file_id` and `password` (checks `security_staff` table directly)
2. Hub calls `POST /api/auth/external/sso` with `file_id` and `password`
3. Hub redirects to `result.redirectUrl` (NOT to an API endpoint)
4. Security System page detects token and auto-logs in user

**Key Point**: Never redirect users to API endpoints (`/api/*`). Always use the page URLs provided in `redirectUrl`.
