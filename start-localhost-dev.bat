@echo off
REM Localhost Development Mode Starter
REM This script starts both frontend and backend in localhost mode

echo.
echo ========================================
echo   PIXEL TALES - LOCALHOST DEV MODE
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://www.python.org/
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [1/4] Checking Backend Setup...
cd backend

REM Check if virtual environment exists
if not exist "venv" (
    echo [INFO] Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Check if dependencies are installed
echo [2/4] Installing/Updating Backend Dependencies...
pip install -r requirements.txt --quiet

REM Run migrations
echo [3/4] Running Database Migrations...
python manage.py migrate

echo.
echo [4/4] Starting Backend Server...
echo Backend will be available at: http://localhost:8000
echo.

REM Start backend in a new window
start "Pixel Tales Backend (localhost:8000)" cmd /k "cd /d %cd% && call venv\Scripts\activate.bat && python manage.py runserver 8000"

cd ..

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

echo.
echo [INFO] Starting Frontend Development Server...
echo Frontend will be available at: http://localhost:3000
echo.

cd frontend

REM Install frontend dependencies if needed
if not exist "node_modules" (
    echo [INFO] Installing frontend dependencies...
    call npm install
)

REM Copy .env.local to .env to ensure localhost mode
copy /Y .env.local .env >nul

echo.
echo ========================================
echo   SERVERS STARTED!
echo ========================================
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Press Ctrl+C in each window to stop servers
echo ========================================
echo.

REM Start frontend
call npm run dev

pause
