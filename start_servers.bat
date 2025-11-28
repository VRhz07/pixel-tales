@echo off
echo ========================================
echo Starting PixelTales Servers
echo ========================================
echo.

echo [1/2] Starting Django Backend Server...
start "PixelTales Backend" cmd /k "cd /d d:\Development\PixelTales\backend && daphne -b 0.0.0.0 -p 8000 storybookapi.asgi:application"

echo Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

echo.
echo [2/2] Starting React Frontend Server...
start "PixelTales Frontend" cmd /k "cd /d d:\Development\PixelTales\frontend && npm run dev"

echo.
echo ========================================
echo Servers Starting!
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3001
echo Admin:    http://localhost:3001/admin
echo.
echo Press any key to close this window...
pause >nul
