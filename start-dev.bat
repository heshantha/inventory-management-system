@echo off
echo Starting Hardware Shop System in Development Mode...
echo.
echo [1/2] Starting Vite development server...
start "Vite Dev Server" cmd /k "npm run dev"

echo [2/2] Waiting 5 seconds for Vite to start...
timeout /t 5 /nobreak >nul

echo Starting Electron...
start "Electron" cmd /k "npm run electron"

echo.
echo Both servers are starting in separate windows.
echo Close this window when done.
pause
