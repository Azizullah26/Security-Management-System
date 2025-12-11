# External Authentication Integration Guide

## Overview

This guide explains how to integrate the RCC Security Management System with third-party platforms (like RCC HUB) using token-based authentication.

## Authentication Flow

\`\`\`
1. User enters credentials in RCC HUB
   ↓
2. RCC HUB calls /api/auth/external/login
   ↓
3. Security System validates credentials and returns session token
   ↓
4. RCC HUB stores token and redirects to dashboardUrl
   ↓
5. Security System validates token on page load
   ↓
6. User accesses system without re-entering credentials
\`\`\`

## API Endpoints

### 1. Login (Authenticate User)

**Endpoint:** `POST /api/auth/external/login`

**Request Body:**
\`\`\`json
{
  "username": "admin",
  "password": "your_password",
  "source": "rcc_hub"
}
\`\`\`

**Success Response (200):**
\`\`\`json
{
  "success": true,
  "user": {
    "id": "admin",
    "username": "admin",
    "role": "admin",
    "name": "Administrator"
  },
  "token": "a1b2c3d4e5f6...session_token",
  "expiresAt": "2025-01-11T10:30:00.000Z",
  "dashboardUrl": "/admin?token=a1b2c3d4e5f6...session_token"
}
\`\`\`

**Error Response (401):**
\`\`\`json
{
  "success": false,
  "error": "Invalid credentials"
}
\`\`\`

### 2. Verify Token (Check Session Validity)

**Endpoint:** `POST /api/auth/external/verify`

**Request Body:**
\`\`\`json
{
  "token": "a1b2c3d4e5f6...session_token"
}
\`\`\`

**Success Response (200):**
\`\`\`json
{
  "success": true,
  "valid": true,
  "user": {
    "id": "admin",
    "username": "admin",
    "role": "admin",
    "name": "Administrator"
  },
  "expiresAt": "2025-01-11T10:30:00.000Z"
}
\`\`\`

**Invalid Token Response (200):**
\`\`\`json
{
  "success": true,
  "valid": false,
  "error": "Invalid or expired token"
}
\`\`\`

### 3. Logout (Invalidate Session)

**Endpoint:** `POST /api/auth/external/logout`

**Request Body:**
\`\`\`json
{
  "token": "a1b2c3d4e5f6...session_token"
}
\`\`\`

**Success Response (200):**
\`\`\`json
{
  "success": true,
  "message": "Session invalidated successfully"
}
\`\`\`

## Integration Steps for RCC HUB

### Step 1: Handle Login Form Submission

\`\`\`javascript
// In your RCC HUB login component
async function handleSignIn(email, password) {
  try {
    const response = await fetch('https://elracesecurity.vercel.app/api/auth/external/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: email, // or use email as username
        password: password,
        source: 'rcc_hub'
      })
    });

    const data = await response.json();

    if (data.success) {
      // Store token securely (localStorage, sessionStorage, or cookie)
      localStorage.setItem('security_system_token', data.token);
      localStorage.setItem('security_system_user', JSON.stringify(data.user));
      
      // Option 1: Redirect to security system dashboard
      window.location.href = `https://elracesecurity.vercel.app${data.dashboardUrl}`;
      
      // Option 2: Open in new tab
      // window.open(`https://elracesecurity.vercel.app${data.dashboardUrl}`, '_blank');
      
      // Option 3: Embed in iframe within RCC HUB
      // document.getElementById('security-iframe').src = `https://elracesecurity.vercel.app${data.dashboardUrl}`;
    } else {
      alert(data.error);
    }
  } catch (error) {
    console.error('Login error:', error);
    alert('Failed to connect to security system');
  }
}
\`\`\`

### Step 2: Add Dashboard Access Button

\`\`\`javascript
// In your RCC HUB dashboard
function openSecuritySystem() {
  const token = localStorage.getItem('security_system_token');
  const user = JSON.parse(localStorage.getItem('security_system_user'));
  
  if (token && user) {
    // Construct URL with token
    const dashboardUrl = user.role === 'admin' 
      ? `/admin?token=${token}`
      : `/?token=${token}`;
    
    window.open(`https://elracesecurity.vercel.app${dashboardUrl}`, '_blank');
  } else {
    alert('Please login first');
  }
}
\`\`\`

### Step 3: Verify Token Periodically (Optional)

\`\`\`javascript
// Check if token is still valid
async function verifySecurityToken() {
  const token = localStorage.getItem('security_system_token');
  
  if (!token) return false;
  
  try {
    const response = await fetch('https://elracesecurity.vercel.app/api/auth/external/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token })
    });
    
    const data = await response.json();
    
    if (!data.valid) {
      // Token expired, clear storage
      localStorage.removeItem('security_system_token');
      localStorage.removeItem('security_system_user');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Token verification error:', error);
    return false;
  }
}
\`\`\`

### Step 4: Handle Logout

\`\`\`javascript
// When user logs out from RCC HUB
async function logout() {
  const token = localStorage.getItem('security_system_token');
  
  if (token) {
    try {
      await fetch('https://elracesecurity.vercel.app/api/auth/external/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token })
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    // Clear local storage
    localStorage.removeItem('security_system_token');
    localStorage.removeItem('security_system_user');
  }
  
  // Continue with RCC HUB logout
}
\`\`\`

## Security Considerations

1. **HTTPS Only**: Always use HTTPS in production
2. **Token Storage**: Store tokens securely (HttpOnly cookies recommended)
3. **Token Expiration**: Tokens expire after 24 hours
4. **CORS**: Configure CORS to allow requests from RCC HUB domain
5. **Rate Limiting**: Implement rate limiting on login endpoint

## Supported User Types

- **Admin**: Full access to admin dashboard
- **Staff**: Access to staff dashboard with assigned project

## Example Usage in RCC HUB

\`\`\`html
<!-- Add button in RCC HUB dashboard -->
<button onclick="openSecuritySystem()">
  Access Security System
</button>

<script>
  async function openSecuritySystem() {
    const token = localStorage.getItem('security_system_token');
    
    if (token) {
      // Verify token first
      const isValid = await verifySecurityToken();
      
      if (isValid) {
        window.open(`https://elracesecurity.vercel.app/admin?token=${token}`, '_blank');
      } else {
        alert('Session expired. Please login again.');
      }
    } else {
      alert('Please login first');
    }
  }
</script>
\`\`\`

## Testing

Use these test credentials:

**Admin:**
- Username: `admin`
- Password: `[Your ADMIN_PASSWORD env variable]`

**Staff:**
- Username: `3252` (or any staff file_id)
- Password: `[Your STAFF_3252_PASSWORD env variable]`

## Support

For integration support, contact the security system development team.
