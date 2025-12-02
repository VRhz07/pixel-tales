# ========================================
# Keystore Setup Script for Release APK
# Creates a keystore for signing release builds
# ========================================

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   Keystore Setup - Pixel Tales" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$keystorePath = "android\app\pixeltales-release.keystore"
$keystorePropertiesPath = "android\keystore.properties"

# Check if keystore already exists
if (Test-Path $keystorePath) {
    Write-Host "[WARNING] Keystore already exists at: $keystorePath" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (yes/no)"
    if ($overwrite -ne "yes") {
        Write-Host "Setup cancelled." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host ""
Write-Host "Please provide the following information for your keystore:" -ForegroundColor Cyan
Write-Host "(This information will be needed every time you build a release APK)" -ForegroundColor Yellow
Write-Host ""

# Get keystore information from user
$storePassword = Read-Host "Enter keystore password (min 6 characters)" -AsSecureString
$storePasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($storePassword))

if ($storePasswordPlain.Length -lt 6) {
    Write-Host "[ERROR] Password must be at least 6 characters long!" -ForegroundColor Red
    exit 1
}

$keyPassword = Read-Host "Enter key password (can be same as keystore password)" -AsSecureString
$keyPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($keyPassword))

if ($keyPasswordPlain.Length -lt 6) {
    Write-Host "[ERROR] Password must be at least 6 characters long!" -ForegroundColor Red
    exit 1
}

$keyAlias = Read-Host "Enter key alias (e.g., pixeltales-key)"
$dname = Read-Host "Enter your name or organization (e.g., Pixel Tales Inc)"

Write-Host ""
Write-Host "[INFO] Generating keystore..." -ForegroundColor Yellow
Write-Host ""

# Check if keytool is available
$keytool = "keytool"
try {
    & $keytool -help 2>&1 | Out-Null
} catch {
    Write-Host "[ERROR] keytool not found. Please install Java JDK and ensure keytool is in your PATH." -ForegroundColor Red
    exit 1
}

# Generate keystore
$keystoreFullPath = Resolve-Path "android\app" -ErrorAction SilentlyContinue
if (-not $keystoreFullPath) {
    Write-Host "[ERROR] android\app directory not found!" -ForegroundColor Red
    exit 1
}

$keystoreFullPath = Join-Path $keystoreFullPath.Path "pixeltales-release.keystore"

# Create keystore using keytool
$process = Start-Process -FilePath $keytool -ArgumentList @(
    "-genkeypair",
    "-v",
    "-storetype", "JKS",
    "-keyalg", "RSA",
    "-keysize", "2048",
    "-validity", "10000",
    "-keystore", $keystoreFullPath,
    "-alias", $keyAlias,
    "-storepass", $storePasswordPlain,
    "-keypass", $keyPasswordPlain,
    "-dname", "CN=$dname, OU=Development, O=Pixel Tales, L=Unknown, ST=Unknown, C=US"
) -Wait -PassThru -NoNewWindow

if ($process.ExitCode -ne 0) {
    Write-Host "[ERROR] Keystore generation failed!" -ForegroundColor Red
    exit 1
}

Write-Host "[SUCCESS] Keystore generated successfully!" -ForegroundColor Green
Write-Host ""

# Create keystore.properties file
Write-Host "[INFO] Creating keystore.properties file..." -ForegroundColor Yellow

$propertiesContent = @"
storePassword=$storePasswordPlain
keyPassword=$keyPasswordPlain
keyAlias=$keyAlias
storeFile=app/pixeltales-release.keystore
"@

Set-Content -Path $keystorePropertiesPath -Value $propertiesContent

Write-Host "[SUCCESS] keystore.properties created!" -ForegroundColor Green
Write-Host ""

# Update .gitignore
$gitignorePath = "android\.gitignore"
if (Test-Path $gitignorePath) {
    $gitignoreContent = Get-Content $gitignorePath -Raw
    if ($gitignoreContent -notmatch "keystore.properties") {
        Add-Content -Path $gitignorePath -Value "`n# Keystore files`nkeystore.properties`n*.keystore`n*.jks"
        Write-Host "[INFO] Updated android/.gitignore to exclude keystore files" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "   Keystore Setup Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT: Keep these files safe and secure!" -ForegroundColor Red
Write-Host "  • Keystore: $keystorePath" -ForegroundColor Yellow
Write-Host "  • Properties: $keystorePropertiesPath" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  BACKUP REMINDER:" -ForegroundColor Red
Write-Host "  1. Copy the keystore file to a secure location" -ForegroundColor Yellow
Write-Host "  2. Remember your passwords (write them down securely)" -ForegroundColor Yellow
Write-Host "  3. Without this keystore, you CANNOT update your app in Google Play" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next step: Run build-beta-apk.bat to create a signed release APK" -ForegroundColor Cyan
Write-Host ""
