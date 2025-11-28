#!/bin/bash

# Pixel Tales Mobile Build Script
# This script automates the build process for Android APK

set -e  # Exit on error

echo "🚀 Pixel Tales Mobile Build Script"
echo "===================================="
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the root directory
if [ ! -d "frontend" ]; then
    echo -e "${RED}❌ Error: Must run this script from the project root directory${NC}"
    exit 1
fi

# Check if node_modules exists in frontend
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules not found. Installing dependencies...${NC}"
    cd frontend
    npm install
    cd ..
fi

# Step 1: Build Frontend
echo -e "${GREEN}📦 Step 1: Building frontend...${NC}"
cd frontend
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend build failed!${NC}"
    exit 1
fi
cd ..

echo -e "${GREEN}✅ Frontend built successfully${NC}"
echo ""

# Step 2: Check if Capacitor is initialized
if [ ! -d "android" ]; then
    echo -e "${YELLOW}⚠️  Android platform not found. Have you run 'npx cap add android'?${NC}"
    read -p "Would you like to add Android platform now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}📱 Adding Android platform...${NC}"
        npx cap add android
    else
        echo -e "${RED}❌ Cannot continue without Android platform${NC}"
        exit 1
    fi
fi

# Step 3: Sync Capacitor
echo -e "${GREEN}🔄 Step 2: Syncing Capacitor...${NC}"
npx cap sync

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Capacitor sync failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Capacitor synced successfully${NC}"
echo ""

# Step 4: Reminder about permissions
echo -e "${YELLOW}⚠️  IMPORTANT REMINDER:${NC}"
echo "   Make sure you have added all required permissions to:"
echo "   android/app/src/main/AndroidManifest.xml"
echo ""
echo "   See ANDROID_MANIFEST_EXAMPLE.xml for required permissions."
echo ""

# Step 5: Open in Android Studio
echo -e "${GREEN}🎨 Step 3: Opening Android Studio...${NC}"
echo "   Once Android Studio opens:"
echo "   1. Wait for Gradle sync to complete"
echo "   2. Go to Build > Build Bundle(s) / APK(s) > Build APK(s)"
echo "   3. Find your APK in: android/app/build/outputs/apk/debug/"
echo ""

read -p "Press Enter to open Android Studio..."
npx cap open android

echo ""
echo -e "${GREEN}✅ Build process initiated successfully!${NC}"
echo ""
echo "Next steps:"
echo "  1. Wait for Android Studio to open"
echo "  2. Let Gradle sync complete"
echo "  3. Build the APK"
echo "  4. Install on your device and test!"
echo ""
echo "For troubleshooting, see CAPACITOR_SETUP.md"
