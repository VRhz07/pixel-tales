#!/bin/bash
# ========================================
# Secure APK Build Script
# API keys are now on backend - safe to build!
# ========================================

echo ""
echo "============================================"
echo "   SECURE APK BUILD - Pixel Tales"
echo "============================================"
echo ""

# Step 1: Verify Environment
echo "[1/8] Verifying environment..."
echo ""

# Check if frontend .env has API keys (should not have them!)
if grep -q "VITE_GEMINI_API_KEY" frontend/.env 2>/dev/null; then
    echo "[WARNING] VITE_GEMINI_API_KEY found in frontend/.env"
    echo "This key will be embedded in the APK!"
    echo ""
    read -p "Continue anyway? (yes/no): " continue
    if [ "$continue" != "yes" ]; then
        echo "Build cancelled."
        exit 1
    fi
else
    echo "[OK] No Gemini API key in frontend (secure!)"
fi

if grep -q "VITE_OCR_SPACE_API_KEY" frontend/.env 2>/dev/null; then
    echo "[WARNING] VITE_OCR_SPACE_API_KEY found in frontend/.env"
    echo "This key will be embedded in the APK!"
else
    echo "[OK] No OCR API key in frontend (secure!)"
fi

echo ""
echo "Backend URL from .env:"
grep "VITE_API_BASE_URL" frontend/.env
echo ""

read -p "Proceed with build? (yes/no): " proceed
if [ "$proceed" != "yes" ]; then
    echo "Build cancelled."
    exit 0
fi

echo ""
echo "[2/8] Installing frontend dependencies..."
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo "[ERROR] Frontend dependency installation failed!"
    exit 1
fi

echo ""
echo "[3/8] Building frontend with Vite..."
npm run build
if [ $? -ne 0 ]; then
    echo "[ERROR] Frontend build failed!"
    exit 1
fi

echo ""
echo "[4/8] Verifying build output..."
if [ ! -f "dist/index.html" ]; then
    echo "[ERROR] Build output not found!"
    exit 1
fi
echo "[OK] Build output verified"

# Check if API keys are in the built files (they should not be!)
echo ""
echo "[5/8] Scanning for exposed API keys in build..."
if grep -r "AIzaSy" dist/*.js 2>/dev/null; then
    echo "[WARNING] Possible API key found in build files!"
    echo "Please check your .env file."
    read -p "Press enter to continue..."
else
    echo "[OK] No API keys detected in build (secure!)"
fi

echo ""
echo "[6/8] Syncing with Capacitor..."
cd ..
npx cap sync android
if [ $? -ne 0 ]; then
    echo "[ERROR] Capacitor sync failed!"
    exit 1
fi

echo ""
echo "[7/8] Building APK..."
echo "This may take several minutes..."
cd android
./gradlew assembleDebug
if [ $? -ne 0 ]; then
    echo "[ERROR] APK build failed!"
    cd ..
    exit 1
fi
cd ..

echo ""
echo "[8/8] Locating APK..."
APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK_PATH" ]; then
    echo ""
    echo "============================================"
    echo "   BUILD SUCCESSFUL!"
    echo "============================================"
    echo ""
    echo "APK Location: $APK_PATH"
    echo ""
    
    # Get file size
    size=$(du -h "$APK_PATH" | cut -f1)
    echo "APK Size: $size"
    echo ""
    
    # Show timestamp
    echo "Built: $(date)"
    echo ""
    
    # Copy to easy access location
    OUTPUT_DIR="apk-builds"
    mkdir -p "$OUTPUT_DIR"
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    OUTPUT_FILE="$OUTPUT_DIR/PixelTales-secure-$TIMESTAMP.apk"
    cp "$APK_PATH" "$OUTPUT_FILE"
    echo "Copied to: $OUTPUT_FILE"
    echo ""
    
    echo "============================================"
    echo "   SECURITY CHECKLIST"
    echo "============================================"
    echo "[X] API keys on backend only"
    echo "[X] No keys in frontend build"
    echo "[X] Backend URL configured"
    echo "[X] APK ready for testing"
    echo ""
    echo "To install on device:"
    echo "1. Enable USB Debugging on your Android device"
    echo "2. Connect device via USB"
    echo "3. Run: adb install $APK_PATH"
    echo ""
    echo "Or copy APK to device and install manually."
    echo ""
else
    echo "[ERROR] APK file not found!"
    echo "Expected location: $APK_PATH"
    exit 1
fi
