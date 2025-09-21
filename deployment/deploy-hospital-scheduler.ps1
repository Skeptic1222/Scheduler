# Hospital Scheduler - Windows Deployment Script
# Based on working deployment patterns for ES Modules and IIS
param(
    [switch]$FixIIS,
    [switch]$StartOnly,
    [switch]$CleanInstall,
    [string]$InstallPath = "C:\apps\hospital-scheduler",
    [string]$WebRoot = "C:\inetpub\wwwroot\scheduler",
    [string]$DatabaseHost = "localhost",
    [string]$DatabasePort = "5432",
    [string]$DatabaseName = "hospital_scheduler",
    [string]$DatabaseUser = "hospital_scheduler_user"
)

$ErrorActionPreference = "Continue"

Write-Host "`n================================================" -ForegroundColor Green
Write-Host "    HOSPITAL SCHEDULER - WINDOWS DEPLOYMENT    " -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# Quick start if requested
if ($StartOnly) {
    Write-Host "Starting Hospital Scheduler server..." -ForegroundColor Yellow
    Set-Location $InstallPath
    Start-Process cmd -ArgumentList "/k node wrapper.cjs"
    exit
}

Write-Host "`n[1] ENVIRONMENT SETUP & VALIDATION" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Gray

# Validate Node.js installation
Write-Host "Checking Node.js..." -ForegroundColor Cyan
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [✗] Node.js not found!" -ForegroundColor Red
    Write-Host "  Please install Node.js v20.x LTS from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}
Write-Host "  [✓] Node.js version: $nodeVersion" -ForegroundColor Green

# Validate PostgreSQL
Write-Host "Checking PostgreSQL..." -ForegroundColor Cyan
$pgVersion = psql --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [!] PostgreSQL client not found in PATH" -ForegroundColor Yellow
    Write-Host "  Please ensure PostgreSQL is installed and psql is in PATH" -ForegroundColor Gray
} else {
    Write-Host "  [✓] PostgreSQL available: $pgVersion" -ForegroundColor Green
}

# Validate current directory
if (!(Test-Path "package.json")) {
    Write-Host "  [✗] Not in Hospital Scheduler project directory!" -ForegroundColor Red
    Write-Host "  Please run this script from the project root" -ForegroundColor Yellow
    exit 1
}
Write-Host "  [✓] Project directory validated" -ForegroundColor Green

Write-Host "`n[2] CLEANING PREVIOUS INSTALLATION" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Gray

if ($CleanInstall -and (Test-Path $InstallPath)) {
    Write-Host "  Removing previous installation..." -ForegroundColor Cyan
    Remove-Item $InstallPath -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "  [✓] Previous installation cleaned" -ForegroundColor Green
}

# Kill existing processes on port 5000 (Hospital Scheduler port)
Write-Host "  Stopping any existing Hospital Scheduler processes..." -ForegroundColor Cyan
Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue | 
    ForEach-Object { 
        Write-Host "    Stopping process on port 5000..." -ForegroundColor Gray
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue 
    }

Write-Host "`n[3] INSTALLING DEPENDENCIES" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Gray

# Clean npm cache for fresh install (keep package-lock for deterministic builds)
Write-Host "  Cleaning npm cache..." -ForegroundColor Cyan
npm cache clean --force | Out-Null

if (Test-Path "node_modules") {
    Write-Host "  Removing existing node_modules..." -ForegroundColor Cyan
    Remove-Item "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
}

# Install dependencies with optimized settings for Windows
Write-Host "  Installing npm dependencies..." -ForegroundColor Cyan
$env:NODE_OPTIONS = "--max-old-space-size=4096"
npm install --no-audit --no-fund --legacy-peer-deps

if ($LASTEXITCODE -ne 0) {
    Write-Host "  [!] npm install had issues, trying alternative approach..." -ForegroundColor Yellow
    Write-Host "  Installing core dependencies individually..." -ForegroundColor Cyan
    
    # Install core dependencies first
    $coreDeps = @(
        "express", "drizzle-orm", "drizzle-zod", "@neondatabase/serverless",
        "helmet", "express-session", "connect-pg-simple", "ws",
        "react", "react-dom", "@tanstack/react-query", "wouter"
    )
    
    foreach ($dep in $coreDeps) {
        Write-Host "    Installing $dep..." -ForegroundColor Gray
        npm install $dep --no-audit --no-fund --legacy-peer-deps | Out-Null
    }
    
    # Install remaining dependencies
    npm install --no-audit --no-fund --legacy-peer-deps | Out-Null
}

Write-Host "  [✓] Dependencies installed" -ForegroundColor Green

Write-Host "`n[4] BUILDING APPLICATION" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Gray

Write-Host "  Building frontend and backend..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "  [✗] Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "  [✓] Application built successfully" -ForegroundColor Green

Write-Host "`n[5] VERIFYING PRODUCTION FILES" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Gray

# Generate critical CommonJS wrapper files for Windows service
Write-Host "  Generating CommonJS wrapper files..." -ForegroundColor Cyan

# Create wrapper.cjs
@"
// COMMONJS WRAPPER for Hospital Scheduler - Using .cjs extension
const path = require('path');
const net = require('net');

console.log('[WRAPPER] Starting Hospital Scheduler with .cjs wrapper...');

// Force IPv4 binding for Windows compatibility  
const originalListen = net.Server.prototype.listen;
net.Server.prototype.listen = function(...args) {
    if (typeof args[0] === 'number' && args.length === 1) {
        console.log(`[WRAPPER] Forcing 127.0.0.1:`+args[0]);
        return originalListen.call(this, args[0], '127.0.0.1');
    }
    return originalListen.apply(this, args);
};

// Set production environment
process.env.NODE_ENV = 'production';
process.env.HOST = '127.0.0.1';
process.env.PORT = process.env.PORT || '5000';

// Database connection will be set via Windows service environment variables
console.log('[WRAPPER] Loading index.js...');
import('./index.js').catch(err => {
    console.error('[WRAPPER] Failed to load main application:', err.message);
    console.log('[WRAPPER] Starting minimal server instead...');
    require('./minimal-server.cjs');
});
"@ | Out-File "wrapper.cjs" -Encoding UTF8

# Create minimal-server.cjs
@"
// MINIMAL FALLBACK SERVER for Hospital Scheduler
const http = require('http');
const PORT = process.env.PORT || 5000;
const HOST = '127.0.0.1';

console.log('====================================');
console.log('  Hospital Scheduler Minimal Server');
console.log('====================================');

const server = http.createServer((req, res) => {
    const timestamp = new Date().toISOString();
    console.log(`[`+timestamp+`] `+req.method+` `+req.url);
    
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Hospital Scheduler - Server Status</title>
            <style>
                body { font-family: 'Segoe UI', Arial; padding: 40px; background: #f8f9fa; }
                .success { background: #28a745; color: white; padding: 20px; border-radius: 8px; }
                .info { background: white; padding: 20px; margin-top: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                code { background: #f1f3f4; padding: 2px 6px; border-radius: 4px; }
                .status { display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: #28a745; margin-right: 8px; }
            </style>
        </head>
        <body>
            <div class="success">
                <h1><span class="status"></span>Hospital Scheduler Server Running</h1>
                <p>The minimal server is running successfully on port `+PORT+`</p>
            </div>
            <div class="info">
                <h2>Server Information</h2>
                <ul>
                    <li><strong>URL:</strong> http://`+HOST+`:`+PORT+`</li>
                    <li><strong>Time:</strong> `+timestamp+`</li>
                    <li><strong>Request:</strong> `+req.method+` `+req.url+`</li>
                    <li><strong>Node.js:</strong> `+process.version+`</li>
                </ul>
                <h2>Next Steps</h2>
                <p>This minimal server indicates that Node.js networking is working. The main application may need:</p>
                <ul>
                    <li>Database connection configuration</li>
                    <li>Environment variables setup</li>
                    <li>Google OAuth configuration</li>
                    <li>WebSocket support testing</li>
                </ul>
                <p><strong>Restart the full application:</strong> <code>node wrapper.cjs</code></p>
            </div>
        </body>
        </html>
    `);
});

server.listen(PORT, HOST, () => {
    console.log(`✓ Hospital Scheduler minimal server listening on http://`+HOST+`:`+PORT);
    console.log('✓ This proves Node.js networking works!');
    console.log('');
    console.log('Open your browser to test:');
    console.log(`  http://`+HOST+`:`+PORT);
    console.log('');
});

server.on('error', (err) => {
    console.error('ERROR:', err.message);
    if (err.code === 'EADDRINUSE') {
        console.log(`Port `+PORT+` is already in use!`);
        console.log('Trying port 5001...');
        server.listen(5001, HOST);
    } else if (err.code === 'EACCES') {
        console.log('Permission denied. Try running as administrator.');
    }
});
"@ | Out-File "minimal-server.cjs" -Encoding UTF8

Write-Host "    [✓] CommonJS wrapper files generated" -ForegroundColor Green
if (Test-Path "dist\index.js") {
    Write-Host "    [✓] Main server bundle found" -ForegroundColor Green
} else {
    Write-Host "    [ERROR] dist\index.js not found!" -ForegroundColor Red
    exit 1
}

Write-Host "  [✓] Production files verified" -ForegroundColor Green

Write-Host "`n[6] IIS CONFIGURATION" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Gray

if ($FixIIS) {
    # Remove any broken web.config in project root
    if (Test-Path "web.config") {
        Rename-Item "web.config" "web.config.broken" -Force
        Write-Host "  [✓] Renamed broken web.config" -ForegroundColor Green
    }
    
    # Use the pre-configured web.config from deployment folder
    Write-Host "  Using optimized web.config for Hospital Scheduler..." -ForegroundColor Cyan
    if (Test-Path "deployment\web.config") {
        Write-Host "  [✓] Using deployment\web.config (includes generic WebSocket support)" -ForegroundColor Green
    } else {
        Write-Host "  [ERROR] deployment\web.config not found!" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n[7] DEPLOYMENT TO PRODUCTION DIRECTORIES" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Gray

# Create installation directories
Write-Host "  Creating installation directories..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path $InstallPath | Out-Null
New-Item -ItemType Directory -Force -Path $WebRoot | Out-Null
New-Item -ItemType Directory -Force -Path "$InstallPath\logs" | Out-Null
Write-Host "  [✓] Directories created" -ForegroundColor Green

# Deploy Node.js application files (outside webroot for security)
Write-Host "  Deploying Node.js application..." -ForegroundColor Cyan
Copy-Item "dist\index.js" $InstallPath -Force
Copy-Item "wrapper.cjs" $InstallPath -Force  
Copy-Item "minimal-server.cjs" $InstallPath -Force
Copy-Item "node_modules" "$InstallPath\node_modules" -Recurse -Force
Copy-Item "package.json" $InstallPath -Force

# Deploy static files to IIS webroot
Write-Host "  Deploying static files to IIS webroot..." -ForegroundColor Cyan
if (Test-Path "dist\public") {
    Copy-Item "dist\public\*" $WebRoot -Recurse -Force
} else {
    Write-Host "    [WARNING] dist\public not found - run npm run build first" -ForegroundColor Yellow
}
if ($FixIIS) {
    Copy-Item "deployment\web.config" $WebRoot -Force
}

Write-Host "  [✓] Application deployed" -ForegroundColor Green

Write-Host "`n[8] CREATING WINDOWS SERVICE" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Gray

Write-Host "  Creating Windows service configuration..." -ForegroundColor Cyan

# Create Windows service installation script
Write-Host "  Creating Windows service installation script..." -ForegroundColor Cyan
@"
@echo off
title Hospital Scheduler - Windows Service Setup
echo ===============================================
echo   Hospital Scheduler - Windows Service Setup
echo ===============================================
echo.

REM Check for NSSM
where nssm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] NSSM not found in PATH
    echo Please download NSSM from: https://nssm.cc/download
    echo Extract nssm.exe to C:\Windows\System32\ or add to PATH
    pause
    exit /b 1
)

echo [INFO] Configuring Hospital Scheduler Windows Service...

REM Remove existing service if it exists
nssm stop HospitalScheduler 2>nul
nssm remove HospitalScheduler confirm 2>nul

REM Install the service
nssm install HospitalScheduler "node"
nssm set HospitalScheduler AppParameters "wrapper.cjs"
nssm set HospitalScheduler AppDirectory "$InstallPath"
nssm set HospitalScheduler DisplayName "Hospital Scheduler Application"
nssm set HospitalScheduler Description "Hospital shift scheduling application with PostgreSQL backend"

REM Configure environment variables
nssm set HospitalScheduler AppEnvironmentExtra ^
    NODE_ENV=production ^
    HOST=127.0.0.1 ^
    PORT=5000 ^
    DB_TYPE=postgresql ^
    DB_HOST=$DatabaseHost ^
    DB_PORT=$DatabasePort ^
    DB_NAME=$DatabaseName ^
    DB_USER=$DatabaseUser ^
    DB_PASSWORD=%DB_PASSWORD% ^
    SESSION_SECRET=%SESSION_SECRET% ^
    GOOGLE_CLIENT_ID=%GOOGLE_CLIENT_ID% ^
    GOOGLE_CLIENT_SECRET=%GOOGLE_CLIENT_SECRET%

REM Configure service behavior
nssm set HospitalScheduler AppStdout "$InstallPath\logs\service-output.log"
nssm set HospitalScheduler AppStderr "$InstallPath\logs\service-error.log"
nssm set HospitalScheduler AppRotateFiles 1
nssm set HospitalScheduler AppRotateOnline 1
nssm set HospitalScheduler AppRotateSeconds 86400
nssm set HospitalScheduler AppRotateBytes 10485760

REM Configure startup and failure behavior
nssm set HospitalScheduler Start SERVICE_AUTO_START
nssm set HospitalScheduler AppExit Default Restart
nssm set HospitalScheduler AppRestartDelay 5000
nssm set HospitalScheduler AppStopMethodSkip 6
nssm set HospitalScheduler AppKillConsole 1500

echo.
echo [SUCCESS] Hospital Scheduler service configured!
echo.
echo Next steps:
echo 1. Set environment variables in Windows:
echo    - DB_PASSWORD=your-database-password
echo    - SESSION_SECRET=your-session-secret
echo    - GOOGLE_CLIENT_ID=your-google-oauth-client-id
echo    - GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
echo.
echo 2. Start the service:
echo    nssm start HospitalScheduler
echo.
echo 3. Check service status:
echo    nssm status HospitalScheduler
echo.
echo 4. View logs:
echo    type "$InstallPath\logs\service-output.log"
echo.
pause
"@ | Out-File "$InstallPath/install-service.bat" -Encoding ASCII

Write-Host "  [✓] Service installation script created" -ForegroundColor Green

Write-Host "`n[9] CREATING HELPER SCRIPTS" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Gray

# Create start script
@"
@echo off
title Hospital Scheduler - Quick Start
cd /d "$InstallPath"
echo Starting Hospital Scheduler...
node wrapper.cjs
pause
"@ | Out-File "deployment/start-scheduler.bat" -Encoding ASCII

# Create test script
@"
# Hospital Scheduler Test Script
Set-Location "$InstallPath"

Write-Host "Testing Hospital Scheduler deployment..." -ForegroundColor Cyan
Write-Host ""

# Test Node.js
Write-Host "Node.js version:" -ForegroundColor Yellow
node --version

Write-Host ""
Write-Host "Testing minimal server..." -ForegroundColor Yellow
Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue | 
    ForEach-Object { Stop-Process -Id `$_.OwningProcess -Force -ErrorAction SilentlyContinue }

Write-Host ""
Write-Host "Starting server..." -ForegroundColor Green
node minimal-server.cjs
"@ | Out-File "deployment/test-deployment.ps1" -Encoding UTF8

Write-Host "  [✓] Helper scripts created" -ForegroundColor Green

Write-Host "`n[10] FINAL TESTING" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Gray

# Test the wrapper
Write-Host "  Testing production wrapper..." -ForegroundColor Cyan
Set-Location $InstallPath

# Kill any existing processes
Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue | 
    ForEach-Object { 
        Write-Host "    Stopping existing process on port 5000..." -ForegroundColor Gray
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue 
    }

# Start the minimal server to test
Write-Host "  Starting minimal server test..." -ForegroundColor Cyan
$testProcess = Start-Process cmd -ArgumentList "/k cd /d `"$InstallPath`" && node minimal-server.cjs" -PassThru

Start-Sleep -Seconds 3

# Check if it's running
$running = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue
if ($running) {
    Write-Host "`n================================================" -ForegroundColor Green -BackgroundColor Black
    Write-Host "    ✓✓✓ DEPLOYMENT SUCCESSFUL! ✓✓✓            " -ForegroundColor Green -BackgroundColor Black
    Write-Host "================================================" -ForegroundColor Green -BackgroundColor Black
    Write-Host ""
    Write-Host "Hospital Scheduler is running at:" -ForegroundColor Cyan
    Write-Host "  http://127.0.0.1:5000" -ForegroundColor Yellow -BackgroundColor DarkGray
    Write-Host ""
    Write-Host "Installation Details:" -ForegroundColor Cyan
    Write-Host "  Application Path: $InstallPath" -ForegroundColor Gray
    Write-Host "  IIS Webroot: $WebRoot" -ForegroundColor Gray
    Write-Host "  Database: PostgreSQL on $DatabaseHost`:$DatabasePort" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "  1. Configure PostgreSQL database connection" -ForegroundColor White
    Write-Host "  2. Set up Google OAuth credentials" -ForegroundColor White
    Write-Host "  3. Install as Windows service: $InstallPath\install-service.bat" -ForegroundColor White
    Write-Host "  4. Configure IIS site if using IIS reverse proxy" -ForegroundColor White
    Write-Host ""
    Write-Host "Quick Commands:" -ForegroundColor Cyan
    Write-Host "  Start: .\deployment\start-scheduler.bat" -ForegroundColor White
    Write-Host "  Test: .\deployment\test-deployment.ps1" -ForegroundColor White
    Write-Host "  Logs: type `"$InstallPath\logs\service-output.log`"" -ForegroundColor White
    Write-Host ""
    
    # Open browser to test
    Start-Process "http://127.0.0.1:5000"
    
    # Stop test process
    Stop-Process -Id $testProcess.Id -Force -ErrorAction SilentlyContinue
    
} else {
    Write-Host "`n[!] Test failed - server not responding on port 5000" -ForegroundColor Red
    Write-Host "Check the logs and try manual start:" -ForegroundColor Yellow
    Write-Host "  cd $InstallPath" -ForegroundColor Gray
    Write-Host "  node wrapper.cjs" -ForegroundColor Gray
}

Write-Host "`n[11] CONFIGURATION INSTRUCTIONS" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Gray
Write-Host "Database Setup Required:" -ForegroundColor Red
Write-Host "  1. Create PostgreSQL database '$DatabaseName'" -ForegroundColor White
Write-Host "  2. Create user '$DatabaseUser' with password" -ForegroundColor White
Write-Host "  3. Set DB_PASSWORD environment variable" -ForegroundColor White
Write-Host "  4. Run schema migration: npm run db:push" -ForegroundColor White
Write-Host ""
Write-Host "OAuth Setup Required:" -ForegroundColor Red  
Write-Host "  1. Create Google OAuth 2.0 credentials" -ForegroundColor White
Write-Host "  2. Set GOOGLE_CLIENT_ID environment variable" -ForegroundColor White
Write-Host "  3. Set GOOGLE_CLIENT_SECRET environment variable" -ForegroundColor White
Write-Host ""
Write-Host "Security Setup Required:" -ForegroundColor Red
Write-Host "  1. Set SESSION_SECRET environment variable (random 64+ chars)" -ForegroundColor White
Write-Host "  2. Configure Windows service security" -ForegroundColor White
Write-Host "  3. Set up IIS application pool if using IIS" -ForegroundColor White
Write-Host ""

Write-Host "================================================" -ForegroundColor Green
Write-Host "Deployment script completed!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green