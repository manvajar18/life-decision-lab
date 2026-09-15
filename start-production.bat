@echo off
title Life Decision Lab - Production Server
cd /d "%~dp0"
echo ================================================================
echo   Life Decision Lab - Production Mode
echo ================================================================
echo.
set "PATH=C:\Program Files\nodejs;C:\Users\manva\AppData\Roaming\npm;%PATH%"

echo Opening http://localhost:3000 in your browser...
start http://localhost:3000

echo Starting Next.js production server...
cmd /c "pnpm start"

pause
