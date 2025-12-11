# External Authentication Integration Guide

## Overview

This guide explains how to integrate the RCC Security Management System with the RCC HUB using token-based authentication.

**System URLs:**
- **Security System:** https://elracesecurity.vercel.app
- **RCC HUB:** https://elracehub.vercel.app

## Authentication Flow

... existing code ...

## Integration Steps for RCC HUB

### Step 1: Handle Login Form Submission

\`\`\`javascript
// In your RCC HUB login component (https://elracehub.vercel.app)
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

... existing code ...
\`\`\`

```typescript file="" isHidden
