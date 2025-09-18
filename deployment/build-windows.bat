@echo off
setlocal enabledelayedexpansion

echo ========================================
echo Hospital Scheduler - Windows Build Script
echo ========================================
echo.
echo This script addresses the npm dependency installation issues
echo identified in Windows/WSL environments for Claude Code deployment.
echo.

REM Set error handling
set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR%.."
set "ERROR_COUNT=0"

echo [INFO] Current directory: %CD%
echo [INFO] Script directory: %SCRIPT_DIR%
echo [INFO] Project root: %PROJECT_ROOT%
echo.

REM Change to project root
cd /d "%PROJECT_ROOT%"
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to change to project root directory
    goto :error_exit
)

echo ========================================
echo Step 1: Environment Verification
echo ========================================

REM Check Node.js version
echo [INFO] Checking Node.js installation...
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    set /a ERROR_COUNT+=1
    goto :error_exit
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [INFO] Node.js version: %NODE_VERSION%

REM Check npm version
echo [INFO] Checking npm installation...
npm --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed or not in PATH
    set /a ERROR_COUNT+=1
    goto :error_exit
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo [INFO] npm version: %NPM_VERSION%

REM Check if we're in WSL
if exist "/proc/version" (
    echo [INFO] Running in WSL environment
    set "WSL_ENV=true"
) else (
    echo [INFO] Running in native Windows environment
    set "WSL_ENV=false"
)

echo.

echo ========================================
echo Step 2: Clean Previous Installation
echo ========================================

echo [INFO] Cleaning previous installation artifacts...

REM Remove node_modules if it exists
if exist "node_modules" (
    echo [INFO] Removing existing node_modules directory...
    rmdir /s /q "node_modules" 2>nul
    if exist "node_modules" (
        echo [WARNING] Could not completely remove node_modules, continuing...
    ) else (
        echo [INFO] Successfully removed node_modules
    )
)

REM Remove package-lock.json if it exists (often corrupted on Windows)
if exist "package-lock.json" (
    echo [INFO] Removing potentially corrupted package-lock.json...
    del "package-lock.json" 2>nul
    echo [INFO] Removed package-lock.json
)

REM Clear npm cache
echo [INFO] Clearing npm cache...
npm cache clean --force >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [INFO] Successfully cleared npm cache
) else (
    echo [WARNING] Failed to clear npm cache, continuing...
)

echo.

echo ========================================
echo Step 3: Critical Dependencies Installation
echo ========================================
echo.
echo [INFO] Installing critical dependencies individually to avoid Windows/WSL issues...
echo [INFO] This addresses the 927 vs 760 package problem identified in the deployment document.
echo.

REM Install critical build tools first (addressing the documented npm issue)
echo [INFO] Installing @vitejs/plugin-react...
npm install @vitejs/plugin-react --save-dev --force
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install @vitejs/plugin-react
    set /a ERROR_COUNT+=1
)

echo [INFO] Waiting 2 seconds before next installation...
timeout /t 2 /nobreak >nul

echo [INFO] Installing vite...
npm install vite --save-dev --force
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install vite
    set /a ERROR_COUNT+=1
)

echo [INFO] Waiting 2 seconds before next installation...
timeout /t 2 /nobreak >nul

echo [INFO] Installing esbuild...
npm install esbuild --save-dev --force
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install esbuild
    set /a ERROR_COUNT+=1
)

echo [INFO] Waiting 2 seconds before next installation...
timeout /t 2 /nobreak >nul

echo [INFO] Installing TypeScript...
npm install typescript --save-dev --force
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install typescript
    set /a ERROR_COUNT+=1
)

echo.

echo ========================================
echo Step 4: SQL Server Dependencies (Windows-specific)
echo ========================================

echo [INFO] Installing SQL Server dependencies for Windows deployment...
npm install mssql --force
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install mssql
    set /a ERROR_COUNT+=1
)

npm install @types/mssql --save-dev --force
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install @types/mssql
    set /a ERROR_COUNT+=1
)

echo.

echo ========================================
echo Step 5: Remaining Dependencies
echo ========================================

echo [INFO] Installing remaining dependencies...
npm install --force
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install remaining dependencies
    set /a ERROR_COUNT+=1
)

echo.

echo ========================================
echo Step 6: Verification
echo ========================================

echo [INFO] Verifying installation...

REM Count installed packages
if exist "node_modules" (
    for /f %%A in ('dir "node_modules" /b 2^>nul ^| find /c /v ""') do set "PACKAGE_COUNT=%%A"
    echo [INFO] Installed packages: !PACKAGE_COUNT!
    
    REM Check if we have the expected number (should be close to 927 based on the document)
    if !PACKAGE_COUNT! LSS 800 (
        echo [WARNING] Package count (!PACKAGE_COUNT!) seems low. Expected around 900+ packages.
        echo [INFO] This might indicate the npm dependency issue mentioned in the deployment document.
    ) else (
        echo [INFO] Package count looks good (!PACKAGE_COUNT! packages)
    )
) else (
    echo [ERROR] node_modules directory not found after installation
    set /a ERROR_COUNT+=1
)

REM Verify critical files
echo [INFO] Verifying critical dependencies...
set "CRITICAL_DEPS=@vitejs/plugin-react vite esbuild typescript mssql"
for %%i in (%CRITICAL_DEPS%) do (
    if exist "node_modules\%%i" (
        echo [INFO] ✓ %%i installed successfully
    ) else (
        echo [ERROR] ✗ %%i missing
        set /a ERROR_COUNT+=1
    )
)

echo.

echo ========================================
echo Step 7: Build Application
echo ========================================

echo [INFO] Building application for Windows deployment...
npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Build failed
    set /a ERROR_COUNT+=1
    goto :error_exit
) else (
    echo [INFO] Build completed successfully
)

echo.

echo ========================================
echo Step 8: IIS Prerequisites Check
echo ========================================

echo [INFO] Checking IIS prerequisites for Node.js deployment...

REM Check if IIS is installed and running
sc query w3svc >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [INFO] ✓ IIS (W3SVC) service is available
) else (
    echo [WARNING] ⚠ IIS (W3SVC) service not found - please install IIS with World Wide Web Service
)

REM Check for URL Rewrite module (PowerShell check)
powershell -Command "Get-WindowsFeature -Name IIS-HttpRedirect -ErrorAction SilentlyContinue" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [INFO] ✓ URL Rewrite capability detected
) else (
    echo [WARNING] ⚠ URL Rewrite module may not be installed - download from Microsoft
)

REM Note about iisnode
echo [INFO] Note: iisnode module is required for Node.js hosting in IIS
echo [INFO] Download from: https://github.com/Azure/iisnode

echo.

echo ========================================
echo Step 9: Generate IIS Configuration
echo ========================================

echo [INFO] Generating web.config for IIS deployment...

REM Create web.config for IIS
(
echo ^<?xml version="1.0" encoding="utf-8"?^>
echo ^<configuration^>
echo   ^<system.webServer^>
echo     ^<handlers^>
echo       ^<add name="iisnode" path="dist/index.js" verb="*" modules="iisnode" /^>
echo     ^</handlers^>
echo     ^<rewrite^>
echo       ^<rules^>
echo         ^<rule name="NodeInspector" patternSyntax="ECMAScript" stopProcessing="true"^>
echo           ^<match url="^dist/index.js\/debug[\/]?" /^>
echo         ^</rule^>
echo         ^<rule name="StaticContent"^>
echo           ^<action type="Rewrite" url="dist/public{REQUEST_URI}" /^>
echo         ^</rule^>
echo         ^<rule name="DynamicContent"^>
echo           ^<conditions^>
echo             ^<add input="{REQUEST_FILENAME}" matchType="IsFile" negate="True" /^>
echo           ^</conditions^>
echo           ^<action type="Rewrite" url="dist/index.js" /^>
echo         ^</rule^>
echo       ^</rules^>
echo     ^</rewrite^>
echo     ^<security^>
echo       ^<requestFiltering^>
echo         ^<hiddenSegments^>
echo           ^<remove segment="bin" /^>
echo         ^</hiddenSegments^>
echo       ^</requestFiltering^>
echo     ^</security^>
echo   ^</system.webServer^>
echo ^</configuration^>
) > web.config

echo [INFO] web.config generated successfully

echo.

echo ========================================
echo Build Summary
echo ========================================

if %ERROR_COUNT% EQU 0 (
    echo [SUCCESS] Build completed successfully with no errors!
    echo.
    echo [INFO] Files ready for IIS deployment:
    echo   - dist/           ^(built application^)
    echo   - web.config      ^(IIS configuration^)
    echo   - node_modules/   ^(dependencies^)
    echo.
    echo [INFO] Next steps:
    echo   1. Copy all files to C:\inetpub\wwwroot\scheduler\
    echo   2. Configure SQL Server Express connection in .env file
    echo   3. Run database creation script
    echo   4. Configure IIS application pool for Node.js
    echo.
    echo [INFO] For Claude Code in WSL: Application is ready for Windows deployment!
    exit /b 0
) else (
    echo [ERROR] Build completed with %ERROR_COUNT% error^(s^)
    echo [INFO] Check the error messages above and try running the script again.
    goto :error_exit
)

:error_exit
echo.
echo [ERROR] Build failed with %ERROR_COUNT% error^(s^)
echo [INFO] Common solutions:
echo   - Run as Administrator if permission issues occur
echo   - Ensure Node.js and npm are properly installed
echo   - Check internet connectivity for package downloads
echo   - For WSL: Ensure proper file system permissions
echo.
echo [INFO] For Claude Code assistance, please share this error log.
exit /b 1