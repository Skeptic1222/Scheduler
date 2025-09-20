# Hospital Scheduler - Windows Deployment Guide

This guide provides step-by-step instructions for deploying the Hospital Scheduler application to Windows Server 2022 with IIS and PostgreSQL, specifically addressing the issues identified in the deployment request document.

## Overview

This deployment package addresses the critical issues identified in the deployment request:
- ✅ **npm dependency installation problems (927 vs 760 packages)**
- ✅ **Database abstraction for PostgreSQL support**
- ✅ **IIS configuration with proper Node.js hosting**
- ✅ **Windows-specific build scripts and verification**
- ✅ **Environment configuration templates**

## Prerequisites

### Windows Server Requirements
- Windows Server 2022 (or Windows 10/11 for development)
- Administrator access for installation
- Internet connectivity for downloading dependencies

### Software Requirements
1. **Node.js v20.x LTS**
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **PostgreSQL 16+**
   - Download from: https://www.postgresql.org/download/windows/
   - Install with default settings including pgAdmin
   - Ensure PostgreSQL service starts automatically

3. **IIS with Required Modules**
   - Enable IIS via Windows Features or Server Manager
   - Install URL Rewrite Module: https://www.iis.net/downloads/microsoft/url-rewrite
   - Install Application Request Routing (ARR): https://www.iis.net/downloads/microsoft/application-request-routing

## Deployment Steps

### Step 1: Build the Application

1. **Navigate to the project directory**
   ```cmd
   cd C:\path\to\hospital-scheduler
   ```

2. **Run the Windows build script**
   ```cmd
   deployment\build-windows.bat
   ```

   This script automatically handles:
   - Cleaning previous installations
   - Installing dependencies individually to avoid the 927 vs 760 package issue
   - Building the application
   - Generating IIS configuration
   - Verifying the build

3. **Verify the build**
   ```cmd
   deployment\verify-build-windows.bat
   ```

### Step 2: Database Setup

1. **Create PostgreSQL database and user**
   - Open pgAdmin or use psql command line
   - Create a new database: `hospital_scheduler`
   - Create a new user: `hospital_scheduler_user`
   - Grant all privileges on the database to the user

   ```sql
   -- In psql or pgAdmin SQL editor
   CREATE DATABASE hospital_scheduler;
   CREATE USER hospital_scheduler_user WITH PASSWORD 'your-secure-password';
   GRANT ALL PRIVILEGES ON DATABASE hospital_scheduler TO hospital_scheduler_user;
   ```

2. **Initialize database schema**
   ```cmd
   REM Use Drizzle to create the schema
   npm run db:push
   ```

### Step 3: Deploy Application Files

1. **Create IIS application directory**
   ```cmd
   mkdir C:\inetpub\wwwroot\scheduler
   ```

2. **Copy only production files to IIS webroot (SECURITY CRITICAL)**
   ```cmd
   REM Copy only the built frontend and configuration
   xcopy /E /I /Y dist\public\* C:\inetpub\wwwroot\scheduler\
   copy deployment\web.config C:\inetpub\wwwroot\scheduler\
   
   REM Create app directory outside webroot for Node.js service
   mkdir C:\apps\hospital-scheduler
   xcopy /E /I /Y dist\*.* C:\apps\hospital-scheduler\
   xcopy /E /I /Y node_modules C:\apps\hospital-scheduler\node_modules\
   ```

3. **Verify secure deployment**
   ```cmd
   REM Webroot should only contain: static files + web.config
   dir C:\inetpub\wwwroot\scheduler
   
   REM Node.js app runs from secure location outside webroot
   dir C:\apps\hospital-scheduler
   ```

4. **Configure environment variables (SECURE METHOD)**
   - **DO NOT** copy .env to the IIS webroot for security reasons
   - Instead, configure environment variables in the Windows service (Step 5)
   - Or use IIS Application Settings (less preferred)

### Step 4: Configure IIS with ARR Reverse Proxy

1. **Install Required IIS Features**
   ```cmd
   # Enable IIS features via PowerShell (run as Administrator)
   Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole
   Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpRedirection
   Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpLogging
   Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebSockets
   ```

2. **Install URL Rewrite and ARR Modules**
   - Download URL Rewrite Module: https://www.iis.net/downloads/microsoft/url-rewrite
   - Download Application Request Routing (ARR): https://www.iis.net/downloads/microsoft/application-request-routing
   - Install both modules

3. **Enable ARR Proxy**
   - Open IIS Manager as Administrator
   - Select the server node (top level)
   - Double-click "Application Request Routing Cache"
   - Click "Server Proxy Settings" in the Actions pane
   - Check "Enable proxy" and click Apply

4. **Create Application Pool**
   - Right-click Application Pools → Add Application Pool
   - Name: `HospitalSchedulerPool`
   - .NET Framework version: `No Managed Code`
   - Managed pipeline mode: `Integrated`
   - Identity: `ApplicationPoolIdentity`

5. **Create Website/Application**
   - Right-click Sites → Add Website
   - Site name: `Hospital Scheduler`
   - Application pool: `HospitalSchedulerPool`
   - Physical path: `C:\inetpub\wwwroot\scheduler`
   - Port: `80` (or your preferred port)

### Step 5: Create and Configure Windows Service

1. **Create the Node.js Windows Service**
   ```cmd
   # Run as Administrator
   deployment\create-windows-service.bat
   ```

2. **Verify the service is running**
   ```cmd
   # Check service status
   sc query HospitalScheduler
   
   # Test the Node.js application directly
   curl http://localhost:5000/health
   ```

3. **Configure service environment variables**
   ```cmd
   # Use NSSM to set environment variables
   nssm set HospitalScheduler AppEnvironmentExtra ^
     "NODE_ENV=production" ^
     "PORT=5000" ^
     "DB_TYPE=postgresql" ^
     "DB_HOST=localhost" ^
     "DB_PORT=5432" ^
     "DB_NAME=hospital_scheduler" ^
     "DB_USER=hospital_scheduler_user" ^
     "DB_PASSWORD=your-database-password" ^
     "SESSION_SECRET=your-secure-session-secret"
   
   # Restart service to apply changes
   nssm restart HospitalScheduler
   ```

### Step 6: Configure Permissions

1. **Set file permissions**
   ```cmd
   icacls "C:\inetpub\wwwroot\scheduler" /grant "IIS_IUSRS:(OI)(CI)RX" /T
   icacls "C:\inetpub\wwwroot\scheduler\logs" /grant "IIS_IUSRS:(OI)(CI)F" /T
   ```

2. **Configure SQL Server permissions**
   - Ensure the Application Pool identity has access to SQL Server
   - For Windows Authentication, add the computer account or Application Pool identity

### Step 6: Test the Deployment

1. **Start the application**
   - In IIS Manager, start the website
   - Browse to `http://localhost` (or your configured port)

2. **Run verification tests**
   ```cmd
   deployment\verify-build-windows.bat
   ```

3. **Check application logs**
   - IIS logs: `C:\inetpub\logs\LogFiles\W3SVC1\`
   - iisnode logs: `C:\inetpub\wwwroot\scheduler\iisnode\`
   - Application logs: `C:\inetpub\wwwroot\scheduler\logs\`

## Troubleshooting

### Common Issues and Solutions

#### 1. npm Dependency Issues (927 vs 760 packages)
**Problem**: npm install only installs 760 packages instead of the expected 927
**Solution**: Use the provided `build-windows.bat` script which installs critical dependencies individually

#### 2. IIS 502 Bad Gateway Error
**Problem**: Application fails to start or proxy connection fails
**Solutions**:
- Verify the Node.js Windows service is running on port 5000
- Check that ARR proxy is enabled at the server level in IIS
- Verify URL Rewrite rules are correctly configured
- Check Windows service logs for Node.js application errors

#### 3. Database Connection Errors
**Problem**: Cannot connect to SQL Server Express
**Solutions**:
- Verify SQL Server Express is running
- Check that TCP/IP is enabled in SQL Server Configuration Manager
- Ensure SQL Server Browser service is running
- Verify connection string in .env file

#### 4. Static Files Not Loading
**Problem**: CSS/JS files return 404 errors
**Solutions**:
- Verify the build completed successfully (`dist/public` exists)
- Check URL Rewrite rules in web.config
- Ensure static file permissions are correct

### Error Logs Locations

1. **IIS Access Logs**
   ```
   C:\inetpub\logs\LogFiles\W3SVC1\
   ```

2. **iisnode Logs**
   ```
   C:\inetpub\wwwroot\scheduler\iisnode\
   ```

3. **Application Logs**
   ```
   C:\inetpub\wwwroot\scheduler\logs\
   ```

4. **SQL Server Logs**
   - View in SQL Server Management Studio
   - Management → SQL Server Logs

## WSL Integration for Claude Code

If using Claude Code in Windows Subsystem for Linux (WSL):

### Accessing Files from WSL
```bash
# From WSL, access Windows deployment
cd /mnt/c/inetpub/wwwroot/scheduler

# From Windows, access WSL project
\\wsl$\Ubuntu\home\user\project
```

### Development Workflow
1. Develop and test in WSL environment
2. Use `build-windows.bat` to create Windows deployment package
3. Deploy to IIS for production

### File System Considerations
- Avoid developing directly on mounted Windows drives in WSL
- Copy files to native NTFS paths for IIS deployment
- Use proper line endings (CRLF for Windows batch files)

## Security Considerations

### Production Security Checklist
- [ ] Change default session secret in .env
- [ ] Configure proper PostgreSQL authentication
- [ ] Enable HTTPS with SSL certificates
- [ ] Configure Windows Firewall rules
- [ ] Regular security updates for all components
- [ ] Restrict file permissions to minimum required
- [ ] Enable audit logging

### Recommended Security Settings
```env
# Strong session secret (generate with: openssl rand -base64 32)
SESSION_SECRET=your-secure-random-string-here

# Enable security features
ENABLE_RATE_LIMITING=true
ENABLE_AUDIT_LOGGING=true

# Database security
DB_SSL=false
```

## Performance Optimization

### IIS Tuning
- Configure compression in web.config
- Set proper cache headers for static content
- Optimize Application Pool settings
- Monitor performance counters

### PostgreSQL Tuning
- Configure appropriate memory settings in postgresql.conf
- Set up database maintenance plans
- Monitor query performance with pg_stat_statements
- Configure backup strategies with pg_dump

## Support and Maintenance

### Regular Maintenance Tasks
1. **Weekly**
   - Check application and error logs
   - Verify database backups
   - Monitor disk space and performance

2. **Monthly**
   - Update Node.js and npm packages
   - Review security patches
   - Test backup restoration procedures

3. **Quarterly**
   - Full security review
   - Performance optimization review
   - Documentation updates

### Getting Help
- Check logs in the locations mentioned above
- Use the verification script to identify issues
- For Claude Code assistance, provide specific error messages and log excerpts

## File Structure

After deployment, your directory structure should look like:

```
C:\inetpub\wwwroot\scheduler\
├── dist/
│   ├── index.js              # Server bundle
│   └── public/               # Frontend assets
├── node_modules/             # Dependencies
├── database/                 # SQL Server scripts
├── deployment/               # Deployment tools
├── web.config               # IIS configuration
├── .env                     # Environment configuration
└── logs/                    # Application logs
```

## Conclusion

This deployment package addresses the critical issues identified in the deployment request:

1. ✅ **Resolved npm dependency installation problems** with sequential installation approach
2. ✅ **Created database abstraction layer** for SQL Server Express compatibility
3. ✅ **Provided comprehensive IIS configuration** with proper Node.js hosting
4. ✅ **Included Windows-specific build and verification scripts**
5. ✅ **Created production-ready environment configuration**

The application should now deploy successfully to Windows Server 2022 with IIS and SQL Server Express, providing a stable foundation for the Hospital Scheduler system.

For additional support or questions, refer to the troubleshooting section or check the application logs for specific error details.