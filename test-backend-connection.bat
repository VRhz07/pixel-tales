@echo off
REM ================================
REM Backend Connection Test Script
REM ================================
REM This script helps diagnose connection issues

echo.
echo ========================================
echo   Backend Connection Diagnostic
echo ========================================
echo.

REM Get local IP addresses
echo [1/5] Finding your laptop's IP addresses...
echo.
ipconfig | findstr /i "IPv4"
echo.
echo ^ Copy one of the IPv4 addresses above (e.g., 192.168.1.100)
echo.
pause

REM Check if backend is running
echo.
echo [2/5] Checking if backend is running on localhost:8000...
curl -s http://localhost:8000/api/ >nul 2>&1
if errorlevel 1 (
    echo.
    echo ❌ ERROR: Backend is NOT running on localhost:8000
    echo.
    echo Please start your backend with:
    echo    cd backend
    echo    python manage.py runserver 0.0.0.0:8000
    echo.
    echo IMPORTANT: Use 0.0.0.0:8000 not just 8000!
    echo.
    pause
    exit /b 1
) else (
    echo ✅ Backend is running on localhost:8000
)

REM Prompt for IP to test
echo.
echo [3/5] Testing external access...
echo.
set /p TEST_IP="Enter your laptop's IP address (from step 1): "

echo.
echo Testing: http://%TEST_IP%:8000/api/
echo.

curl -s -o nul -w "HTTP Status: %%{http_code}\nTime: %%{time_total}s\n" http://%TEST_IP%:8000/api/
if errorlevel 1 (
    echo.
    echo ❌ ERROR: Cannot access backend from IP address!
    echo.
    echo Possible issues:
    echo 1. Backend not running with 0.0.0.0:8000
    echo 2. Firewall blocking port 8000
    echo 3. Wrong IP address
    echo.
    echo Let's check firewall...
    echo.
) else (
    echo.
    echo ✅ Backend is accessible from IP address!
)

REM Check firewall
echo.
echo [4/5] Checking Windows Firewall...
echo.
netsh advfirewall firewall show rule name=all | findstr /i "8000" >nul 2>&1
if errorlevel 1 (
    echo.
    echo ⚠️  No firewall rule found for port 8000
    echo.
    echo Do you want to create a firewall rule? (Requires Administrator)
    echo.
    set /p CREATE_RULE="Create firewall rule? (y/n): "
    if /i "%CREATE_RULE%"=="y" (
        echo.
        echo Creating firewall rule...
        netsh advfirewall firewall add rule name="Django Dev Server" dir=in action=allow protocol=TCP localport=8000
        if errorlevel 1 (
            echo.
            echo ❌ Failed to create rule. Run this script as Administrator.
            echo.
        ) else (
            echo ✅ Firewall rule created!
        )
    )
) else (
    echo ✅ Firewall rules exist for port 8000
)

REM Test from phone simulation
echo.
echo [5/5] Summary and Next Steps
echo.
echo ========================================
echo.
echo Your laptop's IP: %TEST_IP%
echo Backend URL: http://%TEST_IP%:8000
echo API URL for app: http://%TEST_IP%:8000/api
echo.
echo ========================================
echo   What to Enter in Developer Mode:
echo ========================================
echo.
echo   http://%TEST_IP%:8000
echo.
echo   (The app will automatically add /api)
echo.
echo ========================================
echo   Checklist:
echo ========================================
echo.
echo [ ] Backend running: python manage.py runserver 0.0.0.0:8000
echo [ ] Phone and laptop on same WiFi network
echo [ ] Firewall allows port 8000
echo [ ] Developer Mode configured with: http://%TEST_IP%:8000
echo [ ] App restarted after changing URL
echo.
echo ========================================
echo.

REM Try to open test page
echo Opening test page in browser...
start http://%TEST_IP%:8000/api/
echo.
echo If the page loads in your browser (even an error page), your backend is accessible!
echo.
pause
