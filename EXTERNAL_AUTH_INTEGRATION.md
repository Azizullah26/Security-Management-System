# External Authentication Integration Guide

## Overview

This guide explains how to integrate the RCC Security Management System with the RCC HUB using token-based authentication and SSO.

**System URLs:**
- **Security System:** https://elracesecurity.vercel.app
- **RCC HUB:** https://elracehub.vercel.app

## Available API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/external/login` | POST | Username/password authentication |
| `/api/auth/external/check-access` | POST | Check if email has security access |
| `/api/auth/external/sso` | POST | SSO login (generate session from email) |
| `/api/auth/external/verify` | POST | Verify existing session token |
| `/api/auth/external/logout` | POST | Invalidate session token |

---

## SSO Integration (Recommended for RCC Hub)

### Step 1: Check User Access on Hub Login

When a user logs into the RCC Hub, check if they have access to the security system:

```javascript
// Call this when user logs into RCC Hub
async function checkSecurityAccess(email) {
  try {
    const response = await fetch('https://elracesecurity.vercel.app/api/auth/external/check-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email })
    });

    const result = await response.json();
    
    // Store access status
    localStorage.setItem('hasSecurityAccess', result.hasAccess ? 'true' : 'false');
    if (result.user) {
      localStorage.setItem('securityUser', JSON.stringify(result.user));
    }
    
    return result;
  } catch (error) {
    console.error('Failed to check security access:', error);
    return { hasAccess: false };
  }
}

// Response format:
// { success: true, hasAccess: true, user: { id, email, role, fullName, fileId } }
// { success: true, hasAccess: false, user: null }
```

### Step 2: Handle Security Icon Click

```javascript
async function handleSecurityIconClick() {
  const hasAccess = localStorage.getItem('hasSecurityAccess') === 'true';
  const userEmail = localStorage.getItem('userEmail'); // Store this on login
  
  if (!hasAccess) {
    alert("Sorry, you don't have access to the Security System");
    return;
  }
  
  // Generate SSO session and redirect
  try {
    const response = await fetch('https://elracesecurity.vercel.app/api/auth/external/sso', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: userEmail,
        hubToken: localStorage.getItem('hubSessionToken') // Optional: for extra verification
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Open security system - user is automatically logged in
      window.open(result.redirectUrl, '_blank');
    } else {
      alert(result.error || 'Failed to access security system');
    }
  } catch (error) {
    console.error('SSO error:', error);
    alert('Failed to connect to security system');
  }
}

// SSO Response format:
// {
//   success: true,
//   token: "abc123...",
//   user: { id, email, role, fullName, fileId },
//   redirectUrl: "https://elracesecurity.vercel.app/admin?token=abc123...",
//   expiresAt: "2025-12-13T..."
// }
```

### Step 3: Complete Hub Integration Example

```javascript
// On RCC Hub Login Success
async function onLoginSuccess(email, password) {
  // 1. Store user email
  localStorage.setItem('userEmail', email);
  
  // 2. Check security system access
  const securityAccess = await checkSecurityAccess(email);
  
  console.log('Security access:', securityAccess.hasAccess ? 'Granted' : 'Denied');
  
  // 3. Update UI to show/hide security icon based on access
  updateSecurityIconVisibility(securityAccess.hasAccess);
}

// Security Icon Click Handler
document.getElementById('security-icon').addEventListener('click', handleSecurityIconClick);
```

---

## Username/Password Authentication (Alternative)

If you need traditional username/password login instead of SSO:

### Login Endpoint

```javascript
async function loginToSecurity(username, password) {
  const response = await fetch('https://elracesecurity.vercel.app/api/auth/external/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: username,
      password: password,
      source: 'rcc_hub'
    })
  });
  
  const result = await response.json();
  
  if (result.success) {
    // Store token for later use
    localStorage.setItem('securityToken', result.token);
    
    // Redirect to security dashboard
    window.open(result.dashboardUrl, '_blank');
  }
  
  return result;
}

// Response format:
// {
//   success: true,
//   token: "abc123...",
//   user: { id, username, role, name, assignedProject },
//   dashboardUrl: "https://elracesecurity.vercel.app/admin?token=abc123...",
//   expiresAt: "2025-12-13T..."
// }
```

---

## Verify Session Token

Check if an existing token is still valid:

```javascript
async function verifyToken(token) {
  const response = await fetch('https://elracesecurity.vercel.app/api/auth/external/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: token })
  });
  
  return await response.json();
}

// Response: { success: true, valid: true, user: {...}, expiresAt: "..." }
// Response: { success: true, valid: false, error: "Invalid or expired token" }
```

---

## Logout

Invalidate a session when user logs out:

```javascript
async function logoutFromSecurity(token) {
  await fetch('https://elracesecurity.vercel.app/api/auth/external/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: token })
  });
  
  localStorage.removeItem('securityToken');
  localStorage.removeItem('hasSecurityAccess');
  localStorage.removeItem('securityUser');
}
```

---

## Authentication Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         RCC HUB                                  │
│                                                                  │
│  1. User enters email/password                                   │
│  2. Hub authenticates user                                       │
│  3. Hub calls /api/auth/external/check-access with email         │
│  4. Store hasSecurityAccess flag                                 │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  User clicks Security icon                                  │  │
│  │                                                             │  │
│  │  hasAccess = true?                                          │  │
│  │      ├── YES: Call /api/auth/external/sso → Get redirectUrl │  │
│  │      │        → window.open(redirectUrl)                    │  │
│  │      │        → User auto-logged into Security System       │  │
│  │      │                                                      │  │
│  │      └── NO:  Show "Sorry, you don't have access"           │  │
│  └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY SYSTEM                               │
│                                                                  │
│  5. Receives request with ?token=xxx                             │
│  6. Verifies token via /api/auth/external/verify                 │
│  7. Creates authenticated session                                │
│  8. User sees dashboard (no login required)                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Error Handling

| Status Code | Meaning | Action |
|-------------|---------|--------|
| 200 | Success | Process response |
| 400 | Bad Request | Check request body |
| 401 | Unauthorized | Invalid credentials |
| 403 | Forbidden | User not found / no access |
| 500 | Server Error | Retry or contact support |

---

## Security Notes

- Session tokens expire after 24 hours
- Tokens are stored in database and validated on each request
- CORS is configured to allow requests from any origin
- All passwords are compared securely (case-insensitive username)
