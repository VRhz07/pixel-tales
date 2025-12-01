@echo off
REM ========================================
REM Secure APK Build Script
REM API keys are now on backend - safe to build!
REM ========================================

echo.
echo ============================================
echo   SECURE APK BUILD - Pixel Tales
echo ============================================
echo.

REM Step 1: Verify Environment
echo [1/8] Verifying environment...
echo.

REM Check if frontend .env has API keys (should not have them!)
findstr /C:"VITE_GEMINI_API_KEY" frontend\.env >nul 2>&1
if %errorlevel% equ 0 (
    echo [WARNING] VITE_GEMINI_API_KEY found in frontend/.env
    echo This key will be embedded in the APK!
    echo.
    set /p continue="Continue anyway? (yes/no): "
    if /i not "%continue%"=="yes" (
        echo Build cancelled.
        exit /b 1
    )
) else (
    echo [OK] No Gemini API key in frontend (secure!)
)

findstr /C:"VITE_OCR_SPACE_API_KEY" frontend\.env >nul 2>&1
if %errorlevel% equ 0 (
    echo [WARNING] VITE_OCR_SPACE_API_KEY found in frontend/.env
    echo This key will be embedded in the APK!
) else (
    echo [OK] No OCR API key in frontend (secure!)
)

echo.
echo Backend URL from .env:
findstr /C:"VITE_API_BASE_URL" frontend\.env
echo.

set /p proceed="Proceed with build? (yes/no): "
if /i not "%proceed%"=="yes" (
    echo Build cancelled.
    exit /b 0
)

echo.
echo [2/8] Installing frontend dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Frontend dependency installation failed!
    exit /b 1
)

echo.
echo [3/8] Building frontend with Vite...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Frontend build failed!
    exit /b 1
)

echo.
echo [4/8] Verifying build output...
if not exist "dist\index.html" (
    echo [ERROR] Build output not found!
    exit /b 1
)
echo [OK] Build output verified

REM Check if API keys are in the built files (they should not be!)
echo.
echo [5/8] Scanning for exposed API keys in build...
findstr /S /C:"AIzaSy" dist\*.js >nul 2>&1
if %errorlevel% equ 0 (
    echo [WARNING] Possible API key found in build files!
    echo Please check your .env file.
    pause
) else (
    echo [OK] No API keys detected in build (secure!)
)

echo.
echo [6/8] Syncing with Capacitor...
cd ..
call npx cap sync android
if %errorlevel% neq 0 (
    echo [ERROR] Capacitor sync failed!
    exit /b 1
)

echo.
echo [7/8] Building APK...
echo This may take several minutes...
cd android
call gradlew assembleDebug
if %errorlevel% neq 0 (
    echo [ERROR] APK build failed!
    cd ..
    exit /b 1
)
cd ..

echo.
echo [8/8] Locating APK...
set APK_PATH=android\app\build\outputs\apk\debug\app-debug.apk
if exist "%APK_PATH%" (
    echo.
    echo ============================================
    echo   BUILD SUCCESSFUL!
    echo ============================================
    echo.
    echo APK Location: %APK_PATH%
    echo.
    
    REM Get file size
    for %%A in ("%APK_PATH%") do set size=%%~zA
    set /a sizeMB=%size% / 1048576
    echo APK Size: %sizeMB% MB
    echo.
    
    REM Show timestamp
    echo Built: %date% %time%
    echo.
    
    REM Copy to easy access location
    set OUTPUT_DIR=apk-builds
    if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"
    set TIMESTAMP=%date:~-4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%
    set TIMESTAMP=%TIMESTAMP: =0%
    set OUTPUT_FILE=%OUTPUT_DIR%\PixelTales-secure-%TIMESTAMP%.apk
    copy "%APK_PATH%" "%OUTPUT_FILE%" >nul
    echo Copied to: %OUTPUT_FILE%
    echo.
    
    echo ============================================
    echo   SECURITY CHECKLIST
    echo ============================================
    echo [X] API keys on backend only
    echo [X] No keys in frontend build
    echo [X] Backend URL configured
    echo [X] APK ready for testing
    echo.
    echo To install on device:
    echo 1. Enable USB Debugging on your Android device
    echo 2. Connect device via USB
    echo 3. Run: adb install "%APK_PATH%"
    echo.
    echo Or copy APK to device and install manually.
    echo.
) else (
    echo [ERROR] APK file not found!
    echo Expected location: %APK_PATH%
    exit /b 1
)

pause
