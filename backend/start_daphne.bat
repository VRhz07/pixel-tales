@echo off
echo ======================================
echo Starting Daphne ASGI Server
echo (Required for WebSocket support)
echo ======================================
echo.

cd /d "%~dp0"

REM Activate virtual environment if it exists
if exist venv\Scripts\activate.bat (
    echo Activating virtual environment...
    call venv\Scripts\activate.bat
) else (
    echo No virtual environment found, using system Python
)

echo.
echo Starting Daphne on 0.0.0.0:8000...
echo WebSockets will be available at ws://localhost:8000/ws/
echo Press Ctrl+C to stop
echo.

daphne -b 0.0.0.0 -p 8000 storybookapi.asgi:application
