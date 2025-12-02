# Beta APK Build Guide - Pixel Tales

This guide explains how to build a **signed release/beta APK** with your custom icon for distribution.

## 🎯 Overview

You have three types of APK builds available:
- **Debug APK**: For development and testing (unsigned)
- **Beta APK**: Signed release APK for testing and distribution
- **Production APK**: Final signed APK for Google Play Store

This guide focuses on building a **Beta APK** with your custom icon.

---

## 📋 Prerequisites

1. **Java JDK** installed (for keytool)
   - Download: https://www.oracle.com/java/technologies/downloads/
   - Verify: `java -version`

2. **Android SDK** installed (usually via Android Studio)

3. **Your custom icon**: `frontend/public/app-icon.jpg` (1024x1024) ✅

---

## 🚀 Quick Start - Step by Step

### Step 1: Generate App Icons

Run the icon generator script to create all required Android icon sizes from your custom icon:

**Windows:**
```batch
powershell -ExecutionPolicy Bypass -File generate-icons.ps1
```

**Linux/Mac:**
```bash
# Convert PowerShell script or use online tools
# Or use Android Asset Studio: https://romannurik.github.io/AndroidAssetStudio/
```

This will generate icons in all required densities:
- `mipmap-mdpi` (48x48)
- `mipmap-hdpi` (72x72)
- `mipmap-xhdpi` (96x96)
- `mipmap-xxhdpi` (144x144)
- `mipmap-xxxhdpi` (192x192)

---

### Step 2: Create Release Keystore

A keystore is required to sign your release APK. This is **critical** - without it, you cannot update your app later!

**Windows:**
```batch
setup-keystore.bat
```

**Linux/Mac:**
```bash
powershell setup-keystore.ps1
# Or run commands manually (see below)
```

You'll be asked to provide:
- **Keystore password**: Choose a strong password (min 6 characters)
- **Key password**: Can be the same as keystore password
- **Key alias**: e.g., `pixeltales-key`
- **Organization name**: e.g., `Pixel Tales Inc`

**⚠️ IMPORTANT:** 
- Back up `android/app/pixeltales-release.keystore` to a secure location
- Save your passwords securely
- Never commit keystore files to Git
- Without this keystore, you **CANNOT** update your app on Google Play

---

### Step 3: Build Beta APK

Now you can build a signed release APK:

**Windows:**
```batch
build-beta-apk.bat
```

**Linux/Mac:**
```bash
chmod +x build-beta-apk.sh
./build-beta-apk.sh
```

The script will:
1. ✅ Verify environment and security
2. 📦 Install dependencies
3. 🔨 Build frontend with Vite
4. 🔄 Sync with Capacitor
5. 🧹 Clean previous builds
6. 🚀 Build signed release APK
7. 📁 Copy APK to `apk-builds/` directory

**Build time:** 3-5 minutes

---

## 📍 Output Location

After a successful build, you'll find:

**Primary location:**
```
android/app/build/outputs/apk/release/app-release.apk
```

**Copied to (for easy access):**
```
apk-builds/PixelTales-beta-YYYYMMDD_HHMMSS.apk
```

---

## 📲 Installing the Beta APK

### Method 1: Direct Install (Recommended)

1. Copy the APK to your Android device
2. Open the APK file on your device
3. Allow "Install from Unknown Sources" if prompted
4. Install and test!

### Method 2: ADB Install

```bash
adb install apk-builds/PixelTales-beta-YYYYMMDD_HHMMSS.apk
```

### Method 3: USB Transfer

1. Connect device via USB
2. Copy APK to device storage
3. Use a file manager on device to open and install

---

## 🔍 Verifying Your Build

### Check APK Signature

```bash
jarsigner -verify -verbose -certs android/app/build/outputs/apk/release/app-release.apk
```

Should show: `jar verified.`

### Check APK Contents

```bash
# Windows (with 7-Zip or similar)
7z l android/app/build/outputs/apk/release/app-release.apk

# Linux/Mac
unzip -l android/app/build/outputs/apk/release/app-release.apk
```

Look for your custom icon in:
- `res/mipmap-mdpi/ic_launcher.png`
- `res/mipmap-hdpi/ic_launcher.png`
- etc.

---

## 🔧 Troubleshooting

### Issue: "keytool not found"
**Solution:** Install Java JDK and add to PATH
- Download: https://www.oracle.com/java/technologies/downloads/
- Add `C:\Program Files\Java\jdk-XX\bin` to system PATH

### Issue: "Keystore password incorrect"
**Solution:** 
- Check `android/keystore.properties` file
- Re-run `setup-keystore.bat` if needed

### Issue: "Build failed with signing errors"
**Solution:**
- Ensure `android/keystore.properties` exists
- Verify keystore file exists at `android/app/pixeltales-release.keystore`
- Check that passwords in properties file are correct

### Issue: "Icons not showing up"
**Solution:**
- Re-run `generate-icons.ps1`
- Clean and rebuild: `cd android && gradlew clean && cd ..`
- Delete `android/app/build` folder and rebuild

---

## 📈 Version Management

To update version for new releases, edit `android/app/build.gradle`:

```groovy
defaultConfig {
    applicationId "com.pixeltales.app"
    versionCode 2          // Increment for each release
    versionName "1.1"      // User-facing version
    ...
}
```

**Version Code Rules:**
- Must be an integer
- Must increment with each release
- Google Play requires this to increase

---

## 🎨 Updating Your Icon

To update the app icon:

1. Replace `frontend/public/app-icon.jpg` with new icon
2. Re-run `generate-icons.ps1`
3. Rebuild: `build-beta-apk.bat`

---

## 🔒 Security Checklist

Before building beta APK:

- [ ] API keys are on backend (not in frontend/.env)
- [ ] Keystore backed up to secure location
- [ ] Passwords stored securely
- [ ] `.gitignore` includes keystore files
- [ ] Backend URL configured correctly

---

## 📊 Comparison: Debug vs Beta vs Production

| Feature | Debug APK | Beta APK | Production APK |
|---------|-----------|----------|----------------|
| Signing | Debug keystore | Release keystore | Release keystore |
| Optimized | No | Yes | Yes |
| Minified | No | Optional | Yes |
| Size | Larger | Smaller | Smallest |
| Updatable | No | Yes (same keystore) | Yes (same keystore) |
| Distribution | Development only | Testing/Beta users | Google Play Store |

---

## 🚀 Next Steps

1. **Test the Beta APK** on multiple devices
2. **Share with beta testers** for feedback
3. **Prepare for Production**: See Google Play publishing guide
4. **Set up CI/CD**: Automate builds with GitHub Actions

---

## 📚 Additional Resources

- [Android App Signing Documentation](https://developer.android.com/studio/publish/app-signing)
- [Capacitor Android Documentation](https://capacitorjs.com/docs/android)
- [Google Play Publishing Guide](https://developer.android.com/distribute/googleplay)

---

## 🆘 Need Help?

If you encounter issues:
1. Check this guide's troubleshooting section
2. Review build logs in `android/app/build/` directory
3. Check Android Studio for detailed error messages

---

**Last Updated:** 2024
**Version:** 1.0
