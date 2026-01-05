@echo off
echo ========================================
echo   Change Network to Private
echo ========================================
echo.
echo This will allow devices to communicate!
echo.
pause

echo.
echo Current network status:
powershell -Command "Get-NetConnectionProfile | Select-Object Name, NetworkCategory"
echo.

echo Changing to Private...
powershell -Command "Get-NetConnectionProfile | Where-Object {$_.NetworkCategory -eq 'Public'} | Set-NetConnectionProfile -NetworkCategory Private"

echo.
echo New network status:
powershell -Command "Get-NetConnectionProfile | Select-Object Name, NetworkCategory"
echo.

echo ========================================
echo   Done!
echo ========================================
echo.
echo Your network should now be set to Private.
echo This allows incoming connections for local development.
echo.
echo Next steps:
echo 1. Test from phone browser: http://192.168.254.111:8000/api/
echo 2. If it works, configure Developer Mode with that URL
echo 3. Test collaboration!
echo.
pause
