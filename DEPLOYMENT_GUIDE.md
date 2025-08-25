# Deployment Configuration Guide

## For rccsecurity.vercel.app Domain

### 1. Vercel Environment Variables
Set these in your Vercel project settings:

\`\`\`
ODOO_URL=https://your-odoo-instance.com
ODOO_DB=your-database-name
ODOO_USERNAME=your-odoo-username
ODOO_PASSWORD=your-odoo-password
\`\`\`

### 2. Odoo Configuration Updates

#### Update CORS Origins in Odoo Module:
In `hr_employee_rest_api/controllers/hr_employee_api.py`, the allowed origins are:
- `https://rccsecurity.vercel.app` (production)
- `http://localhost:3000` (development)

#### Odoo System Parameters:
Add these system parameters in Odoo:
- `web.base.url.freeze` = `True`
- `web.base.url` = `https://your-odoo-instance.com`

### 3. Deployment Steps:

1. **Deploy to Vercel:**
   \`\`\`bash
   vercel --prod
   \`\`\`

2. **Set Environment Variables in Vercel Dashboard:**
   - Go to Project Settings → Environment Variables
   - Add all ODOO_* variables

3. **Update Odoo Module:**
   - Install/update the `hr_employee_rest_api` module
   - Restart Odoo server

4. **Test Integration:**
   - Visit https://rccsecurity.vercel.app
   - Test File ID lookup with Staff category

### 4. Security Considerations:
- Use strong Odoo API credentials
- Enable HTTPS on Odoo instance
- Regularly rotate API passwords
- Monitor API access logs
