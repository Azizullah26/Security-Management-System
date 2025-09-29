# Security Management System - Technical Documentation

## Project Overview

The Security Management System is a comprehensive Next.js application designed for tracking and managing personnel, visitors, and contractors in a security-controlled environment. Built for RCC - El Race Contracting, this system integrates with Odoo ERP for staff validation and provides real-time tracking capabilities.

## Technology Stack

### Core Framework
- **Next.js 14.2.25** - React framework with App Router
- **React 19** - Latest React version with concurrent features
- **TypeScript 5** - Type-safe JavaScript development
- **Node.js** - Runtime environment

### UI Framework & Styling
- **Tailwind CSS 4.1.9** - Utility-first CSS framework
- **shadcn/ui** - Modern component library built on Radix UI
- **Radix UI** - 25+ accessible, unstyled UI primitives
- **Lucide React** - Icon library
- **Geist Font** - Modern typography

### Form Handling & Validation
- **React Hook Form 7.60.0** - Performant forms with easy validation
- **Zod 3.25.67** - TypeScript-first schema validation
- **@hookform/resolvers** - Validation library resolvers

### Data Visualization
- **Recharts 2.15.4** - Composable charting library

### Backend Integration
- **Odoo ERP Integration** - Custom REST API module for HR employee management
- **XML-RPC Protocol** - Communication with Odoo backend

## Architecture Overview

### Frontend Architecture
\`\`\`
app/
├── layout.tsx          # Root layout with theme and fonts
├── page.tsx           # Main dashboard component
├── globals.css        # Global styles and design tokens
└── api/
    └── odoo/
        └── staff/
            └── route.tsx  # Staff lookup API endpoint

components/
├── entry-form.tsx     # Complex form for adding entries
├── records-table.tsx  # Data table for viewing/managing records
├── time-tracker.tsx   # Real-time tracking dashboard
├── theme-provider.tsx # Theme management wrapper
└── ui/               # 40+ reusable UI components
    ├── button.tsx
    ├── card.tsx
    ├── dialog.tsx
    └── ...
\`\`\`

### Backend Architecture
\`\`\`
odoo_module/hr_employee_rest_api/
├── __manifest__.py           # Module configuration
├── models/
│   ├── __init__.py
│   └── hr_employee.py       # Employee model extensions
└── controllers/
    ├── __init__.py
    └── hr_employee_api.py   # REST API endpoints
\`\`\`

## Core Features

### 1. Multi-Category Personnel Tracking
- **Staff**: Validated against Odoo HR records
- **Visitors**: Guest tracking with host information
- **Clients**: Business client management
- **Consultants**: External consultant tracking
- **Subcontractors**: Subcontractor personnel management
- **Suppliers**: Supplier representative tracking

### 2. Real-Time Dashboard
- Live personnel count by category
- Currently inside vs. checked out status
- Duration tracking with overtime alerts
- Today's summary statistics

### 3. Entry Management System
- QR code scanning for quick entry
- Staff validation via Odoo API integration
- Photo capture and storage
- Purpose of visit tracking
- Host assignment for visitors

### 4. Records Management
- Searchable and filterable records table
- Entry details modal with full information
- Check-in/check-out functionality
- Duration calculations
- Export capabilities

### 5. Time Tracking
- Real-time clock display
- Duration calculations for each entry
- Overtime monitoring and alerts
- Auto-updating every second

## API Integration

### Odoo ERP Integration

#### Authentication
\`\`\`typescript
// XML-RPC authentication with Odoo
const uid = await client.call('common', 'authenticate', [
  process.env.ODOO_DB,
  process.env.ODOO_USERNAME,
  process.env.ODOO_PASSWORD,
  {}
]);
\`\`\`

#### Staff Lookup Endpoint
\`\`\`typescript
POST /api/odoo/staff
Content-Type: application/json

{
  "fileId": "employee_id_here"
}
\`\`\`

#### Response Format
\`\`\`typescript
{
  "success": true,
  "data": {
    "name": "Employee Name",
    "email": "employee@company.com",
    "phone": "phone_number",
    "department": "Department Name",
    "company": "Company Name",
    "image": "base64_image_data",
    "job_position": "Job Title"
  }
}
\`\`\`

### Custom Odoo Module

#### REST API Endpoints
- `POST /api/hr/employee/search` - Search employee by ID
- `GET /api/hr/employee/<id>` - Get employee by database ID
- `OPTIONS /api/hr/employee/search` - CORS preflight handling

#### Security Features
- CORS configuration for specific domains
- Authentication and access control
- Error handling and validation
- Secure credential management

## Component Architecture

### Main Application Components

#### 1. EntryForm Component
\`\`\`typescript
interface EntryData {
  id: string;
  category: string;
  name: string;
  email?: string;
  contact?: string;
  company?: string;
  purpose: string;
  host?: string;
  photo?: string;
  entryTime: string;
  status: 'inside' | 'exited';
  exitTime?: string;
}
\`\`\`

**Features:**
- Multi-step form with category-specific fields
- QR code scanning integration
- Real-time staff validation
- Photo capture functionality
- Error boundary implementation
- Mobile-responsive design

#### 2. RecordsTable Component
**Features:**
- Server-side filtering and searching
- Sortable columns
- Entry details modal
- Check-out functionality
- Duration tracking
- Responsive table design

#### 3. TimeTracker Component
**Features:**
- Real-time clock display
- Live duration calculations
- Overtime alerts
- Currently inside summary
- Auto-refresh every second

### UI Component Library

Built on shadcn/ui patterns with 40+ components:

#### Core Components
- `Button` - Multiple variants and sizes
- `Card` - Layout containers
- `Dialog` - Modal dialogs
- `Input` - Form inputs
- `Table` - Data tables

#### Form Components
- `Form` - Form wrapper with validation
- `Select` - Dropdown selections
- `Textarea` - Multi-line inputs
- `Checkbox` - Checkbox inputs

#### Navigation & Layout
- `Sidebar` - Navigation sidebar
- `NavigationMenu` - Menu components
- `Breadcrumb` - Navigation breadcrumbs

## Data Flow

### Entry Creation Flow
1. User selects category and clicks "Add Entry"
2. EntryForm opens with category-specific fields
3. For staff: QR scan → API validation → Auto-populate fields
4. For others: Manual entry with validation
5. Photo capture (optional)
6. Form submission → State update → Dashboard refresh

### Staff Validation Flow
1. QR code scanned or File ID entered
2. POST request to `/api/odoo/staff`
3. Next.js API authenticates with Odoo
4. Employee search in Odoo HR records
5. Data formatting and response
6. Form auto-population or error display

### Real-Time Updates
1. TimeTracker component updates every second
2. Duration calculations for all active entries
3. Overtime alerts for entries > 8 hours
4. Dashboard statistics refresh

## Security Implementation

### Authentication & Authorization
- Odoo API key authentication
- Environment variable security
- CORS configuration for specific domains
- Access control in API endpoints

### Data Protection
- Secure credential storage
- Input validation and sanitization
- Error handling without data exposure
- Secure image handling

### CORS Configuration
\`\`\`json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "https://rccsecurity.vercel.app"
        }
      ]
    }
  ]
}
\`\`\`

## Deployment Configuration

### Environment Variables
\`\`\`bash
ODOO_URL=https://your-odoo-instance.com
ODOO_DB=your_database_name
ODOO_USERNAME=api_user
ODOO_PASSWORD=secure_password
\`\`\`

### Vercel Configuration
- Static export optimization
- Image optimization disabled for compatibility
- TypeScript and ESLint build error handling
- Analytics integration

### Build Configuration
\`\`\`javascript
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true }
};
\`\`\`

## Performance Optimizations

### Frontend Optimizations
- React Server Components for initial rendering
- Client-side state management with useState
- Efficient re-rendering with proper key props
- Image optimization and lazy loading
- Mobile-first responsive design

### Backend Optimizations
- Efficient Odoo API calls
- Error caching to prevent repeated failed requests
- Optimized database queries
- Connection pooling for API requests

## Mobile Responsiveness

### Design Patterns
- Mobile-first approach with Tailwind CSS
- Responsive grid layouts
- Touch-friendly button sizes
- Optimized form layouts for mobile
- Horizontal scrolling for tables

### Breakpoints
- `sm:` - 640px and up
- `md:` - 768px and up
- `lg:` - 1024px and up
- `xl:` - 1280px and up

## Error Handling

### Frontend Error Boundaries
\`\`\`typescript
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({error, resetErrorBoundary}) {
  return (
    <div role="alert">
      <h2>Something went wrong:</h2>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}
\`\`\`

### API Error Handling
- Comprehensive error logging
- User-friendly error messages
- Proper HTTP status codes
- Graceful degradation

## Development Guidelines

### Code Standards
- TypeScript strict mode enabled
- ESLint configuration for code quality
- Consistent component patterns
- Proper error boundaries
- Mobile-first responsive design

### Component Guidelines
- Single responsibility principle
- Proper TypeScript interfaces
- Error boundary implementation
- Accessibility considerations
- Performance optimization

### Testing Strategy
- Component unit testing
- API endpoint testing
- Integration testing with Odoo
- Mobile responsiveness testing
- Error scenario testing

## Future Enhancements

### Planned Features
1. **Advanced Reporting**
   - Daily/weekly/monthly reports
   - Export to PDF/Excel
   - Analytics dashboard

2. **Notification System**
   - Email notifications for overtime
   - SMS alerts for security events
   - Push notifications

3. **Advanced Security**
   - Biometric authentication
   - RFID card integration
   - Security camera integration

4. **Multi-location Support**
   - Location-based tracking
   - Site-specific configurations
   - Cross-location reporting

### Technical Improvements
1. **Database Integration**
   - Local database for offline capability
   - Data synchronization
   - Backup and recovery

2. **Performance Enhancements**
   - Server-side rendering optimization
   - Caching strategies
   - Progressive Web App features

3. **Integration Expansions**
   - Additional ERP system support
   - Third-party security system integration
   - API webhooks for real-time updates

## Maintenance & Support

### Regular Maintenance Tasks
- Dependency updates
- Security patches
- Performance monitoring
- Database cleanup
- Log file management

### Monitoring & Logging
- Application performance monitoring
- Error tracking and reporting
- User activity logging
- System health checks
- Automated backup verification

### Support Procedures
- Issue tracking and resolution
- User training and documentation
- System updates and deployments
- Data backup and recovery procedures
- Emergency response protocols

---

**Last Updated:** January 2025  
**Version:** 1.0  
**Maintained By:** Development Team
