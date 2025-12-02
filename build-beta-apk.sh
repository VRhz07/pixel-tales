#!/bin/bash
# ========================================
# Beta/Release APK Build Script
# Builds a signed release APK for distribution
# ========================================

echo ""
echo "============================================"
echo "   BETA APK BUILD - Pixel Tales"
echo "============================================"
echo ""

# Check if keystore exists
if [ ! -f "android/keystore.properties" ]; then
    echo "[ERROR] Keystore not configured!"
    echo ""
    echo "Please run setup-keystore.sh first to create a keystore."
    echo ""
    exit 1
fi

# Step 1: Verify Environment
echo "[1/9] Verifying environment..."
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

read -p "Proceed with BETA build? (yes/no): " proceed
if [ "$proceed" != "yes" ]; then
    echo "Build cancelled."
    exit 0
fi

echo ""
echo "[2/9] Installing frontend dependencies..."
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo "[ERROR] Frontend dependency installation failed!"
    exit 1
fi

echo ""
echo "[3/9] Building frontend with Vite..."
npm run build
if [ $? -ne 0 ]; then
    echo "[ERROR] Frontend build failed!"
    exit 1
fi

echo ""
echo "[4/9] Verifying build output..."
if [ ! -f "dist/index.html" ]; then
    echo "[ERROR] Build output not found!"
    exit 1
fi
echo "[OK] Build output verified"

# Check if API keys are in the built files (they should not be!)
echo ""
echo "[5/9] Scanning for exposed API keys in build..."
if grep -r "AIzaSy" dist/*.js 2>/dev/null; then
    echo "[WARNING] Possible API key found in build files!"
    echo "Please check your .env file."
    read -p "Press enter to continue..."
else
    echo "[OK] No API keys detected in build (secure!)"
fi

echo ""
echo "[6/9] Syncing with Capacitor..."
cd ..
npx cap sync android
if [ $? -ne 0 ]; then
    echo "[ERROR] Capacitor sync failed!"
    exit 1
fi

echo ""
echo "[7/9] Cleaning previous builds..."
cd android
./gradlew clean
cd ..

echo ""
echo "[8/9] Building RELEASE APK..."
echo "This may take several minutes..."
cd android
./gradlew assembleRelease
if [ $? -ne 0 ]; then
    echo "[ERROR] Release APK build failed!"
    echo ""
    echo "Common issues:"
    echo "  - Keystore password incorrect"
    echo "  - Missing keystore.properties file"
    echo "  - Gradle configuration error"
    echo ""
    cd ..
    exit 1
fi
cd ..

echo ""
echo "[9/9] Locating signed APK..."
APK_PATH="android/app/build/outputs/apk/release/app-release.apk"
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
    OUTPUT_FILE="$OUTPUT_DIR/PixelTales-beta-$TIMESTAMP.apk"
    cp "$APK_PATH" "$OUTPUT_FILE"
    echo "Copied to: $OUTPUT_FILE"
    echo ""
    
    echo "============================================"
    echo "   RELEASE APK INFO"
    echo "============================================"
    echo "[X] Signed with release keystore"
    echo "[X] Optimized and minified"
    echo "[X] Ready for distribution"
    echo "[X] Can be uploaded to Google Play"
    echo ""
    echo "To install on device:"
    echo "1. Enable 'Install from Unknown Sources' on your device"
    echo "2. Copy APK to device"
    echo "3. Open and install"
    echo ""
    echo "OR use ADB:"
    echo "  adb install $OUTPUT_FILE"
    echo ""
    echo "To verify signature:"
    echo "  jarsigner -verify -verbose -certs $APK_PATH"
    echo ""
else
    echo "[ERROR] Release APK file not found!"
    echo "Expected location: $APK_PATH"
    echo ""
    echo "Check the gradle build output above for errors."
    exit 1
fi
