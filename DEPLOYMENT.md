# Deployment Guide - Hospital Shift Scheduler

This guide provides comprehensive instructions for deploying the Hospital Shift Scheduler application from scratch.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Installation Steps](#installation-steps)
5. [Configuration](#configuration)
6. [Running the Application](#running-the-application)
7. [Production Deployment](#production-deployment)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software
- **Node.js**: Version 18.0 or higher
- **npm**: Version 9.0 or higher
- **Git**: For cloning the repository
- **PostgreSQL**: Version 14+ (or Neon serverless account)

### Optional (for production)
- **Google Cloud Console Account**: For OAuth setup
- **Domain Name**: For production deployment
- **SSL Certificate**: For HTTPS (auto-handled on most platforms)

## Environment Setup

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd hospital-scheduler
```

### 2. Create Environment Variables

Create a `.env` file in the root directory:

```bash
# Database Configuration (PostgreSQL)
DATABASE_URL="postgresql://username:password@localhost:5432/hospital_scheduler"
PGHOST="localhost"
PGUSER="your_db_user"
PGPASSWORD="your_db_password"
PGDATABASE="hospital_scheduler"
PGPORT="5432"

# Session Configuration
SESSION_SECRET="generate-a-secure-random-string-here"
NODE_ENV="development"

# Google OAuth (Optional for development)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Application Settings
PORT=5000
VITE_API_URL="http://localhost:5000"
```

#### Generating Secure Secrets

For `SESSION_SECRET`, generate a secure random string:

```bash
# On Linux/Mac
openssl rand -hex 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Google OAuth Setup (Optional for Development)

For production or if you want to use Google authentication:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Choose "Web application"
6. Add authorized redirect URIs:
   - Development: `http://localhost:5000/api/auth/google/callback`
   - Production: `https://yourdomain.com/api/auth/google/callback`
7. Copy the Client ID and Client Secret to your `.env` file

**Note**: For development, you can use the "Login as Development Admin" button which bypasses OAuth.

## Database Setup

### Option 1: Local PostgreSQL

1. **Install PostgreSQL**:
   ```bash
   # Ubuntu/Debian
   sudo apt-get install postgresql postgresql-contrib
   
   # macOS with Homebrew
   brew install postgresql
   brew services start postgresql
   
   # Windows
   # Download installer from https://www.postgresql.org/download/windows/
   ```

2. **Create Database**:
   ```bash
   # Access PostgreSQL
   sudo -u postgres psql
   
   # Create database and user
   CREATE DATABASE hospital_scheduler;
   CREATE USER your_username WITH ENCRYPTED PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE hospital_scheduler TO your_username;
   \q
   ```

3. **Update DATABASE_URL** in `.env`:
   ```
   DATABASE_URL="postgresql://your_username:your_password@localhost:5432/hospital_scheduler"
   ```

### Option 2: Neon Serverless PostgreSQL (Recommended)

1. **Create Neon Account**:
   - Go to [Neon.tech](https://neon.tech)
   - Sign up for free account

2. **Create Database**:
   - Click "Create Database"
   - Select region closest to your users
   - Copy the connection string

3. **Update `.env`**:
   ```
   DATABASE_URL="your-neon-connection-string"
   ```

### Option 3: Using Docker

1. **Create docker-compose.yml**:
   ```yaml
   version: '3.8'
   services:
     postgres:
       image: postgres:14
       environment:
         POSTGRES_DB: hospital_scheduler
         POSTGRES_USER: postgres
         POSTGRES_PASSWORD: postgres
       ports:
         - "5432:5432"
       volumes:
         - postgres_data:/var/lib/postgresql/data
   
   volumes:
     postgres_data:
   ```

2. **Start PostgreSQL**:
   ```bash
   docker-compose up -d
   ```

## Installation Steps

### 1. Install Dependencies

```bash
# Install all dependencies
npm install
```

### 2. Initialize Database Schema

```bash
# Push the database schema
npm run db:push

# If you encounter issues, force push
npm run db:push -- --force
```

### 3. Seed Initial Data (Optional)

Create a file `seed.ts` in the project root:

```typescript
import { db } from './server/db';
import { departments } from './shared/schema';

async function seed() {
  // Create initial departments
  await db.insert(departments).values([
    { name: 'Emergency', description: 'Emergency Department' },
    { name: 'ICU', description: 'Intensive Care Unit' },
    { name: 'Surgery', description: 'Surgical Department' },
    { name: 'Pediatrics', description: 'Children\'s Ward' },
    { name: 'Cardiology', description: 'Heart and Vascular' }
  ]);
  
  console.log('Database seeded successfully!');
  process.exit(0);
}

seed().catch(console.error);
```

Run the seed:
```bash
npx tsx seed.ts
```

### 4. Verify Database Connection

```bash
# Open Drizzle Studio to inspect database
npm run db:studio
```

## Configuration

### Development Configuration

The application works out of the box for development with these features:

1. **Development Admin Access**: Use "Login as Development Admin" button
   - Email: admin@hospital.dev
   - Role: Admin
   - Token: dev-token

2. **Hot Reload**: Frontend and backend automatically reload on changes

3. **Debug Mode**: Detailed error messages and logging

### Production Configuration

For production deployment, ensure:

1. **Set NODE_ENV**:
   ```bash
   NODE_ENV=production
   ```

2. **Configure HTTPS**: Required for Google OAuth
   
3. **Set Secure Headers**:
   - Already configured via Helmet middleware

4. **Database Connection Pooling**:
   - Automatically handled by Neon
   - For local PostgreSQL, consider using pgBouncer

## Running the Application

### Development Mode

```bash
# Start development server with hot reload
npm run dev

# Application will be available at:
# http://localhost:5000
```

### Production Mode

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Using PM2 (Process Manager)

```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start npm --name "hospital-scheduler" -- start

# Save PM2 configuration
pm2 save
pm2 startup
```

## Production Deployment

### Deploy to Vercel

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

3. **Set Environment Variables**:
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Add all variables from `.env`

### Deploy to Railway

1. **Connect GitHub Repository**:
   - Go to [Railway.app](https://railway.app)
   - Connect your GitHub repository

2. **Add PostgreSQL**:
   - Add PostgreSQL service
   - Railway provides DATABASE_URL automatically

3. **Set Environment Variables**:
   - Add remaining variables in Railway dashboard

### Deploy to Heroku

1. **Install Heroku CLI**:
   ```bash
   # Follow instructions at https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Create Heroku App**:
   ```bash
   heroku create your-app-name
   heroku addons:create heroku-postgresql:mini
   ```

3. **Deploy**:
   ```bash
   git push heroku main
   ```

4. **Set Environment Variables**:
   ```bash
   heroku config:set SESSION_SECRET="your-secret"
   heroku config:set GOOGLE_CLIENT_ID="your-client-id"
   heroku config:set GOOGLE_CLIENT_SECRET="your-client-secret"
   ```

### Deploy to AWS/GCP/Azure

For cloud platform deployments, consider using:
- **AWS**: Elastic Beanstalk or ECS
- **GCP**: App Engine or Cloud Run
- **Azure**: App Service

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed

**Error**: `ECONNREFUSED` or `connection refused`

**Solution**:
- Check PostgreSQL is running: `sudo service postgresql status`
- Verify DATABASE_URL is correct
- Check firewall rules allow port 5432

#### 2. Migration Errors

**Error**: `column "id" cannot be cast automatically to type uuid`

**Solution**:
```bash
# Force push schema (development only!)
npm run db:push -- --force
```

#### 3. Google OAuth Not Working

**Error**: `redirect_uri_mismatch`

**Solution**:
- Verify redirect URI in Google Console matches your domain
- Include both http://localhost:5000 and your production URL
- Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set

#### 4. WebSocket Connection Failed

**Error**: `WebSocket connection failed`

**Solution**:
- Ensure your reverse proxy (nginx/Apache) supports WebSocket
- For nginx, add:
  ```nginx
  location /ws {
    proxy_pass http://localhost:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
  ```

#### 5. Session Not Persisting

**Error**: Users getting logged out

**Solution**:
- Verify SESSION_SECRET is set and consistent
- Check cookie settings allow your domain
- For production, ensure secure cookies over HTTPS

### Debug Commands

```bash
# Check Node version
node --version

# Check npm version
npm --version

# Test database connection
npx tsx -e "
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect().then(() => {
  console.log('Database connected successfully');
  client.end();
}).catch(console.error);
"

# View application logs
npm run dev 2>&1 | tee app.log

# Check port usage
lsof -i :5000  # macOS/Linux
netstat -an | findstr :5000  # Windows
```

## Security Checklist

Before going to production:

- [ ] Change default development credentials
- [ ] Set strong SESSION_SECRET
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable security headers (Helmet)
- [ ] Remove development login button
- [ ] Set up proper logging
- [ ] Configure backup strategy
- [ ] Test HIPAA compliance features
- [ ] Review and test role-based access
- [ ] Set up monitoring (e.g., Sentry)

## Maintenance

### Database Backup

```bash
# Backup database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore database
psql $DATABASE_URL < backup_20240101.sql
```

### Update Dependencies

```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Update to latest major versions (careful!)
npm upgrade
```

### Monitor Application

Consider using:
- **Logging**: Winston, Pino
- **Monitoring**: New Relic, DataDog
- **Error Tracking**: Sentry, Rollbar
- **Uptime**: UptimeRobot, Pingdom

## Support

For issues or questions:
1. Check the [README.md](README.md) for feature documentation
2. Review this deployment guide
3. Open an issue on GitHub
4. Check application logs for detailed error messages

## Additional Resources

- [Node.js Documentation](https://nodejs.org/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [React Documentation](https://react.dev/)
- [Express.js Guide](https://expressjs.com/)