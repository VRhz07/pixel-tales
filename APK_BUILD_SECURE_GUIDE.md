# 📱 Secure APK Build Guide - No More API Key Leaks!

## 🔒 What's Different Now?

### **Before (INSECURE):**
```
APK contained:
  ❌ VITE_GEMINI_API_KEY embedded in JavaScript
  ❌ Anyone could decompile and extract keys
  ❌ Keys exposed in plain text
```

### **After (SECURE):**
```
APK contains:
  ✅ Only backend URL (safe to share)
  ✅ No API keys at all
  ✅ All sensitive calls go through backend
  ✅ Backend requires authentication
```

---

## 🚀 Quick Build (Windows)

```powershell
# Simple method - just run this:
.\build-secure-apk.bat
```

### **What the script does:**
1. ✅ Checks for API keys in frontend (warns if found)
2. ✅ Builds frontend with Vite
3. ✅ Scans build for exposed keys
4. ✅ Syncs with Capacitor
5. ✅ Builds Android APK
6. ✅ Copies APK to `apk-builds/` folder
7. ✅ Shows security checklist

---

## 🚀 Quick Build (Linux/Mac)

```bash
# Make script executable
chmod +x build-secure-apk.sh

# Run the build
./build-secure-apk.sh
```

---

## 📋 Prerequisites

### **1. Verify Frontend .env**

Your `frontend/.env` should look like this:

```bash
# ✅ CORRECT - Only backend URL
VITE_API_BASE_URL=https://pixeltales-backend.onrender.com/api

# ❌ REMOVE THESE - No longer needed
# VITE_GEMINI_API_KEY=...
# VITE_OCR_SPACE_API_KEY=...
```

### **2. Verify Backend is Running**

Test your backend:
```bash
curl https://pixeltales-backend.onrender.com/api/ai/status/
```

Should return: `{"detail":"Authentication credentials were not provided."}`  
(This is correct - it means backend is running and requires auth!)

### **3. Software Requirements**

- ✅ Node.js 18+ (you have v22.20.0 ✓)
- ✅ NPM (you have 10.9.3 ✓)
- ✅ Capacitor CLI (you have 7.4.4 ✓)
- ✅ Android Studio or Android SDK
- ✅ Java JDK 11+

---

## 🛠️ Manual Build Steps

If you prefer to build manually:

### **Step 1: Clean Previous Builds**
```bash
cd frontend
rm -rf dist node_modules/.vite
npm install
```

### **Step 2: Build Frontend**
```bash
npm run build
```

### **Step 3: Verify No Keys in Build**
```bash
# This should return NOTHING:
grep -r "AIzaSy" dist/
grep -r "GEMINI_API_KEY" dist/

# ✅ No results = Secure!
```

### **Step 4: Sync with Capacitor**
```bash
cd ..
npx cap sync android
```

### **Step 5: Open in Android Studio (Optional)**
```bash
npx cap open android
```
Then build from Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**

### **Step 6: Or Build from Command Line**
```bash
cd android
./gradlew assembleDebug
# or on Windows:
gradlew.bat assembleDebug
```

### **Step 7: Find Your APK**
```
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 📲 Installing the APK

### **Method 1: Via USB (Recommended)**
```bash
# Enable USB Debugging on your Android device first!

# Install APK
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Or reinstall if already installed
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

### **Method 2: Manual Install**
1. Copy APK to your device (via USB, email, cloud storage, etc.)
2. Open the APK file on your device
3. Android will prompt to install
4. Enable "Install from Unknown Sources" if needed
5. Tap "Install"

### **Method 3: Wireless ADB**
```bash
# Connect device to same WiFi network
adb tcpip 5555
adb connect <device-ip>:5555
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 🔍 Security Verification

### **After building, verify security:**

```bash
# 1. Check APK doesn't contain API keys
unzip -p android/app/build/outputs/apk/debug/app-debug.apk assets/index.*.js | grep -o "AIzaSy"

# Should output: NOTHING

# 2. Check what URLs are in the APK (backend URL is OK)
unzip -p android/app/build/outputs/apk/debug/app-debug.apk assets/index.*.js | grep -o "https://[^\"]*"

# Should show: https://pixeltales-backend.onrender.com/api (this is fine!)
```

---

## 🧪 Testing the APK

### **1. Install and Open**
- Install APK on device
- Open Pixel Tales app

### **2. Test Authentication**
- Try to register/login
- Should connect to backend

### **3. Test AI Features**
- Create a new story
- Try "AI Assistant" mode
- Generate a story
- Should work via backend proxy!

### **4. Test Photo Story**
- Try Photo Story feature
- Upload a photo
- Should use backend OCR

### **5. Check Network Requests**
Use Chrome DevTools via USB debugging:
```bash
chrome://inspect
```
Then check Network tab - all requests should go to your backend, not directly to Gemini!

---

## 🐛 Troubleshooting

### **Build Fails at Frontend Build**
```bash
cd frontend
rm -rf node_modules dist
npm install
npm run build
```

### **Capacitor Sync Fails**
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap sync android
```

### **Gradle Build Fails**
```bash
cd android
./gradlew clean
./gradlew assembleDebug
```

### **APK Won't Install**
- Enable "Install from Unknown Sources" in Settings
- Uninstall old version first
- Check device has enough storage

### **App Crashes on Open**
- Check backend URL is correct in `.env`
- Verify backend is running
- Check Android logs: `adb logcat | grep Pixel`

---

## 🆚 Build Variants

### **Debug APK (for testing):**
```bash
cd android
./gradlew assembleDebug
# Output: app-debug.apk (~30-50 MB)
```

### **Release APK (for distribution):**
```bash
# First, create a keystore (one-time setup)
keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000

# Then build
./gradlew assembleRelease
# Output: app-release.apk (smaller, optimized)
```

---

## 📊 APK Size Optimization

Your APK might be large. To reduce size:

### **1. Enable ProGuard/R8 (minification)**
Edit `android/app/build.gradle`:
```gradle
buildTypes {
    release {
        minifyEnabled true  // Enable this
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
}
```

### **2. Build Release APK**
Release builds are smaller than debug builds.

### **3. Generate AAB (Android App Bundle)**
```bash
./gradlew bundleRelease
```
AABs are smaller and Google Play optimizes them per device.

---

## 🔐 Environment Configuration

### **Development:**
```bash
# frontend/.env
VITE_API_BASE_URL=http://192.168.1.16:8000/api  # Your local PC IP
```

### **Production:**
```bash
# frontend/.env
VITE_API_BASE_URL=https://pixeltales-backend.onrender.com/api
```

**Note:** Change this based on where you're testing!

---

## ✅ Build Checklist

Before building APK:

- [ ] Backend is running on Render
- [ ] Backend has `GOOGLE_AI_API_KEY` environment variable set
- [ ] Frontend `.env` has backend URL only (no API keys)
- [ ] Frontend builds successfully (`npm run build`)
- [ ] No API keys found in `frontend/dist/` files
- [ ] Capacitor sync successful
- [ ] Android build successful
- [ ] APK tested on device
- [ ] AI features work through backend

---

## 📝 Build Output

After successful build, you'll find:

```
apk-builds/
  ├── PixelTales-secure-20250128_143022.apk
  ├── PixelTales-secure-20250128_150133.apk
  └── ...

android/app/build/outputs/apk/debug/
  └── app-debug.apk  (latest build)
```

---

## 🎉 Success Criteria

Your APK is secure when:

1. ✅ No API keys in `frontend/.env` (except backend URL)
2. ✅ Build completes without warnings
3. ✅ Security scan finds no keys in APK
4. ✅ App connects to backend successfully
5. ✅ AI features work through backend proxy
6. ✅ Authentication required for all API calls

---

## 📞 Support

If you encounter issues:

1. Check [SECURITY_SETUP.md](SECURITY_SETUP.md) for backend setup
2. Verify [QUICK_ACTIONS_REQUIRED.md](QUICK_ACTIONS_REQUIRED.md) steps completed
3. Review [API_KEY_SECURITY_FIX_SUMMARY.md](API_KEY_SECURITY_FIX_SUMMARY.md) for architecture details
4. Check backend logs on Render dashboard
5. Use `adb logcat` to check Android logs

---

**Status:** ✅ Ready to build secure APK!  
**Build Time:** ~5-10 minutes  
**APK Size:** ~30-50 MB (debug) / ~15-25 MB (release)

**Next Step:** Run `.\build-secure-apk.bat` or `./build-secure-apk.sh`
