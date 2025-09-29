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

**Authentication Flow**: Staff lookup uses employee ID verification through Odoo's HR module, with fallback to demo data for development.

### Data Storage Solutions
**Primary Storage**: Browser localStorage for entry records and session data
**External Database**: Odoo ERP system for employee master data
**Image Handling**: Base64 encoding for profile photos and captured images

The system uses a schema-based approach with TypeScript interfaces for type safety across all data operations.

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
- Records management system functional
- All Records page working correctly with localStorage persistence
- Fixed infinite loop issue in AllRecordsView component (September 29, 2025)
- Added secure admin authentication with environment-protected password (September 29, 2025)