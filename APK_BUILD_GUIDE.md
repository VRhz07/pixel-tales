# 📱 Build APK for Android - Complete Guide

## Prerequisites

Before building the APK, ensure:
- ✅ Backend is deployed to Render.com
- ✅ Frontend `.env` is updated with production API URL
- ✅ You have Android Studio installed (or JDK + Android SDK)

---

## Quick Build Steps

### Step 1: Update Frontend Environment (1 minute)

Edit `frontend/.env`:
```env
# Replace with YOUR Render URL
VITE_API_BASE_URL=https://your-app-name.onrender.com/api

# Keep these
VITE_GEMINI_API_KEY=AIzaSyDZ5fzoP5fy03Y4NibRGL_XG2SzpTXvZR8
VITE_OCR_SPACE_API_KEY=K83029623188957
VITE_APP_NAME=Pixel Tales
VITE_APP_VERSION=1.0.0
```

---

### Step 2: Build Frontend (2 minutes)

```bash
cd frontend
npm install  # If you haven't already
npm run build
```

This creates the `frontend/dist` folder with your production app.

---

### Step 3: Sync with Capacitor (1 minute)

```bash
# From project root (not frontend folder)
cd ..
npx cap sync android
```

This copies your built frontend into the Android project.

---

### Step 4: Build APK (5 minutes)

#### Option A: Using Android Studio (Recommended)

```bash
# Open Android Studio
npx cap open android
```

Then in Android Studio:
1. Wait for Gradle sync to complete
2. Go to **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
3. Wait for build to complete (3-5 minutes)
4. Click **"locate"** in the notification to find your APK

APK Location: `android/app/build/outputs/apk/debug/app-debug.apk`

#### Option B: Command Line Build

```bash
cd android
./gradlew assembleDebug
```

Windows:
```bash
cd android
gradlew.bat assembleDebug
```

---

### Step 5: Install on Your Phone (2 minutes)

#### Via USB:
```bash
# Enable USB debugging on your phone
# Connect phone to computer
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

#### Via File Transfer:
1. Copy `app-debug.apk` to your phone
2. Open file on phone
3. Allow "Install from Unknown Sources" if prompted
4. Install the APK

---

## Testing Your APK

### First Launch Checklist:
- [ ] App launches without crashes
- [ ] Login screen appears
- [ ] Can register new account
- [ ] Can login with credentials
- [ ] Backend connection works (check if stories load)

### Feature Testing:
- [ ] Create manual story
- [ ] Use AI story generation
- [ ] Draw on canvas
- [ ] Upload photos
- [ ] Save and publish stories
- [ ] View library
- [ ] Social features work
- [ ] Notifications work
- [ ] Offline mode works

### Network Testing:
- [ ] Works on WiFi
- [ ] Works on mobile data
- [ ] Handles offline gracefully
- [ ] Syncs when back online

---

## Building Release APK (For Distribution)

### Step 1: Generate Keystore

```bash
# Create keystore (one-time setup)
keytool -genkey -v -keystore my-release-key.keystore -alias pixeltales -keyalg RSA -keysize 2048 -validity 10000
```

Enter details:
- Password: (choose and remember!)
- Name: Your name
- Organization: Your company
- Location: Your city

**Important:** Keep this keystore file safe! You'll need it for all future updates.

---

### Step 2: Update Gradle Config

Edit `android/app/build.gradle`:

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('../../my-release-key.keystore')
            storePassword 'your-password'
            keyAlias 'pixeltales'
            keyPassword 'your-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

---

### Step 3: Build Release APK

```bash
cd android
./gradlew assembleRelease
```

Release APK location: `android/app/build/outputs/apk/release/app-release.apk`

---

## Troubleshooting

### Build Fails

**Error: Node not found**
```bash
# Install Node.js if missing
# Or ensure it's in PATH
```

**Error: Android SDK not found**
```bash
# Install Android Studio
# Or set ANDROID_HOME environment variable
```

**Error: Gradle build failed**
```bash
# Clean and rebuild
cd android
./gradlew clean
./gradlew assembleDebug
```

---

### App Crashes on Launch

**Check logs:**
```bash
adb logcat | grep Pixel
```

**Common issues:**
1. Wrong API URL in `.env`
2. Missing Capacitor plugins
3. Permissions not granted

**Fix:**
```bash
# Rebuild everything from scratch
cd frontend
npm run build
cd ..
npx cap sync android
npx cap open android
# Build → Clean Project
# Build → Rebuild Project
# Build → Build APK
```

---

### Can't Connect to Backend

1. Check `frontend/.env` has correct URL
2. Test API in browser: `https://your-app.onrender.com/api/`
3. Check phone has internet connection
4. Check backend is not sleeping (free tier)
5. Try accessing API from phone browser first

**Debug:**
```bash
# Check what URL is being used
# Look in browser console (Chrome DevTools)
# Or check Android logcat
```

---

### Images Not Loading

1. Check MEDIA_ROOT in backend settings
2. Check CORS allows your domain
3. Check image URLs in API responses
4. Try uploading a new image

---

### Permissions Issues

If camera/storage not working:

Edit `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

---

## APK Optimization

### Reduce APK Size

1. **Enable ProGuard** (already enabled in release builds)
2. **Remove unused resources:**
   ```gradle
   android {
       buildTypes {
           release {
               shrinkResources true
               minifyEnabled true
           }
       }
   }
   ```

3. **Use WebP images** instead of PNG/JPG
4. **Split APKs by architecture:**
   ```gradle
   android {
       splits {
           abi {
               enable true
               reset()
               include 'arm64-v8a', 'armeabi-v7a'
           }
       }
   }
   ```

---

### Improve Performance

1. **Enable Hermes** (faster JavaScript engine):
   
   Edit `android/app/build.gradle`:
   ```gradle
   project.ext.react = [
       enableHermes: true
   ]
   ```

2. **Optimize images** before bundling
3. **Use production build** (automatically done in release)

---

## Distribution

### Share with Beta Testers

1. Upload APK to cloud storage (Google Drive, Dropbox)
2. Share download link
3. Instruct users to enable "Install from Unknown Sources"
4. Get feedback!

### Publish to Google Play Store

1. Create Google Play Developer account ($25 one-time fee)
2. Prepare store listing (screenshots, description, etc.)
3. Upload release APK
4. Submit for review
5. Wait for approval (usually 1-3 days)

---

## Version Management

### Update Version Number

Edit `capacitor.config.ts`:
```typescript
const config: CapacitorConfig = {
  appId: 'com.pixeltales.app',
  appName: 'Pixel Tales',
  appVersion: '1.0.1',  // Update this
  ...
}
```

Edit `android/app/build.gradle`:
```gradle
android {
    defaultConfig {
        versionCode 2        // Increment this (integer)
        versionName "1.0.1"  // Update this (string)
    }
}
```

---

## 🎉 Success!

You now have:
- ✅ Production-ready APK
- ✅ Connected to live backend
- ✅ Ready for testing on real devices

### Next Steps:
1. Install on multiple devices
2. Test all features thoroughly
3. Collect feedback from users
4. Fix bugs and iterate
5. Prepare for Play Store release

---

**APK Size**: ~10-20 MB (debug), ~5-10 MB (release)
**Build Time**: ~5 minutes
**Testing Time**: ~30 minutes for thorough testing

Good luck with your app launch! 🚀
