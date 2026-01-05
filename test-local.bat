@echo off
REM ================================
REM Local APK Testing Setup Script
REM ================================
REM This script helps you test your APK locally with your laptop's backend
REM No need to rebuild when your IP changes!

echo.
echo ========================================
echo   Pixel Tales - Local Testing Setup
echo ========================================
echo.

REM Step 1: Check if ADB is available
echo [1/4] Checking ADB connection...
adb version >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: ADB not found!
    echo.
    echo Please install Android SDK Platform Tools:
    echo https://developer.android.com/tools/releases/platform-tools
    echo.
    echo Or add ADB to your PATH if already installed.
    pause
    exit /b 1
)
echo      ADB found!

REM Step 2: Check if device is connected
echo.
echo [2/4] Checking device connection...
adb devices | findstr /R "device$" >nul
if errorlevel 1 (
    echo.
    echo ERROR: No device connected!
    echo.
    echo Please connect your phone via USB and enable USB debugging.
    echo Then run this script again.
    pause
    exit /b 1
)
echo      Device connected!

REM Step 3: Set up port forwarding
echo.
echo [3/4] Setting up port forwarding...
adb reverse tcp:8000 tcp:8000
if errorlevel 1 (
    echo.
    echo ERROR: Failed to set up port forwarding!
    echo Make sure your device allows USB debugging.
    pause
    exit /b 1
)
echo      Port forwarding active: Phone can now access localhost:8000

REM Step 4: Reminder to start backend
echo.
echo [4/4] Backend setup check...
echo.
echo ========================================
echo   IMPORTANT: Start Your Backend!
echo ========================================
echo.
echo If you haven't already, open a NEW terminal and run:
echo.
echo    cd backend
echo    python manage.py runserver
echo.
echo The backend should be running on http://localhost:8000
echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Your phone can now communicate with your local backend.
echo The APK will connect to: http://localhost:8000/api
echo.
echo This setup persists until you:
echo   - Disconnect the USB cable
echo   - Restart your phone
echo   - Stop ADB server
echo.
echo Just run this script again after any of those events.
echo.
echo ========================================
echo.
pause
