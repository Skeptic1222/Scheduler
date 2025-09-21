# Hospital Scheduler - Windows Deployment Guide

## Quick Start

1. **Run the deployment script:**
   ```powershell
   .\deployment\deploy-hospital-scheduler.ps1 -FixIIS -CleanInstall
   ```

2. **Set up database:**
   ```sql
   CREATE DATABASE hospital_scheduler;
   CREATE USER hospital_scheduler_user WITH PASSWORD 'your-secure-password';
   GRANT ALL PRIVILEGES ON DATABASE hospital_scheduler TO hospital_scheduler_user;
   ```

3. **Configure environment variables:**
   ```cmd
   set DB_PASSWORD=your-database-password
   set SESSION_SECRET=your-64-character-random-string
   set GOOGLE_CLIENT_ID=your-google-oauth-client-id
   set GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
   ```

4. **Install as Windows service:**
   ```cmd
   C:\apps\hospital-scheduler\install-service.bat
   ```

## Files Created

- `deploy-hospital-scheduler.ps1` - Main deployment script
- `install-service.bat` - Windows service installation (generated at install path)
- `start-scheduler.bat` - Quick start script
- `test-deployment.ps1` - Test deployment
- `web.config` - IIS reverse proxy configuration

## Deployment Architecture

```
C:\inetpub\wwwroot\scheduler\     (IIS webroot - static files only)
├── index.html
├── assets\
└── web.config

C:\apps\hospital-scheduler\       (Node.js application - secure location)
├── index.js                     (Built server)
├── wrapper.cjs                  (CommonJS wrapper)
├── minimal-server.cjs           (Fallback server)
├── node_modules\
└── logs\
```

## Security Features

- ✅ Node.js application runs outside IIS webroot
- ✅ Static files served directly by IIS
- ✅ API requests reverse-proxied to Node.js
- ✅ WebSocket support for real-time features
- ✅ Security headers configured
- ✅ Sensitive files hidden from web access

## Troubleshooting

**Server won't start:**
1. Check Node.js version: `node --version` (requires v20+)
2. Test minimal server: `cd C:\apps\hospital-scheduler && node minimal-server.cjs`
3. Check logs: `type C:\apps\hospital-scheduler\logs\service-output.log`

**Database connection issues:**
1. Verify PostgreSQL is running: `psql -h localhost -U hospital_scheduler_user -d hospital_scheduler`
2. Check environment variables are set
3. Run schema migration: `npm run db:push`

**IIS proxy issues:**
1. Verify URL Rewrite module is installed
2. Check Application Request Routing (ARR) is enabled
3. Verify Node.js service is running on port 5000