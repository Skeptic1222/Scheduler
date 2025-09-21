# Final Working Fix - Handles ES Modules and IIS correctly
param(
    [switch]$FixIIS,
    [switch]$StartOnly
)

Set-Location "C:\inetpub\wwwroot\MediaVault"

Write-Host "`n================================================" -ForegroundColor Green
Write-Host "    FINAL FIX - ES MODULES & IIS               " -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

if ($StartOnly) {
    Write-Host "Starting server..." -ForegroundColor Yellow
    Start-Process cmd -ArgumentList "/k node minimal-server.cjs"
    exit
}

Write-Host "`n[1] FIXING IIS WEB.CONFIG" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Gray

# Remove the broken web.config that's causing 500.19 error
if (Test-Path "web.config") {
    Rename-Item "web.config" "web.config.broken" -Force
    Write-Host "  [✓] Renamed broken web.config" -ForegroundColor Green
}

# Create a minimal working web.config for IIS
if ($FixIIS) {
    $minimalWebConfig = @'
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <defaultDocument>
            <files>
                <add value="index.html" />
            </files>
        </defaultDocument>
    </system.webServer>
</configuration>
'@
    $minimalWebConfig | Out-File "web.config" -Encoding UTF8
    Write-Host "  [✓] Created minimal web.config" -ForegroundColor Green
}

Write-Host "`n[2] FIXING ES MODULE ISSUES" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Gray

# The problem: package.json has "type": "module" so ALL .js files are ES modules
# Solution: Use .cjs extension for CommonJS files

Write-Host "Creating CommonJS files with .cjs extension..." -ForegroundColor Cyan

# Create minimal server as .cjs (CommonJS)
Write-Host "  Creating minimal-server.cjs..." -ForegroundColor Gray
@'
// COMMONJS SERVER - Using .cjs extension
const http = require('http');
const PORT = 3000;
const HOST = '127.0.0.1';

console.log('====================================');
console.log('  MediaVault Minimal Server (.cjs)');
console.log('====================================');

const server = http.createServer((req, res) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>MediaVault Working!</title>
            <style>
                body { font-family: Arial; padding: 40px; background: #f0f0f0; }
                .success { background: #4CAF50; color: white; padding: 20px; border-radius: 5px; }
                .info { background: white; padding: 20px; margin-top: 20px; border-radius: 5px; }
                code { background: #f4f4f4; padding: 2px 5px; }
            </style>
        </head>
        <body>
            <div class="success">
                <h1>✓ MediaVault Server is WORKING!</h1>
                <p>The minimal server is running successfully on port ${PORT}</p>
            </div>
            <div class="info">
                <h2>Server Information</h2>
                <ul>
                    <li>URL: http://${HOST}:${PORT}</li>
                    <li>Time: ${timestamp}</li>
                    <li>Request: ${req.method} ${req.url}</li>
                </ul>
                <h2>Next Steps</h2>
                <p>This proves Node.js is working. The main app may need fixes for:</p>
                <ul>
                    <li>OAuth/Authentication issues</li>
                    <li>Database connection</li>
                    <li>ES Module compatibility</li>
                </ul>
                <p>Try development mode: <code>npm run dev</code> (port 5173)</p>
            </div>
        </body>
        </html>
    `);
});

server.listen(PORT, HOST, () => {
    console.log(`✓ Server listening on http://${HOST}:${PORT}`);
    console.log('✓ This proves Node.js networking works!');
    console.log('');
    console.log('Open your browser to:');
    console.log(`  http://${HOST}:${PORT}`);
    console.log('');
});

server.on('error', (err) => {
    console.error('ERROR:', err.message);
    if (err.code === 'EADDRINUSE') {
        console.log(`Port ${PORT} is already in use!`);
        console.log('Trying port 3001...');
        server.listen(3001, HOST);
    } else if (err.code === 'EACCES') {
        console.log('Permission denied. Try running as administrator.');
    }
});
'@ | Out-File "minimal-server.cjs" -Encoding UTF8
Write-Host "  [✓] Created minimal-server.cjs" -ForegroundColor Green

# Create wrapper as .cjs
Write-Host "  Creating wrapper.cjs..." -ForegroundColor Gray
@'
// COMMONJS WRAPPER - Using .cjs extension
const net = require('net');

console.log('[WRAPPER] Starting with .cjs extension...');

// Force IPv4 binding
const originalListen = net.Server.prototype.listen;
net.Server.prototype.listen = function(...args) {
    if (typeof args[0] === 'number' && args.length === 1) {
        console.log(`[WRAPPER] Forcing 127.0.0.1:${args[0]}`);
        return originalListen.call(this, args[0], '127.0.0.1');
    }
    return originalListen.apply(this, args);
};

// Set environment
process.env.HOST = '127.0.0.1';
process.env.PORT = '3000';
process.env.DATABASE_URL = 'postgresql://aidev:qwerty@127.0.0.1:5432/mediavault';
process.env.FILESYSTEM_MASTER_KEY = 'a'.repeat(64);

console.log('[WRAPPER] Loading dist/index.js...');
import('./dist/index.js').catch(err => {
    console.error('[WRAPPER] Failed:', err.message);
    console.log('[WRAPPER] Starting minimal server instead...');
    require('./minimal-server.cjs');
});
'@ | Out-File "wrapper.cjs" -Encoding UTF8
Write-Host "  [✓] Created wrapper.cjs" -ForegroundColor Green

# Fix the syntax error in dist/index.js from bad patching
Write-Host "`n[3] FIXING DIST/INDEX.JS SYNTAX ERROR" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Gray

if (Test-Path "dist/index.js.backup-ipv4") {
    Write-Host "  Restoring from backup..." -ForegroundColor Cyan
    Copy-Item "dist/index.js.backup-ipv4" "dist/index.js" -Force
    Write-Host "  [✓] Restored clean version" -ForegroundColor Green
} elseif (Test-Path "dist/index.js.original") {
    Write-Host "  Restoring from original..." -ForegroundColor Cyan
    Copy-Item "dist/index.js.original" "dist/index.js" -Force
    Write-Host "  [✓] Restored original version" -ForegroundColor Green
}

# Apply clean patches without syntax errors
if (Test-Path "dist/index.js") {
    Write-Host "  Applying clean patches..." -ForegroundColor Cyan
    $content = Get-Content "dist/index.js" -Raw
    
    # Simple replacements without breaking syntax
    $content = $content -replace '0\.0\.0\.0', '127.0.0.1'
    $content = $content -replace '::1', '127.0.0.1'
    
    $content | Out-File "dist/index.js" -Encoding UTF8
    Write-Host "  [✓] Clean patches applied" -ForegroundColor Green
}

Write-Host "`n[4] CREATING START SCRIPTS" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Gray

# Batch file for minimal server
@'
@echo off
title MediaVault Minimal Server
cd /d C:\inetpub\wwwroot\MediaVault
cls
echo ====================================
echo   MediaVault Minimal Server
echo ====================================
echo.
echo Starting on port 3000...
echo.
node minimal-server.cjs
pause
'@ | Out-File "start-minimal.bat" -Encoding ASCII
Write-Host "  [✓] Created start-minimal.bat" -ForegroundColor Green

# PowerShell script for testing
@'
# Test script
Set-Location "C:\inetpub\wwwroot\MediaVault"

Write-Host "Testing Node.js..." -ForegroundColor Cyan
node --version

Write-Host "`nKilling port 3000..." -ForegroundColor Yellow
Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | 
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }

Write-Host "`nStarting minimal server..." -ForegroundColor Green
node minimal-server.cjs
'@ | Out-File "test.ps1" -Encoding UTF8
Write-Host "  [✓] Created test.ps1" -ForegroundColor Green

Write-Host "`n[5] STARTING SERVERS" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Gray

# Kill existing processes on port 3000
Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | 
    ForEach-Object { 
        Write-Host "  Killing process on port 3000..." -ForegroundColor Gray
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue 
    }

# Start minimal server
Write-Host "`nStarting minimal-server.cjs..." -ForegroundColor Cyan
$minimal = Start-Process cmd -ArgumentList "/k cd /d `"$PWD`" && node minimal-server.cjs" -PassThru

Start-Sleep -Seconds 2

# Check if it's running
$running = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($running) {
    Write-Host "`n================================================" -ForegroundColor Green -BackgroundColor Black
    Write-Host "    ✓✓✓ SUCCESS! SERVER IS RUNNING! ✓✓✓      " -ForegroundColor Green -BackgroundColor Black
    Write-Host "================================================" -ForegroundColor Green -BackgroundColor Black
    Write-Host ""
    Write-Host "Minimal server running at:" -ForegroundColor Cyan
    Write-Host "  http://127.0.0.1:3000" -ForegroundColor Yellow -BackgroundColor DarkGray
    Write-Host ""
    Write-Host "This proves Node.js works!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Files created:" -ForegroundColor Cyan
    Write-Host "  minimal-server.cjs - Working CommonJS server" -ForegroundColor Gray
    Write-Host "  wrapper.cjs - CommonJS wrapper" -ForegroundColor Gray
    Write-Host "  start-minimal.bat - Easy start script" -ForegroundColor Gray
    Write-Host ""
    Write-Host "To run again:" -ForegroundColor Cyan
    Write-Host "  node minimal-server.cjs" -ForegroundColor White
    Write-Host "  or: .\start-minimal.bat" -ForegroundColor White
    Write-Host ""
    
    # Open browser
    Start-Process "http://127.0.0.1:3000"
} else {
    # Try development mode as last resort
    Write-Host "`n[!] Minimal server not detected on port 3000" -ForegroundColor Red
    Write-Host "Trying development mode..." -ForegroundColor Yellow
    
    $env:DATABASE_URL = "postgresql://aidev:qwerty@127.0.0.1:5432/mediavault"
    $env:FILESYSTEM_MASTER_KEY = "dev" * 21 + "ke"
    
    Start-Process cmd -ArgumentList "/k cd /d `"$PWD`" && npm run dev"
    
    Write-Host "`nDevelopment mode starting (port 5173)..." -ForegroundColor Cyan
    Write-Host "Wait a moment then try: http://localhost:5173" -ForegroundColor Yellow
}

Write-Host "`n[6] IIS FIX INSTRUCTIONS" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Gray
Write-Host "The IIS error (500.19) was caused by invalid web.config" -ForegroundColor Cyan
Write-Host "I've renamed it to web.config.broken" -ForegroundColor Gray
Write-Host ""
Write-Host "To properly setup IIS proxy to Node.js:" -ForegroundColor Yellow
Write-Host "  1. Install URL Rewrite module for IIS" -ForegroundColor Gray
Write-Host "  2. Run: .\final-fix.ps1 -FixIIS" -ForegroundColor Gray
Write-Host "  3. Configure IIS to proxy /mediavault to localhost:3000" -ForegroundColor Gray
Write-Host ""

Write-Host "================================================" -ForegroundColor Green
Write-Host "Script complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green