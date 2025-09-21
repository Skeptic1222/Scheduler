@echo off
title Hospital Scheduler - Quick Test
cls

echo ===============================================
echo   Hospital Scheduler - Quick Test
echo ===============================================
echo.

REM Check Node.js
echo [1] Checking Node.js...
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js not found! Please install Node.js v20+ LTS
    pause
    exit /b 1
)
echo [OK] Node.js is installed

REM Check if built
echo.
echo [2] Checking build...
if not exist "dist\index.js" (
    echo [ERROR] Application not built! Run: npm run build
    pause
    exit /b 1
)
echo [OK] Application is built

REM Check PostgreSQL
echo.
echo [3] Checking PostgreSQL...
psql --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] PostgreSQL client not found in PATH
) else (
    echo [OK] PostgreSQL client available
)

REM Test minimal server
echo.
echo [4] Testing minimal server...
cd dist
echo Starting test server (will open in browser)...
echo Press Ctrl+C to stop the test
echo.
node minimal-server.cjs

pause