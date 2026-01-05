@echo off
REM ================================
REM USB Testing Setup (Bypass WiFi)
REM ================================
REM This method works even when WiFi doesn't!

echo.
echo ========================================
echo   USB Testing Setup for Pixel Tales
echo ========================================
echo.
echo This method bypasses WiFi/router issues completely!
echo.
echo Prerequisites:
echo   1. Phone connected via USB
echo   2. USB Debugging enabled on phone
echo   3. ADB installed
echo.
pause

REM Check ADB
echo.
echo [1/4] Checking ADB installation...
adb version >nul 2>&1
if errorlevel 1 (
    echo.
    echo ❌ ERROR: ADB not found!
    echo.
    echo Download Android SDK Platform Tools:
    echo https://developer.android.com/tools/releases/platform-tools
    echo.
    echo Extract and add to PATH, or run this script from that folder.
    echo.
    pause
    exit /b 1
)
echo ✅ ADB found!

REM Check device
echo.
echo [2/4] Checking phone connection...
adb devices > tmp_devices.txt
findstr /R "device$" tmp_devices.txt >nul
if errorlevel 1 (
    echo.
    echo ❌ ERROR: No device connected!
    echo.
    echo Steps to fix:
    echo 1. Connect phone via USB cable
    echo 2. Enable Developer Options (tap Build Number 7 times)
    echo 3. Enable USB Debugging in Developer Options
    echo 4. Accept "Allow USB Debugging" prompt on phone
    echo 5. Run this script again
    echo.
    pause
    exit /b 1
)
del tmp_devices.txt
echo ✅ Phone connected!
adb devices | findstr /V "List"
echo.

REM Set up port forwarding
echo.
echo [3/4] Setting up port forwarding...
adb reverse tcp:8000 tcp:8000
if errorlevel 1 (
    echo.
    echo ❌ ERROR: Failed to set up port forwarding!
    echo.
    echo Make sure USB debugging is authorized on your phone.
    echo.
    pause
    exit /b 1
)
echo ✅ Port forwarding active!
echo    Phone's localhost:8000 → Your laptop's localhost:8000

REM Test backend
echo.
echo [4/4] Checking backend...
curl -s http://localhost:8000/api/ >nul 2>&1
if errorlevel 1 (
    echo.
    echo ⚠️  WARNING: Backend not running!
    echo.
    echo Start your backend in another terminal:
    echo    cd backend
    echo    python manage.py runserver
    echo.
    echo Note: With USB, you can use just "runserver" (no need for 0.0.0.0:8000)
    echo.
) else (
    echo ✅ Backend is running!
)

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Your phone can now access your backend via USB!
echo.
echo In Developer Mode, use:
echo    http://localhost:8000
echo.
echo This works because:
echo   Phone localhost:8000 → USB cable → Laptop localhost:8000
echo.
echo ========================================
echo   Important Notes:
echo ========================================
echo.
echo • Keep USB connected while testing
echo • Port forwarding persists even when phone sleeps
echo • If connection lost, just run this script again
echo • No WiFi needed!
echo • No IP addresses to manage!
echo.
echo ========================================
echo.
pause
