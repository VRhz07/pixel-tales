@echo off
REM ========================================
REM Keystore Setup Script for Release APK
REM Creates a keystore for signing release builds
REM ========================================

echo.
echo ============================================
echo   Keystore Setup - Pixel Tales
echo ============================================
echo.

set KEYSTORE_PATH=android\app\pixeltales-release.keystore
set PROPERTIES_PATH=android\keystore.properties

REM Check if keystore already exists
if exist "%KEYSTORE_PATH%" (
    echo [WARNING] Keystore already exists at: %KEYSTORE_PATH%
    set /p overwrite="Do you want to overwrite it? (yes/no): "
    if /i not "!overwrite!"=="yes" (
        echo Setup cancelled.
        exit /b 0
    )
)

echo.
echo Please provide the following information for your keystore:
echo (This information will be needed every time you build a release APK)
echo.

REM Get keystore information from user
set /p STORE_PASSWORD="Enter keystore password (min 6 characters): "
if "%STORE_PASSWORD%"=="" (
    echo [ERROR] Password cannot be empty!
    pause
    exit /b 1
)

set /p KEY_PASSWORD="Enter key password (can be same as keystore password): "
if "%KEY_PASSWORD%"=="" (
    echo [ERROR] Password cannot be empty!
    pause
    exit /b 1
)

set /p KEY_ALIAS="Enter key alias (e.g., pixeltales-key): "
if "%KEY_ALIAS%"=="" (
    echo [ERROR] Alias cannot be empty!
    pause
    exit /b 1
)

set /p DNAME="Enter your name or organization (e.g., Pixel Tales Inc): "
if "%DNAME%"=="" (
    set DNAME=Pixel Tales
)

echo.
echo [INFO] Generating keystore...
echo.

REM Check if keytool is available
where keytool >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] keytool not found. Please install Java JDK and ensure keytool is in your PATH.
    echo.
    echo Download Java JDK from: https://www.oracle.com/java/technologies/downloads/
    pause
    exit /b 1
)

REM Generate keystore
keytool -genkeypair -v -storetype JKS -keyalg RSA -keysize 2048 -validity 10000 ^
    -keystore "%KEYSTORE_PATH%" ^
    -alias "%KEY_ALIAS%" ^
    -storepass "%STORE_PASSWORD%" ^
    -keypass "%KEY_PASSWORD%" ^
    -dname "CN=%DNAME%, OU=Development, O=Pixel Tales, L=Unknown, ST=Unknown, C=US"

if %errorlevel% neq 0 (
    echo [ERROR] Keystore generation failed!
    pause
    exit /b 1
)

echo [SUCCESS] Keystore generated successfully!
echo.

REM Create keystore.properties file
echo [INFO] Creating keystore.properties file...

(
echo storePassword=%STORE_PASSWORD%
echo keyPassword=%KEY_PASSWORD%
echo keyAlias=%KEY_ALIAS%
echo storeFile=app/pixeltales-release.keystore
) > "%PROPERTIES_PATH%"

echo [SUCCESS] keystore.properties created!
echo.

REM Update .gitignore
set GITIGNORE_PATH=android\.gitignore
if exist "%GITIGNORE_PATH%" (
    findstr /C:"keystore.properties" "%GITIGNORE_PATH%" >nul 2>&1
    if %errorlevel% neq 0 (
        (
        echo.
        echo # Keystore files
        echo keystore.properties
        echo *.keystore
        echo *.jks
        ) >> "%GITIGNORE_PATH%"
        echo [INFO] Updated android/.gitignore to exclude keystore files
    )
)

echo.
echo ============================================
echo   Keystore Setup Complete!
echo ============================================
echo.
echo IMPORTANT: Keep these files safe and secure!
echo   * Keystore: %KEYSTORE_PATH%
echo   * Properties: %PROPERTIES_PATH%
echo.
echo WARNING: BACKUP REMINDER
echo   1. Copy the keystore file to a secure location
echo   2. Remember your passwords (write them down securely)
echo   3. Without this keystore, you CANNOT update your app in Google Play
echo.
echo Next step: Run build-beta-apk.bat to create a signed release APK
echo.
pause
