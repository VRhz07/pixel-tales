# Run this script as Administrator to allow Vite dev server through Windows Firewall

Write-Host "Adding Windows Firewall rule for Vite dev server..." -ForegroundColor Green

# Allow Node.js through firewall for port 5173
New-NetFirewallRule -DisplayName "Vite Dev Server" -Direction Inbound -Protocol TCP -LocalPort 5173 -Action Allow -Profile Any

Write-Host "Firewall rule added successfully!" -ForegroundColor Green
Write-Host "Try accessing from your phone again." -ForegroundColor Yellow
