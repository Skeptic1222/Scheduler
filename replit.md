# Hospital Scheduler - FCFS Distribution System

## Overview

This is a full-stack hospital shift scheduling application built with a React frontend and Express backend. The system implements a First Come First Served (FCFS) queue mechanism for distributing hospital shifts fairly among staff members. It features real-time updates via WebSockets, comprehensive role-based access control, and HIPAA-compliant audit logging.

The application serves healthcare institutions that need to manage shift assignments efficiently while ensuring fair distribution based on seniority, skills, and availability. Staff can view available shifts, join queues, and receive real-time notifications when shifts become available.

## User Preferences

Preferred communication style: Simple, everyday language.

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