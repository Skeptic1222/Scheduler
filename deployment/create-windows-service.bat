@echo off
setlocal enabledelayedexpansion

echo ========================================
echo Hospital Scheduler - Windows Service Setup
echo ========================================
echo.
echo This script creates a Windows service for the Node.js application
echo using NSSM (Non-Sucking Service Manager) for production deployment.
echo.

set "SERVICE_NAME=HospitalScheduler"
set "APP_PATH=C:\apps\hospital-scheduler\index.js"
set "NODE_PATH=C:\Program Files\nodejs\node.exe"
set "SERVICE_DESCRIPTION=Hospital Shift Scheduler Application"

echo [INFO] Service Name: %SERVICE_NAME%
echo [INFO] Application Path: %APP_PATH%
echo [INFO] Node.js Path: %NODE_PATH%
echo.

REM Check if running as administrator
net session >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] This script must be run as Administrator
    echo [INFO] Right-click and select "Run as administrator"
    pause
    exit /b 1
)

echo ========================================
echo Step 1: Download and Install NSSM
echo ========================================

REM Check if NSSM is already available
where nssm >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [INFO] ✓ NSSM is already installed
    goto :create_service
)

echo [INFO] NSSM not found. Please download and install NSSM:
echo [INFO] 1. Download from: https://nssm.cc/download
echo [INFO] 2. Extract to C:\nssm (or add to PATH)
echo [INFO] 3. Run this script again
echo.
echo [INFO] Alternative: Use PowerShell to install via Chocolatey:
echo [INFO] choco install nssm
echo.
pause
exit /b 1

:create_service
echo ========================================
echo Step 2: Create Windows Service
echo ========================================

echo [INFO] Creating service: %SERVICE_NAME%

REM Remove existing service if it exists
sc query "%SERVICE_NAME%" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [INFO] Stopping existing service...
    nssm stop "%SERVICE_NAME%"
    echo [INFO] Removing existing service...
    nssm remove "%SERVICE_NAME%" confirm
)

REM Install the service
echo [INFO] Installing new service...
nssm install "%SERVICE_NAME%" "%NODE_PATH%" "%APP_PATH%"
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install service
    exit /b 1
)

echo ========================================
echo Step 3: Configure Service
echo ========================================

REM Set service description
nssm set "%SERVICE_NAME%" Description "%SERVICE_DESCRIPTION%"

REM Set working directory (secure location outside webroot)
nssm set "%SERVICE_NAME%" AppDirectory "C:\apps\hospital-scheduler"

REM Configure startup type
nssm set "%SERVICE_NAME%" Start SERVICE_AUTO_START

REM Set all required environment variables for the application
nssm set "%SERVICE_NAME%" AppEnvironmentExtra ^
  "NODE_ENV=production" ^
  "PORT=5000" ^
  "DB_TYPE=sqlserver" ^
  "DB_HOST=localhost" ^
  "DB_PORT=1433" ^
  "DB_NAME=HospitalScheduler" ^
  "DB_WINDOWS_AUTH=false" ^
  "DB_USER=HospitalSchedulerApp" ^
  "DB_PASSWORD=CHANGE-THIS-TO-YOUR-DB-PASSWORD" ^
  "DB_SSL=false" ^
  "DB_TRUST_SERVER_CERTIFICATE=true" ^
  "BASE_URL=http://localhost" ^
  "CORS_ORIGIN=http://localhost" ^
  "ENABLE_WEBSOCKET=true" ^
  "SESSION_SECRET=CHANGE-THIS-TO-SECURE-RANDOM-STRING" ^
  "ENABLE_RATE_LIMITING=true"

REM Configure logging
mkdir "%~dp0..\logs" 2>nul
nssm set "%SERVICE_NAME%" AppStdout "%~dp0..\logs\service-stdout.log"
nssm set "%SERVICE_NAME%" AppStderr "%~dp0..\logs\service-stderr.log"
nssm set "%SERVICE_NAME%" AppRotateFiles 1
nssm set "%SERVICE_NAME%" AppRotateOnline 1
nssm set "%SERVICE_NAME%" AppRotateSeconds 86400
nssm set "%SERVICE_NAME%" AppRotateBytes 1048576

REM Configure restart behavior
nssm set "%SERVICE_NAME%" AppExit Default Restart
nssm set "%SERVICE_NAME%" AppRestartDelay 5000

echo ========================================
echo Step 4: Start Service
echo ========================================

echo [INFO] Starting service...
nssm start "%SERVICE_NAME%"
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] ✓ Service started successfully
) else (
    echo [ERROR] Failed to start service
    echo [INFO] Check logs at: %~dp0..\logs\
    exit /b 1
)

echo.
echo ========================================
echo Service Configuration Complete
echo ========================================
echo.
echo [INFO] Service Details:
echo   Name: %SERVICE_NAME%
echo   Status: Running
echo   Port: 5000
echo   Logs: %~dp0..\logs\
echo.
echo [INFO] Service Management Commands:
echo   Start:   nssm start "%SERVICE_NAME%"
echo   Stop:    nssm stop "%SERVICE_NAME%"
echo   Restart: nssm restart "%SERVICE_NAME%"
echo   Remove:  nssm remove "%SERVICE_NAME%" confirm
echo.
echo [INFO] The Node.js application is now running as a Windows service
echo [INFO] IIS will proxy requests to http://localhost:5000
echo.
echo [INFO] Next steps:
echo   1. Configure IIS to proxy to localhost:5000
echo   2. Test the application via IIS
echo   3. Configure firewall rules if needed
echo.

pause