@echo off
REM Simple launcher for the PowerShell script
powershell -ExecutionPolicy Bypass -File "%~dp0set-java-home.ps1"
pause
