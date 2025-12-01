#!/bin/bash

echo "========================================"
echo "   FRESH APK REBUILD SCRIPT"
echo "========================================"
echo ""

echo "[1/6] Cleaning old build files..."
cd frontend
rm -rf dist
rm -rf node_modules/.vite
echo "✓ Clean complete"
echo ""

echo "[2/6] Building frontend..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed!"
    exit 1
fi
echo "✓ Frontend build complete"
echo ""

cd ..

echo "[3/6] Cleaning Android build cache..."
cd android
rm -rf app/build
rm -rf .gradle
echo "✓ Android cache cleared"
cd ..
echo ""

echo "[4/6] Syncing to Capacitor..."
npx cap sync android
if [ $? -ne 0 ]; then
    echo "❌ Capacitor sync failed!"
    exit 1
fi
echo "✓ Capacitor sync complete"
echo ""

echo "[5/6] Building APK..."
cd android
./gradlew clean assembleDebug
if [ $? -ne 0 ]; then
    echo "❌ APK build failed!"
    cd ..
    exit 1
fi
cd ..
echo "✓ APK build complete"
echo ""

echo "[6/6] Locating APK..."
APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK_PATH" ]; then
    echo "========================================"
    echo "   ✓ BUILD SUCCESSFUL!"
    echo "========================================"
    echo ""
    echo "APK Location: $APK_PATH"
    echo "File size: $(ls -lh $APK_PATH | awk '{print $5}')"
    echo ""
    echo "You can now install this APK on your device."
else
    echo "❌ APK not found at expected location!"
fi

echo ""
echo "Press Enter to continue..."
read
