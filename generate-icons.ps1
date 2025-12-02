# Android Icon Generator Script
# Generates all required icon sizes from source image

param(
    [string]$SourceImage = "frontend\public\app-icon.jpg",
    [string]$OutputDir = "android\app\src\main\res"
)

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   Android Icon Generator - Pixel Tales" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check if source image exists
if (-not (Test-Path $SourceImage)) {
    Write-Host "[ERROR] Source image not found: $SourceImage" -ForegroundColor Red
    exit 1
}

Write-Host "[INFO] Source image: $SourceImage" -ForegroundColor Green
Write-Host ""

# Load System.Drawing assembly
Add-Type -AssemblyName System.Drawing

# Load source image
$sourceImg = [System.Drawing.Image]::FromFile((Resolve-Path $SourceImage))
Write-Host "[INFO] Source dimensions: $($sourceImg.Width) x $($sourceImg.Height)" -ForegroundColor Green

# Define icon sizes for Android
$iconSizes = @{
    "mipmap-mdpi" = 48
    "mipmap-hdpi" = 72
    "mipmap-xhdpi" = 96
    "mipmap-xxhdpi" = 144
    "mipmap-xxxhdpi" = 192
}

$foregroundSizes = @{
    "mipmap-mdpi" = 108
    "mipmap-hdpi" = 162
    "mipmap-xhdpi" = 216
    "mipmap-xxhdpi" = 324
    "mipmap-xxxhdpi" = 432
}

Write-Host ""
Write-Host "[1/2] Generating launcher icons..." -ForegroundColor Yellow

foreach ($density in $iconSizes.Keys) {
    $size = $iconSizes[$density]
    $outputPath = Join-Path $OutputDir "$density\ic_launcher.png"
    
    # Create directory if it doesn't exist
    $dir = Split-Path $outputPath -Parent
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    
    # Create resized bitmap
    $bitmap = New-Object System.Drawing.Bitmap $size, $size
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    
    # Set high quality rendering
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    # Draw resized image
    $graphics.DrawImage($sourceImg, 0, 0, $size, $size)
    
    # Save to file
    $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    # Cleanup
    $graphics.Dispose()
    $bitmap.Dispose()
    
    $sizeText = "$size" + "x" + "$size"
    Write-Host "  [OK] Generated $density/ic_launcher.png ($sizeText)" -ForegroundColor Green
    
    # Also create ic_launcher_round.png
    $roundPath = Join-Path $OutputDir "$density\ic_launcher_round.png"
    Copy-Item $outputPath $roundPath
    Write-Host "  [OK] Generated $density/ic_launcher_round.png ($sizeText)" -ForegroundColor Green
}

Write-Host ""
Write-Host "[2/2] Generating foreground icons..." -ForegroundColor Yellow

foreach ($density in $foregroundSizes.Keys) {
    $size = $foregroundSizes[$density]
    $outputPath = Join-Path $OutputDir "$density\ic_launcher_foreground.png"
    
    # Create directory if it doesn't exist
    $dir = Split-Path $outputPath -Parent
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    
    # Create resized bitmap
    $bitmap = New-Object System.Drawing.Bitmap $size, $size
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    
    # Set high quality rendering
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    # Draw resized image
    $graphics.DrawImage($sourceImg, 0, 0, $size, $size)
    
    # Save to file
    $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    # Cleanup
    $graphics.Dispose()
    $bitmap.Dispose()
    
    $sizeText = "$size" + "x" + "$size"
    Write-Host "  [OK] Generated $density/ic_launcher_foreground.png ($sizeText)" -ForegroundColor Green
}

# Cleanup
$sourceImg.Dispose()

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "   Icon Generation Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Icons have been generated in:" -ForegroundColor Cyan
Write-Host "  $OutputDir" -ForegroundColor White
Write-Host ""
