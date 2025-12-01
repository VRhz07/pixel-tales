@echo off
echo ========================================
echo    FRESH APK REBUILD SCRIPT
echo ========================================
echo.

echo [1/6] Cleaning old build files...
cd frontend
if exist dist rmdir /s /q dist
if exist node_modules\.vite rmdir /s /q node_modules\.vite
echo ✓ Clean complete
echo.

echo [2/6] Building frontend...
call npm run build
if errorlevel 1 (
    echo ❌ Frontend build failed!
    pause
    exit /b 1
)
echo ✓ Frontend build complete
echo.

cd ..

echo [3/6] Cleaning Android build cache...
cd android
if exist app\build rmdir /s /q app\build
if exist .gradle rmdir /s /q .gradle
echo ✓ Android cache cleared
cd ..
echo.

echo [4/6] Syncing to Capacitor...
call npx cap sync android
if errorlevel 1 (
    echo ❌ Capacitor sync failed!
    pause
    exit /b 1
)
echo ✓ Capacitor sync complete
echo.

echo [5/6] Building APK...
cd android
call gradlew.bat clean assembleDebug
if errorlevel 1 (
    echo ❌ APK build failed!
    cd ..
    pause
    exit /b 1
)
cd ..
echo ✓ APK build complete
echo.

echo [6/6] Locating APK...
set APK_PATH=android\app\build\outputs\apk\debug\app-debug.apk
if exist "%APK_PATH%" (
    echo ========================================
    echo    ✓ BUILD SUCCESSFUL!
    echo ========================================
    echo.
    echo APK Location: %APK_PATH%
    echo File size: 
    dir "%APK_PATH%" | findstr app-debug.apk
    echo.
    echo You can now install this APK on your device.
) else (
    echo ❌ APK not found at expected location!
)

pause
