@echo off
title Life Decision Lab - Development Server
cd /d "%~dp0"
echo ================================================================
echo   Life Decision Lab - Starting Server
echo ================================================================
echo.
echo Ensuring environment paths...
set "PATH=C:\Program Files\nodejs;C:\Users\manva\AppData\Roaming\npm;%PATH%"

echo Opening http://localhost:3000 in your browser...
start http://localhost:3000

echo Starting Next.js server...
cmd /c "pnpm dev"

if %errorlevel% neq 0 (
    echo.
    echo Server stopped or encountered an issue.
    echo Trying npm run dev fallback...
    cmd /c "npm run dev"
)

pause
