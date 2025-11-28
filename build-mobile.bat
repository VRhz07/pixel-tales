@echo off
REM Pixel Tales Mobile Build Script for Windows
REM This script automates the build process for Android APK

setlocal enabledelayedexpansion

echo.
echo ========================================
echo   Pixel Tales Mobile Build Script
echo ========================================
echo.

REM Check if we're in the root directory
if not exist "frontend" (
    echo [ERROR] Must run this script from the project root directory
    pause
    exit /b 1
)

REM Check if node_modules exists in frontend
if not exist "frontend\node_modules" (
    echo [WARNING] node_modules not found. Installing dependencies...
    cd frontend
    call npm install
    cd ..
)

REM Step 1: Build Frontend
echo [INFO] Step 1: Building frontend...
cd frontend
call npm run build

if errorlevel 1 (
    echo [ERROR] Frontend build failed!
    cd ..
    pause
    exit /b 1
)
cd ..

echo [SUCCESS] Frontend built successfully
echo.

REM Step 2: Check if Capacitor is initialized
if not exist "android" (
    echo [WARNING] Android platform not found. Have you run 'npx cap add android'?
    set /p "response=Would you like to add Android platform now? (y/n): "
    if /i "!response!"=="y" (
        echo [INFO] Adding Android platform...
        call npx cap add android
    ) else (
        echo [ERROR] Cannot continue without Android platform
        pause
        exit /b 1
    )
)

REM Step 3: Sync Capacitor
echo [INFO] Step 2: Syncing Capacitor...
call npx cap sync

if errorlevel 1 (
    echo [ERROR] Capacitor sync failed!
    pause
    exit /b 1
)

echo [SUCCESS] Capacitor synced successfully
echo.

REM Step 4: Reminder about permissions
echo ========================================
echo   IMPORTANT REMINDER
echo ========================================
echo.
echo Make sure you have added all required permissions to:
echo android\app\src\main\AndroidManifest.xml
echo.
echo See ANDROID_MANIFEST_EXAMPLE.xml for required permissions.
echo.

REM Step 5: Open in Android Studio
echo [INFO] Step 3: Opening Android Studio...
echo.
echo Once Android Studio opens:
echo   1. Wait for Gradle sync to complete
echo   2. Go to Build ^> Build Bundle^(s^) / APK^(s^) ^> Build APK^(s^)
echo   3. Find your APK in: android\app\build\outputs\apk\debug\
echo.

pause
call npx cap open android

echo.
echo [SUCCESS] Build process initiated successfully!
echo.
echo Next steps:
echo   1. Wait for Android Studio to open
echo   2. Let Gradle sync complete
echo   3. Build the APK
echo   4. Install on your device and test!
echo.
echo For troubleshooting, see CAPACITOR_SETUP.md
echo.
pause
