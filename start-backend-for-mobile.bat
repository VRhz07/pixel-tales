@echo off
REM Start backend server accessible from mobile devices
REM This makes the backend listen on all network interfaces (0.0.0.0)

echo.
echo ========================================
echo   PIXEL TALES - MOBILE DEVELOPMENT
echo ========================================
echo.

REM Get local IP address
echo [1/4] Finding your laptop's IP address...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set LOCAL_IP=%%a
    goto :found_ip
)

:found_ip
REM Remove leading spaces
set LOCAL_IP=%LOCAL_IP:~1%
echo ✅ Laptop IP: %LOCAL_IP%
echo.

echo [2/4] Starting Backend Server...
cd backend

REM Activate virtual environment
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
) else (
    echo Creating virtual environment...
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
)

echo.
echo ========================================
echo   MOBILE TESTING INSTRUCTIONS
echo ========================================
echo.
echo Your backend will be available at:
echo   📱 Mobile: http://%LOCAL_IP%:8000/api
echo   💻 Desktop: http://localhost:8000/api
echo.
echo TO CONNECT YOUR APK:
echo 1. Build APK normally (build-mobile.bat)
echo 2. Install APK on your phone
echo 3. In the app, tap the logo 5 times
echo 4. Select "Custom URL" preset
echo 5. Enter: http://%LOCAL_IP%:8000
echo 6. Test connection and save
echo.
echo ⚠️  IMPORTANT:
echo - Phone and laptop must be on SAME WiFi
echo - Turn off Windows Firewall if connection fails
echo - Backend must keep running while testing
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

REM Start Django on all interfaces (0.0.0.0)
python manage.py runserver 0.0.0.0:8000

pause
