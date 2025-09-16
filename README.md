# Hospital Shift Scheduler - FCFS Distribution System

A comprehensive hospital staff scheduling application with First-Come-First-Served (FCFS) queue distribution, real-time updates, and HIPAA-compliant audit logging. Built with React, Node.js, and PostgreSQL.

## 🌟 Features

### Core Functionality

#### 📅 **Shift Management**
- Create, view, and edit shifts with detailed requirements
- Specify required skills and minimum experience levels
- Department-based shift assignment
- Real-time shift status tracking (available, in-queue, assigned, completed)
- Supervisor and admin role-based management

#### 👥 **Staff Management**
- Complete staff directory with role assignments
- Department assignments for shift eligibility
- Skills and experience tracking
- Role hierarchy: Admin, Supervisor, Staff
- Staff profile editing with permission controls

#### 🏥 **Department Management**
- Create and manage hospital departments
- Assign staff to departments
- Department-based shift categorization
- Admin-only department editing

#### 🚨 **On-Call Schedule Management**
- Schedule on-call staff rotations
- Real-time on-call status display
- Emergency paging capabilities
- Shift type classification (Regular, Emergency, Special)
- Visual timeline of upcoming on-call schedules

#### 🔄 **FCFS Queue System**
- Fair shift distribution based on priority scoring
- Automatic queue position assignment
- Response deadline tracking
- Accept/decline functionality
- Queue status monitoring

#### 📊 **Dashboard**
- System health monitoring
- Active shift overview
- Real-time database status
- WebSocket connection status
- FCFS queue depth tracking

### Technical Features

#### 🔒 **Security & Compliance**
- Google OAuth authentication
- Role-based access control (RBAC)
- HIPAA-compliant audit logging
- PHI/PII data redaction
- Session management with secure cookies
- Rate limiting for API protection

#### ⚡ **Real-Time Updates**
- WebSocket-based live notifications
- Instant shift assignment updates
- Real-time queue position changes
- Connected client monitoring
- Automatic reconnection handling

#### 📱 **Mobile Responsive Design**
- Touch-optimized interface
- Responsive layouts for all screen sizes
- Mobile-friendly navigation
- Accessible form controls

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and builds
- **TanStack Query** for server state management
- **Wouter** for lightweight routing
- **Tailwind CSS** for styling
- **Shadcn/UI** components (Radix UI based)
- **React Hook Form** with Zod validation

### Backend
- **Node.js** with Express.js
- **TypeScript** with ES modules
- **PostgreSQL** database (Neon serverless)
- **Drizzle ORM** for type-safe database operations
- **WebSocket** for real-time communication
- **Express Session** with PostgreSQL store
- **Google OAuth** for authentication

## 📦 Project Structure

```
hospital-scheduler/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── lib/          # Utilities and libraries
│   │   ├── hooks/        # Custom React hooks
│   │   └── App.tsx       # Main application component
│   └── index.html
├── server/                # Backend Node.js application
│   ├── db/               # Database configuration
│   ├── routes.ts         # API endpoints
│   ├── storage.ts        # Database operations
│   ├── index.ts          # Server entry point
│   └── vite.ts           # Vite integration
├── shared/               # Shared types and schemas
│   └── schema.ts         # Database schema definitions
└── package.json          # Dependencies and scripts
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (or Neon account)
- Google OAuth credentials (for production)

### Installation

1. Clone the repository:
```bash
git clone <your-repository-url>
cd hospital-scheduler
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (see DEPLOYMENT.md for details)

4. Run database migrations:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## 📖 Documentation

- [DEPLOYMENT.md](DEPLOYMENT.md) - Detailed deployment and setup instructions
- [API Documentation](#api-endpoints) - API endpoint reference
- [Database Schema](#database-schema) - Database structure

## 🔑 Default Development Access

For development, you can use the "Login as Development Admin" button which bypasses Google OAuth and logs you in as:
- Email: admin@hospital.dev
- Role: Admin
- Full system access

## 📡 API Endpoints

### Authentication
- `POST /api/auth/google` - Google OAuth login
- `POST /api/auth/verify` - Verify authentication token
- `POST /api/auth/logout` - Logout user

### Staff Management
- `GET /api/users` - Get all users
- `POST /api/users` - Create new user (Admin only)
- `PUT /api/users/:id` - Update user (Admin only)

### Department Management
- `GET /api/departments` - Get all departments
- `POST /api/departments` - Create department (Admin only)
- `PUT /api/departments/:id` - Update department (Admin only)

### Shift Management
- `GET /api/shifts` - Get all shifts
- `POST /api/shifts` - Create shift (Admin/Supervisor)
- `PUT /api/shifts/:id` - Update shift (Admin/Supervisor)
- `POST /api/shifts/:id/queue` - Join shift queue

### On-Call Management
- `GET /api/on-call` - Get on-call schedules
- `POST /api/on-call` - Create on-call schedule (Admin/Supervisor)
- `PUT /api/on-call/:id` - Update on-call schedule (Admin/Supervisor)

### FCFS Queue
- `GET /api/fcfs-queue` - Get queue entries
- `POST /api/fcfs-queue/:id/respond` - Accept/decline queue offer

### Notifications
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read

## 💾 Database Schema

### Core Tables
- **users** - Staff members with roles and departments
- **departments** - Hospital departments
- **shifts** - Available shifts and on-call schedules
- **fcfs_queue** - Queue entries for shift assignment
- **notifications** - User notifications
- **audit_logs** - HIPAA-compliant activity logs

## 🔐 Security Features

- **Authentication**: Google OAuth with JWT-style token management
- **Authorization**: Role-based access control (Admin > Supervisor > Staff)
- **Data Protection**: PHI/PII redaction in logs
- **Session Security**: HTTP-only cookies, secure sessions
- **Rate Limiting**: API endpoint protection
- **WebSocket Security**: Authenticated connections only

## 🚦 Development

### Running Tests
```bash
npm test
```

### Database Management
```bash
npm run db:push      # Push schema changes
npm run db:studio    # Open Drizzle Studio
```

### Building for Production
```bash
npm run build
npm start
```

## 📱 Mobile Support

The application is fully responsive and works on:
- iOS Safari
- Android Chrome
- Tablet devices
- Desktop browsers

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software for hospital use.

## 🆘 Support

For issues or questions, please open an issue in the GitHub repository.

## 🎯 Roadmap

### Planned Features
- Shift swapping between staff
- Automated scheduling algorithms
- SMS/Email notifications
- Advanced reporting and analytics
- Calendar integration
- Payroll system integration
- Multi-hospital support

## 🏗 Architecture

The application follows a modern full-stack architecture:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Browser    │────▶│   Express    │────▶│  PostgreSQL  │
│   (React)    │◀────│   Server     │◀────│   Database   │
└──────────────┘     └──────────────┘     └──────────────┘
       ▲                     ▲                      
       │                     │                      
       └─────WebSocket───────┘                      
         (Real-time updates)                        
```

## 🌐 Environment Support

- **Development**: Local development with hot-reload
- **Staging**: Test environment with production-like setup
- **Production**: Full production deployment with all security features

## 🔄 Version History

- **v1.0.0** - Initial release with core scheduling features
- **v1.1.0** - Added on-call management and real-time updates
- **v1.2.0** - Enhanced security and HIPAA compliance

---

Built with ❤️ for healthcare professionals