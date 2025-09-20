@echo off
setlocal enabledelayedexpansion

echo ========================================
echo Hospital Scheduler - Build Verification Script
echo ========================================
echo.
echo This script verifies the Windows build is ready for IIS deployment
echo and checks for the issues documented in the deployment request.
echo.

set "PROJECT_ROOT=%~dp0.."
set "ERROR_COUNT=0"

cd /d "%PROJECT_ROOT%"

echo ========================================
echo Verification 1: Dependency Installation Check
echo ========================================

if exist "node_modules" (
    echo [INFO] node_modules directory exists
    
    REM Test npm list command to verify installation integrity
    npm list --depth=0 >nul 2>&1
    if !ERRORLEVEL! EQU 0 (
        echo [SUCCESS] ✓ npm dependencies properly installed (verified via npm list)
    ) else (
        echo [WARNING] ⚠ npm list reports issues, but continuing verification...
    )
) else (
    echo [ERROR] ✗ node_modules directory not found
    set /a ERROR_COUNT+=1
)

echo.

echo ========================================
echo Verification 2: Critical Dependencies
echo ========================================

REM Check scoped packages with explicit paths
if exist "node_modules\@vitejs\plugin-react" (
    echo [SUCCESS] ✓ @vitejs/plugin-react
) else (
    echo [ERROR] ✗ @vitejs/plugin-react missing
    set /a ERROR_COUNT+=1
)

set "CRITICAL_DEPS=vite esbuild typescript"
for %%i in (%CRITICAL_DEPS%) do (
    if exist "node_modules\%%i" (
        echo [SUCCESS] ✓ %%i
    ) else (
        echo [ERROR] ✗ %%i missing
        set /a ERROR_COUNT+=1
    )
)

if exist "node_modules\drizzle-orm" (
    echo [SUCCESS] ✓ drizzle-orm (PostgreSQL ORM)
) else (
    echo [ERROR] ✗ drizzle-orm missing
    set /a ERROR_COUNT+=1
)

echo.

echo ========================================
echo Verification 3: Build Output
echo ========================================

if exist "dist" (
    echo [SUCCESS] ✓ dist directory exists
    
    if exist "dist\index.js" (
        echo [SUCCESS] ✓ Server bundle (dist\index.js) exists
    ) else (
        echo [ERROR] ✗ Server bundle missing - check npm run build output
        set /a ERROR_COUNT+=1
    )
    
    if exist "dist\public" (
        echo [SUCCESS] ✓ Client build (dist\public) exists
        
        if exist "dist\public\index.html" (
            echo [SUCCESS] ✓ Client HTML entry point exists
        ) else (
            echo [ERROR] ✗ Client HTML missing
            set /a ERROR_COUNT+=1
        )
    ) else (
        echo [ERROR] ✗ Client build missing - check vite build output
        set /a ERROR_COUNT+=1
    )
) else (
    echo [ERROR] ✗ dist directory not found - run npm run build first
    set /a ERROR_COUNT+=1
)

echo.

echo ========================================
echo Verification 4: IIS Configuration
echo ========================================

if exist "web.config" (
    echo [SUCCESS] ✓ web.config exists
    
    REM Check if web.config contains required ARR proxy settings
    findstr /i "localhost:5000" web.config >nul
    if !ERRORLEVEL! EQU 0 (
        echo [SUCCESS] ✓ web.config contains ARR reverse proxy configuration
    ) else (
        echo [ERROR] ✗ web.config missing ARR proxy configuration
        set /a ERROR_COUNT+=1
    )
    
    REM Check for WebSocket support
    findstr /i "webSocket.*enabled.*true" web.config >nul
    if !ERRORLEVEL! EQU 0 (
        echo [SUCCESS] ✓ web.config has WebSocket support enabled
    ) else (
        echo [WARNING] ⚠ WebSocket support may not be enabled
    )
) else (
    echo [ERROR] ✗ web.config not found - required for IIS deployment
    set /a ERROR_COUNT+=1
)

echo.

echo ========================================
echo Verification 5: Database Readiness (PostgreSQL)
echo ========================================

if exist "shared\schema.ts" (
    echo [SUCCESS] ✓ Database schema definitions exist
) else (
    echo [ERROR] ✗ Database schema definitions missing
    set /a ERROR_COUNT+=1
)

if exist "drizzle.config.ts" (
    echo [SUCCESS] ✓ Drizzle ORM configuration exists
) else (
    echo [WARNING] ⚠ Drizzle configuration not found - may need manual setup
)

if exist "server\db-postgresql.ts" (
    echo [SUCCESS] ✓ PostgreSQL adapter exists
) else (
    echo [ERROR] ✗ PostgreSQL adapter missing
    set /a ERROR_COUNT+=1
)

echo.

echo ========================================
echo Verification 6: IIS Prerequisites
echo ========================================

REM Check if running on Windows
if exist "%SYSTEMROOT%" (
    echo [INFO] Running on Windows environment
    
    REM Check IIS service
    sc query w3svc >nul 2>&1
    if !ERRORLEVEL! EQU 0 (
        echo [SUCCESS] ✓ IIS (W3SVC) service available
    ) else (
        echo [WARNING] ⚠ IIS service not detected - install IIS with ASP.NET features
    )
    
    REM Note about required IIS modules
    echo [INFO] Required IIS modules for deployment:
    echo   - URL Rewrite Module (Microsoft download)
    echo   - Application Request Routing (ARR) Module
    echo   - WebSocket support
) else (
    echo [INFO] Not running on Windows - IIS checks skipped
)

echo.

echo ========================================
echo Verification 7: Environment Configuration
echo ========================================

if exist ".env.example" (
    echo [SUCCESS] ✓ Environment example file exists
) else (
    echo [WARNING] ⚠ .env.example not found - should be created for deployment
)

echo.

echo ========================================
echo Verification Summary
echo ========================================

if %ERROR_COUNT% EQU 0 (
    echo [SUCCESS] ✓ All verifications passed!
    echo.
    echo The application is ready for Windows IIS deployment.
    echo.
    echo Next deployment steps:
    echo 1. Copy all files to C:\inetpub\wwwroot\scheduler\
    echo 2. Configure .env with PostgreSQL settings:
    echo    DB_TYPE=postgresql
    echo    DB_HOST=localhost
    echo    DB_PORT=5432
    echo    DB_NAME=hospital_scheduler
    echo 3. Run 'npm run db:push' to create PostgreSQL database schema
    echo 4. Create Windows service via deployment\create-windows-service.bat
    echo 5. Enable ARR proxy at server level in IIS Manager
    echo 5. Configure application pool for Node.js
    echo.
    exit /b 0
) else (
    echo [ERROR] ✗ %ERROR_COUNT% verification^(s^) failed
    echo.
    echo Please address the errors above before deploying to Windows IIS.
    echo Run build-windows.bat again if needed.
    echo.
    exit /b 1
)