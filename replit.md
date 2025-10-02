# RCC Security Management System

## Overview

The RCC Security Management System is a comprehensive Next.js application designed for tracking and managing personnel, visitors, and contractors in a security-controlled environment. The system provides real-time monitoring capabilities, entry/exit tracking, and integrates with an Odoo ERP backend for staff management. Built with modern web technologies, it features a professional dashboard interface for security operations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application is built with Next.js 14 using the App Router pattern and implements a component-based architecture:

- **Main Dashboard** (`app/page.tsx`) - Central hub with category tracking and real-time statistics
- **Admin Dashboard** (`app/admin/page.tsx`) - Administrative interface for staff and project management
- **Component Library** - Modular components using shadcn/ui built on Radix UI primitives
- **Form System** - Specialized entry forms for different visitor categories (staff, clients, contractors, suppliers, visitors)
- **Data Tables** - Interactive tables for viewing and managing entry records with search and filtering

**Design System**: Uses Tailwind CSS with a dark professional theme, featuring custom CSS variables for consistent theming across components.

### Backend Integration Architecture
The system employs a hybrid approach for data management:

- **Client-side Storage** - localStorage for immediate data persistence and offline capability
- **Odoo ERP Integration** - Custom REST API module for HR employee management
- **XML-RPC Protocol** - Communication layer with Odoo backend for staff verification
- **API Routes** - Next.js API routes for data processing and external service communication

**Authentication Flow**: 
- **Staff Authentication**: Predefined credentials (File ID/Password) with secure server-side session management
- **Admin Authentication**: Environment-protected password with HTTP-only cookie sessions
- **Role-based Access Control**: Server-side enforcement ensuring staff see only assigned project data
- **Odoo Integration**: Employee lookup through Odoo's HR module for additional staff verification

### Data Storage Solutions
**Primary Storage**: Supabase PostgreSQL database for persistent storage of all entries and assignments
**Projects Storage**: JSON file (`data/all_real_projects.json`) containing all 245 real-world projects
**Session Management**: HTTP-only cookies with secure server-side session validation
**External Database**: Odoo ERP system for employee master data
**Image Handling**: Base64 encoding for profile photos and captured images
**Backup Storage**: Browser localStorage for offline capability and legacy support

The system uses a schema-based approach with TypeScript interfaces for type safety across all data operations.

**Supabase Integration** (Updated: October 2, 2025):
- **Database**: PostgreSQL database hosted on Supabase for persistent data storage
- **Tables**: 
  - `entries` - Stores all visitor/staff/contractor entry records with timestamps
  - `assignments` - Stores staff-to-project assignments
- **Authentication**: Secure API key-based authentication with Row Level Security (RLS) enabled
- **Real-time sync**: All entry and assignment data persists across server restarts

**Projects Management** (Updated: October 2, 2025):
- **Storage**: 245 projects stored in `/data/all_real_projects.json`
- **API**: Projects API reads from JSON file for fast access
- **Structure**: Each project includes id, name, description, status, priority, start date, and assignment info
- **Updates**: Project assignments saved back to JSON file when admins assign projects to staff

### Form Validation and User Input
**Validation Library**: Zod for TypeScript-first schema validation
**Form Management**: React Hook Form for performant form handling
**Input Components**: Custom form components for each visitor category with category-specific validation rules

### Real-time Features
**Time Tracking**: Live duration calculation for active entries
**Status Management**: Real-time entry/exit status updates
**Overtime Detection**: Automatic flagging of entries exceeding 8-hour duration

## External Dependencies

### Core Framework Dependencies
- **Next.js 14.2.16** - React framework with App Router
- **React 19** - Frontend library with concurrent features
- **TypeScript 5** - Type safety and development tooling

### UI and Styling
- **Tailwind CSS** - Utility-first CSS framework for styling
- **shadcn/ui** - Component library built on Radix UI
- **Radix UI** - Accessible, unstyled UI primitives (25+ components)
- **Lucide React** - Icon library for consistent iconography
- **Geist Font** - Typography system for modern aesthetics

### Data Visualization
- **Recharts 2.15.4** - Charts and graphs for dashboard analytics

### External Services
- **Supabase** - PostgreSQL database for persistent data storage
  - Entry records storage with full-text search capabilities
  - Staff assignment management with real-time updates
  - Row Level Security (RLS) for data protection
- **Odoo ERP System** - HR employee management and master data
  - Custom REST API module (`hr_employee_rest_api`)
  - XML-RPC protocol for authentication
  - Employee search and data retrieval endpoints
- **Vercel** - Hosting platform with environment variable management
- **Vercel Analytics** - Usage tracking and performance monitoring

### Development Tools
- **React Hook Form** - Form state management and validation
- **Zod** - Runtime type checking and validation
- **date-fns** - Date manipulation and formatting utilities

### CORS Configuration
The system is configured to allow cross-origin requests from:
- `https://rccsecurity.vercel.app` (production)
- `http://localhost:3000` (development)

### Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous/public API key
- `ODOO_URL` - Odoo server URL
- `ODOO_DB` - Odoo database name
- `ODOO_USERNAME` - Odoo user credentials
- `ODOO_PASSWORD` - Odoo authentication

### Replit Environment Setup (Updated: September 29, 2025)
The application has been successfully configured for the Replit environment:

**Development Workflow**: 
- Configured frontend server workflow running on port 5000 with `0.0.0.0` host binding
- Next.js development server configured with proper proxy/iframe support for Replit preview

**Next.js Configuration**: 
- Added X-Frame-Options header for iframe compatibility
- Disabled image optimization for Replit environment
- TypeScript and ESLint build error handling configured
- Development server properly binds to all interfaces (0.0.0.0:5000)

**Deployment Configuration**:
- Target: Autoscale (suitable for stateless web application)
- Build command: `npm run build`
- Start command: `npm start`

**Application Status**: ✅ Fully functional and ready for use
- All UI components render correctly
- Real-time features working (live clock, entry tracking)
- Admin dashboard accessible and fully operational with password protection
- All category entry forms operational
- Records management system functional with Supabase persistent storage
- Role-based access control implemented (staff see only assigned project, admin sees all)
- Staff authentication system with predefined credentials operational
- Project assignment functionality allowing admin to assign projects to staff
- All Records page working correctly with Supabase persistence and project filtering
- Server-side authorization protecting admin endpoints (September 29, 2025)
- Implemented secure staff authentication with constant-time password comparison (September 29, 2025)
- Added comprehensive role-based data access control (September 29, 2025)
- **Supabase Database Integration** (October 2, 2025):
  - Persistent storage for all entry records and staff assignments
  - Automatic synchronization across all sessions
  - Database schema files provided for easy setup
  - Database health check API available at `/api/db-setup`