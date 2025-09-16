# Hospital Scheduler - FCFS Distribution System

## Overview

A comprehensive hospital shift scheduling application with First Come First Served (FCFS) queue distribution, built for healthcare institutions requiring efficient, fair, and compliant staff scheduling. The system features real-time updates, role-based access control, and HIPAA-compliant audit logging.

**Key Features:**
- 🏥 Complete staff management with department assignments and editing
- 📅 Advanced shift scheduling with skills and experience matching  
- 🔄 Real-time WebSocket updates for instant notifications
- 🔒 Role-based access control (Admin/Supervisor/Staff)
- 📱 Fully responsive mobile-first design
- 🚨 On-call staff tracking, scheduling, and emergency paging
- 📊 Live dashboard with system health monitoring
- 🔐 HIPAA-compliant audit logging with PHI/PII protection
- ✏️ Full CRUD operations for all entities with permission controls

## User Preferences

Preferred communication style: Simple, everyday language.

## Current Functionality

### Staff Management
- **Create New Staff**: Admins can add new staff members with name, email, role, department, and experience
- **Edit Staff Information**: Update staff details including role assignments and department transfers  
- **View Staff Directory**: Browse all hospital staff with filtering by department and role
- **Department Assignment**: Assign staff to specific departments for shift eligibility

### Shift Scheduling
- **Create Shifts**: Supervisors and admins can create shifts with requirements:
  - Department assignment
  - Required skills and minimum experience
  - Start and end times
  - Detailed descriptions
- **FCFS Queue Distribution**: Fair shift assignment based on priority scoring
- **View Available Shifts**: Staff can browse all available shifts
- **Shift Status Tracking**: Real-time status updates (available, assigned, completed)

### On-Call Management  
- **Current On-Call View**: See who's currently on call with contact information
- **Emergency Paging**: Quick access to page on-call staff
- **Department Coverage**: Track on-call coverage by department
- **Shift Handoffs**: Smooth transitions between on-call periods

### Dashboard & Monitoring
- **System Health**: Real-time database status and connection monitoring
- **Active Shifts**: Current shift assignments and staff coverage
- **FCFS Queue Status**: Pending assignments and queue depth
- **WebSocket Connections**: Real-time update status

### Security & Compliance
- **Google OAuth**: Secure authentication with automatic user creation
- **Role-Based Access**: Three-tier permission system (Admin/Supervisor/Staff)
- **HIPAA Audit Logs**: Compliant activity tracking with PHI/PII redaction
- **Rate Limiting**: Protection against brute force attacks

## Planned Functionality

### Enhanced Scheduling Features
- **Shift Swapping**: Allow staff to request and approve shift swaps
- **Recurring Shifts**: Template-based scheduling for regular patterns
- **Vacation/Leave Management**: Integration with time-off requests
- **Automated Notifications**: SMS/Email alerts for shift reminders
- **Conflict Detection**: Prevent double-booking and overtime violations

### Advanced Queue Management
- **Priority Overrides**: Emergency staffing capabilities
- **Skills Matching Algorithm**: Intelligent staff-to-shift matching
- **Fairness Analytics**: Track and ensure equitable distribution
- **Queue Position Visibility**: Staff can see their position in FCFS queue

### Reporting & Analytics
- **Shift Coverage Reports**: Historical coverage analysis
- **Staff Utilization Metrics**: Hours worked, overtime tracking
- **Department Performance**: Shift fulfillment rates by department
- **Compliance Reports**: HIPAA audit trail exports
- **Custom Report Builder**: Create tailored reports for administration

### Mobile Enhancements
- **Progressive Web App**: Offline capability and app-like experience
- **Push Notifications**: Native mobile notifications for shift updates
- **Touch-Optimized UI**: Enhanced mobile interaction patterns
- **Biometric Authentication**: Face ID/Touch ID support

### Integration Capabilities
- **HR System Integration**: Sync with existing HR platforms
- **Payroll Export**: Automated timesheet generation
- **Calendar Sync**: Integration with Google/Outlook calendars
- **Third-Party Messaging**: Slack/Teams notifications
- **API Access**: RESTful API for custom integrations

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management and caching
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming
- **Form Handling**: React Hook Form with Zod schema validation
- **Real-time**: Custom WebSocket manager for live updates and notifications

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints with structured error handling
- **Authentication**: Google OAuth integration with JWT-like token verification
- **Session Management**: Express sessions with PostgreSQL store
- **Real-time**: WebSocket server for push notifications and live updates
- **Middleware**: Custom logging, authentication, and error handling middleware

### Database Design
- **ORM**: Drizzle ORM with PostgreSQL dialect for type-safe database operations
- **Schema**: Relational design with users, departments, shifts, FCFS queue, notifications, and audit logs
- **Migrations**: Drizzle Kit for database schema management and migrations
- **Connection**: Neon serverless PostgreSQL with connection pooling

### Key Data Models
- **Users**: Staff profiles with roles (admin/supervisor/staff), skills, and seniority
- **Departments**: Organizational units for shift categorization
- **Shifts**: Available work periods with requirements and status tracking
- **FCFS Queue**: Priority-based queue entries with response deadlines
- **Audit Logs**: HIPAA-compliant activity tracking for compliance

### Authentication & Authorization
- **OAuth Provider**: Google OAuth for secure user authentication
- **Role-Based Access**: Three-tier permission system (admin, supervisor, staff)
- **Token Management**: JWT-style tokens stored in localStorage with server verification
- **Session Security**: HTTP-only cookies for session management

### Real-time Communication
- **WebSocket Implementation**: Custom socket manager with automatic reconnection
- **Event Types**: Shift updates, queue notifications, and system alerts
- **Connection Management**: Token-based authentication for WebSocket connections
- **Offline Handling**: Graceful degradation when WebSocket is unavailable

### Development Tools
- **Build System**: Vite for fast development and optimized production builds
- **Type Checking**: TypeScript with strict configuration across frontend and backend
- **Code Quality**: ESLint and Prettier integration (configured via components.json)
- **Development Experience**: Hot module replacement and runtime error overlays

## Recent Updates

### Latest Features (Current Session)
- ✅ Fixed navigation highlighting for Create Shifts button
- ✅ Added comprehensive Staff Management with CRUD operations
- ✅ Enhanced mobile responsiveness across all pages
- ✅ Implemented role-based access for staff creation/editing
- ✅ Added department assignment capabilities for staff
- ✅ Improved data handling for consistent API responses

### Previous Updates
- Added On-Call section with current staff tracking
- Implemented real-time dashboard with active shifts view
- Fixed admin panel integration issues
- Standardized API response format across endpoints
- Added development admin user for testing

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting with automatic scaling
- **Connection Pooling**: @neondatabase/serverless for efficient database connections

### Authentication Services  
- **Google OAuth**: OAuth 2.0 integration for user authentication and profile management
- **Token Verification**: Google's tokeninfo endpoint for secure token validation

### UI Component Library
- **Radix UI**: Comprehensive set of accessible, unstyled UI primitives
- **Shadcn/ui**: Pre-styled components built on Radix with Tailwind CSS
- **Lucide Icons**: Icon library for consistent visual elements

### Development & Hosting
- **Replit Integration**: Native support for Replit development environment
- **Vite Plugins**: Replit-specific plugins for cartographer and dev banner
- **WebSocket Support**: Native WebSocket implementation with 'ws' library fallback

### Form & Validation
- **React Hook Form**: Performant form library with minimal re-renders
- **Zod**: TypeScript-first schema validation for forms and API endpoints
- **Hookform Resolvers**: Integration layer between React Hook Form and Zod

### Real-time Features
- **WebSocket**: Native browser WebSocket API with Node.js 'ws' library
- **TanStack Query**: Intelligent caching and synchronization with real-time updates
- **Event Management**: Custom event system for coordinating real-time features