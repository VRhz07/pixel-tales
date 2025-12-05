# PowerShell Script: Convert Google Cloud JSON Key to Base64
# For Render deployment

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Google Cloud JSON to Base64 Converter" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Prompt for JSON file path
$jsonPath = Read-Host "Enter the full path to your JSON key file (or drag and drop the file here)"

# Remove quotes if user dragged and dropped
$jsonPath = $jsonPath.Trim('"')

# Check if file exists
if (-Not (Test-Path $jsonPath)) {
    Write-Host "❌ Error: File not found at path: $jsonPath" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check the path and try again." -ForegroundColor Yellow
    pause
    exit
}

Write-Host ""
Write-Host "✅ File found!" -ForegroundColor Green
Write-Host ""

try {
    # Read file and convert to base64
    Write-Host "Converting to base64..." -ForegroundColor Yellow
    $base64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($jsonPath))
    
    # Copy to clipboard
    $base64 | Set-Clipboard
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Base64 string has been copied to your clipboard!" -ForegroundColor Green
    Write-Host ""
    Write-Host "String length: $($base64.Length) characters" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Go to Render Dashboard: https://dashboard.render.com/" -ForegroundColor White
    Write-Host "2. Select your 'pixeltales-backend' service" -ForegroundColor White
    Write-Host "3. Click 'Environment' tab" -ForegroundColor White
    Write-Host "4. Click 'Add Environment Variable'" -ForegroundColor White
    Write-Host "5. Key: GOOGLE_CLOUD_CREDENTIALS_BASE64" -ForegroundColor White
    Write-Host "6. Value: Paste (Ctrl+V) the base64 string" -ForegroundColor White
    Write-Host "7. Click 'Save Changes'" -ForegroundColor White
    Write-Host ""
    Write-Host "Preview (first 100 characters):" -ForegroundColor Cyan
    Write-Host $base64.Substring(0, [Math]::Min(100, $base64.Length)) -ForegroundColor Gray
    Write-Host "..." -ForegroundColor Gray
    Write-Host ""
    
    # Save to file as backup
    $outputPath = Join-Path (Split-Path $jsonPath) "base64_credentials.txt"
    $base64 | Out-File -FilePath $outputPath -Encoding UTF8
    Write-Host "💾 Also saved to file: $outputPath" -ForegroundColor Cyan
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "❌ Error converting file: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
