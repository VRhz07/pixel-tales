@echo off
REM ====================================================================
REM Script to set JAVA_HOME to Android Studio's bundled JDK
REM This resolves the multiple Gradle daemons warning
REM ====================================================================

echo.
echo ========================================
echo Setting JAVA_HOME to Android Studio JDK
echo ========================================
echo.

REM Set the Android Studio JDK path
set "ANDROID_STUDIO_JDK=D:\DL\Android Studio\jbr"

REM Check if the path exists
if not exist "%ANDROID_STUDIO_JDK%" (
    echo ERROR: Android Studio JDK not found at:
    echo %ANDROID_STUDIO_JDK%
    echo.
    echo Please verify Android Studio installation path and update this script.
    pause
    exit /b 1
)

echo Current JAVA_HOME: %JAVA_HOME%
echo New JAVA_HOME: %ANDROID_STUDIO_JDK%
echo.

REM Set JAVA_HOME for the current session (temporary)
set "JAVA_HOME=%ANDROID_STUDIO_JDK%"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo ✓ JAVA_HOME set for current session
echo.

REM Ask user if they want to set it permanently (system-wide)
echo Do you want to set JAVA_HOME permanently (system-wide)?
echo This requires administrator privileges.
echo.
choice /C YN /M "Set permanently (Y/N)"

if errorlevel 2 goto :skip_permanent
if errorlevel 1 goto :set_permanent

:set_permanent
echo.
echo Setting JAVA_HOME permanently...
echo This will open User Account Control prompt - please allow it.
echo.

REM Set User environment variable (doesn't require admin)
setx JAVA_HOME "%ANDROID_STUDIO_JDK%" >nul 2>&1

if errorlevel 1 (
    echo ERROR: Failed to set JAVA_HOME permanently.
    echo You may need to run this script as Administrator.
) else (
    echo ✓ JAVA_HOME set permanently for your user account
    echo.
    echo IMPORTANT: You need to restart any open terminals/IDEs
    echo for the change to take effect.
)

goto :end

:skip_permanent
echo.
echo Skipping permanent change. JAVA_HOME is only set for this session.
echo.

:end
echo.
echo ========================================
echo Verifying Java installation...
echo ========================================
java -version
echo.

echo ========================================
echo Done!
echo ========================================
echo.
echo Note: If you set JAVA_HOME permanently, you need to:
echo 1. Close and reopen Android Studio
echo 2. Close and reopen any command prompts
echo 3. Restart any running Gradle daemons: gradlew --stop
echo.
pause
