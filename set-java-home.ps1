# ====================================================================
# PowerShell Script to set JAVA_HOME to Android Studio's bundled JDK
# This resolves the multiple Gradle daemons warning
# ====================================================================

Write-Host ""
Write-Host "========================================"
Write-Host "Setting JAVA_HOME to Android Studio JDK"
Write-Host "========================================"
Write-Host ""

# Set the Android Studio JDK path
$androidStudioJdk = "D:\DL\Android Studio\jbr"

# Check if the path exists
if (-not (Test-Path $androidStudioJdk)) {
    Write-Host "ERROR: Android Studio JDK not found at:" -ForegroundColor Red
    Write-Host $androidStudioJdk -ForegroundColor Red
    Write-Host ""
    Write-Host "Please verify Android Studio installation path and update this script."
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Current JAVA_HOME: $env:JAVA_HOME"
Write-Host "New JAVA_HOME: $androidStudioJdk"
Write-Host ""

# Set JAVA_HOME for the current session (temporary)
$env:JAVA_HOME = $androidStudioJdk
$env:PATH = "$androidStudioJdk\bin;$env:PATH"

Write-Host "✓ JAVA_HOME set for current session" -ForegroundColor Green
Write-Host ""

# Ask user if they want to set it permanently (system-wide)
Write-Host "Do you want to set JAVA_HOME permanently (system-wide)?"
Write-Host "This will set it for your user account (no admin required)."
Write-Host ""
$response = Read-Host "Set permanently? (Y/N)"

if ($response -eq "Y" -or $response -eq "y") {
    Write-Host ""
    Write-Host "Setting JAVA_HOME permanently..."
    
    try {
        # Set User environment variable (doesn't require admin)
        [System.Environment]::SetEnvironmentVariable("JAVA_HOME", $androidStudioJdk, [System.EnvironmentVariableTarget]::User)
        
        Write-Host "✓ JAVA_HOME set permanently for your user account" -ForegroundColor Green
        Write-Host ""
        Write-Host "IMPORTANT: You need to restart any open terminals/IDEs" -ForegroundColor Yellow
        Write-Host "for the change to take effect." -ForegroundColor Yellow
    }
    catch {
        Write-Host "ERROR: Failed to set JAVA_HOME permanently." -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
}
else {
    Write-Host ""
    Write-Host "Skipping permanent change. JAVA_HOME is only set for this session."
    Write-Host ""
}

Write-Host ""
Write-Host "========================================"
Write-Host "Verifying Java installation..."
Write-Host "========================================"
java -version
Write-Host ""

Write-Host "========================================"
Write-Host "Done!"
Write-Host "========================================"
Write-Host ""
Write-Host "Note: If you set JAVA_HOME permanently, you need to:"
Write-Host "1. Close and reopen Android Studio"
Write-Host "2. Close and reopen any command prompts"
Write-Host "3. Restart any running Gradle daemons: gradlew --stop"
Write-Host ""
Read-Host "Press Enter to exit"
