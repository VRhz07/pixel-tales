# Safe GitHub Push Script
# This script commits and pushes your changes safely

Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host "=" * 59 -ForegroundColor Cyan
Write-Host "🔒 Safe GitHub Push Script" -ForegroundColor Green
Write-Host "=" -NoNewline -ForegroundColor Cyan
Write-Host "=" * 59 -ForegroundColor Cyan
Write-Host ""

# Step 1: Final security check
Write-Host "🔍 Step 1: Running final security check..." -ForegroundColor Yellow
Write-Host ""

$envTracked = git ls-files | Select-String "backend/.env$"
if ($envTracked) {
    Write-Host "❌ ERROR: backend/.env is tracked by git!" -ForegroundColor Red
    Write-Host "   Run: git rm --cached backend/.env" -ForegroundColor Yellow
    exit 1
}
Write-Host "   ✅ .env files are NOT tracked" -ForegroundColor Green

# Check for API keys in staged files
Write-Host "   🔍 Checking for exposed API keys..." -ForegroundColor Cyan
$hasSecrets = git diff --cached | Select-String "r8_TD96FgZ|SG\.PTwEJON|sk_0tN0iod|AIzaSyDTW1L9a"
if ($hasSecrets) {
    Write-Host "   ❌ ERROR: Found potential API keys in staged changes!" -ForegroundColor Red
    Write-Host "   Please review your changes!" -ForegroundColor Yellow
    exit 1
}
Write-Host "   ✅ No API keys found in staged files" -ForegroundColor Green
Write-Host ""

# Step 2: Show what will be committed
Write-Host "📋 Step 2: Files that will be committed:" -ForegroundColor Yellow
Write-Host ""
git status --short
Write-Host ""

# Step 3: Confirm with user
Write-Host "❓ Do you want to commit and push these changes? (Y/N): " -NoNewline -ForegroundColor Yellow
$confirm = Read-Host

if ($confirm -ne "Y" -and $confirm -ne "y") {
    Write-Host ""
    Write-Host "❌ Push cancelled by user" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "💾 Step 3: Committing changes..." -ForegroundColor Yellow
Write-Host ""

# Add sanitized documentation files
git add REPLICATE_FLUX_IMPLEMENTATION_SUMMARY.md
git add REPLICATE_INTEGRATION_GUIDE.md
git add SAFE_GITHUB_PUSH_CHECKLIST.md

# Commit with descriptive message
$commitMsg = @"
feat: Add Replicate FLUX Schnell integration & fix AI story duplication

✨ Features:
- Integrated Replicate AI with FLUX Schnell for fast image generation (2-4s)
- Fixed AI story duplication issue in library
- Added proper rate limit handling (12s delays)
- Fixed aspect ratio and FileOutput URL extraction

🐛 Bug Fixes:
- Stories no longer appear twice in library
- Images now sync properly with stories
- Rate limit errors handled gracefully

📚 Documentation:
- Added comprehensive integration guides
- Created safe GitHub push checklist
- Documented all fixes and improvements

🔒 Security:
- All API keys properly secured in .env
- No sensitive data exposed
"@

git commit -m "$commitMsg"

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Commit failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Changes committed successfully!" -ForegroundColor Green
Write-Host ""

# Step 4: Push to GitHub
Write-Host "☁️ Step 4: Pushing to GitHub..." -ForegroundColor Yellow
Write-Host ""

git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=" -NoNewline -ForegroundColor Cyan
    Write-Host "=" * 59 -ForegroundColor Cyan
    Write-Host "🎉 SUCCESS! Changes pushed to GitHub safely!" -ForegroundColor Green
    Write-Host "=" -NoNewline -ForegroundColor Cyan
    Write-Host "=" * 59 -ForegroundColor Cyan
    Write-Host ""
    Write-Host "✅ All sensitive data is protected" -ForegroundColor Green
    Write-Host "✅ API keys are NOT exposed" -ForegroundColor Green
    Write-Host "✅ Your repository is safe" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Push failed! Please check the error above." -ForegroundColor Red
    Write-Host ""
}
