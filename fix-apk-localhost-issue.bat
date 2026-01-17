@echo off
REM Fix APK that was built with localhost URL baked in

echo.
echo ========================================
echo   FIX APK LOCALHOST ISSUE
echo ========================================
echo.

echo The problem: Your APK was built with localhost URL baked in
echo Solution: Rebuild with production URL as default
echo.

cd frontend

echo [1/3] Updating .env to use DigitalOcean as default...
echo.

REM Backup current .env
copy .env .env.backup.localhost

REM Create new .env with production URL
(
echo # Production Configuration for APK builds
echo # The app can still switch to localhost via Developer Mode
echo.
echo # API Configuration - DIGITALOCEAN ^(default^)
echo VITE_API_BASE_URL=https://pixel-tales-yu7cx.ondigitalocean.app/api
echo.
echo # App Configuration
echo VITE_APP_NAME=Pixel Tales
echo VITE_APP_VERSION=1.0.0
echo.
echo # Feature Flags
echo VITE_ENABLE_AI_FEATURES=true
echo VITE_ENABLE_SOCIAL_FEATURES=true
echo VITE_ENABLE_OFFLINE_MODE=true
echo.
echo # Free User Limits
echo VITE_FREE_USER_STORY_LIMIT=3
echo VITE_FREE_USER_CHARACTER_LIMIT=2
echo VITE_FREE_USER_STORAGE_LIMIT=50
) > .env

echo ✅ Updated .env to use DigitalOcean as default
echo ✅ Backed up old .env to .env.backup.localhost
echo.

cd ..

echo [2/3] Rebuilding APK with correct configuration...
echo.

REM Build the APK
call build-mobile.bat

echo.
echo [3/3] Restoring localhost .env for web development...
echo.

cd frontend
copy .env.backup.localhost .env
del .env.backup.localhost

echo ✅ Restored localhost configuration for web development
echo.

echo ========================================
echo   APK REBUILD COMPLETE!
echo ========================================
echo.
echo The new APK will:
echo ✅ Use DigitalOcean by default ^(works immediately^)
echo ✅ Allow switching to localhost via Developer Mode
echo.
echo To use localhost backend on phone:
echo 1. Install the new APK
echo 2. Tap logo 5 times ^(Developer Mode^)
echo 3. Select "Custom URL"
echo 4. Enter: http://192.168.254.111:8000
echo 5. Save ^& Restart
echo.
echo Your web development still uses localhost!
echo ^(frontend/.env is back to localhost:8000^)
echo.
pause
