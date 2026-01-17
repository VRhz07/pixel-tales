#!/bin/bash
# Localhost Development Mode Starter
# This script starts both frontend and backend in localhost mode

echo ""
echo "========================================"
echo "  PIXEL TALES - LOCALHOST DEV MODE"
echo "========================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python3 is not installed"
    echo "Please install Python 3.8+ from https://www.python.org/"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "[1/4] Checking Backend Setup..."
cd backend

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "[INFO] Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "[2/4] Installing/Updating Backend Dependencies..."
pip install -r requirements.txt --quiet

# Run migrations
echo "[3/4] Running Database Migrations..."
python manage.py migrate

echo ""
echo "[4/4] Starting Backend Server..."
echo "Backend will be available at: http://localhost:8000"
echo ""

# Start backend in background
python manage.py runserver 8000 &
BACKEND_PID=$!

cd ..

# Wait for backend to start
sleep 3

echo ""
echo "[INFO] Starting Frontend Development Server..."
echo "Frontend will be available at: http://localhost:3000"
echo ""

cd frontend

# Install frontend dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "[INFO] Installing frontend dependencies..."
    npm install
fi

# Copy .env.local to .env to ensure localhost mode
cp .env.local .env

echo ""
echo "========================================"
echo "  SERVERS STARTED!"
echo "========================================"
echo "Backend:  http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all servers"
echo "========================================"
echo ""

# Trap Ctrl+C to kill both processes
trap "kill $BACKEND_PID; exit" INT

# Start frontend
npm run dev

# Cleanup on exit
kill $BACKEND_PID
