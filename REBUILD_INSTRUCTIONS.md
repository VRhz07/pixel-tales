# 🔨 Rebuild Instructions - Media Notification

## Why You Need to Rebuild

The media notification feature requires **native Android code** that was just created. This code needs to be compiled into your APK.

## Quick Rebuild (Recommended)

```bash
# Step 1: Build frontend and sync
cd frontend
npm run build
npm run cap:sync

# Step 2: Build APK
cd ..
build-mobile.bat    # Windows
# OR
./build-mobile.sh   # Linux/Mac

# Step 3: Install on device
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

## Full Clean Rebuild (If Issues)

```bash
# Step 1: Clean everything
cd android
./gradlew clean
cd ..

# Step 2: Build frontend
cd frontend
npm run build
npm run cap:sync

# Step 3: Build APK
cd ../android
./gradlew assembleDebug

# Step 4: Install
cd ..
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

## Verify Installation

After installing, test:

1. Open app
2. Go to Story Reader
3. Start TTS playback
4. Pull down notification panel
5. **Should see:** Pixel Tales notification with controls

If not working, check:
```bash
adb logcat | grep MediaNotification
```

Should see plugin load messages.

## What's New in This Build

- ✅ Media notification with play/pause/stop controls
- ✅ Background TTS control
- ✅ Lock screen integration
- ✅ EN-US only voice filtering
- ✅ Specific voice selection
- ✅ WaveNet voices (free tier)

---

**Time to rebuild:** ~2-5 minutes
**File size:** ~50MB APK
