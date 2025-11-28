# Start Daphne ASGI Server for Django Channels
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Starting Daphne ASGI Server" -ForegroundColor Cyan
Write-Host "(Required for WebSocket support)" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Change to script directory
Set-Location $PSScriptRoot

# Check if daphne is installed
$daphneCheck = python -m pip show daphne 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Daphne is not installed!" -ForegroundColor Red
    Write-Host "Install it with: pip install daphne" -ForegroundColor Yellow
    exit 1
}

Write-Host "Starting Daphne on 0.0.0.0:8000..." -ForegroundColor Green
Write-Host "WebSockets will be available at ws://localhost:8000/ws/" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

# Start Daphne
python -m daphne -b 0.0.0.0 -p 8000 storybookapi.asgi:application
