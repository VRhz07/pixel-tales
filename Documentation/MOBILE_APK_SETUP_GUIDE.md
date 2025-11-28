# Mobile APK Setup Guide

## When You're Ready to Build APK

This guide will help you create a production Android APK when all features are complete.

---

## Prerequisites

- ✅ All features completed and tested in browser
- ✅ Node.js and npm installed
- ✅ Android Studio installed (for building APK)

---

## Quick Setup (20-30 minutes)

### Step 1: Install Capacitor
```bash
cd frontend
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android
npx cap init
```

**Configuration prompts:**
- App name: `Imaginary Worlds`
- App ID: `com.imaginaryworlds.app`
- Web directory: `dist`

### Step 2: Update capacitor.config.ts
```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.imaginaryworlds.app',
  appName: 'Imaginary Worlds',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
```

### Step 3: Build and Add Android Platform
```bash
npm run build
npx cap add android
npx cap sync
```

### Step 4: Open in Android Studio
```bash
npx cap open android
```

### Step 5: Build APK in Android Studio
1. Wait for Gradle sync to complete
2. Go to: **Build → Build Bundle(s) / APK(s) → Build APK(s)**
3. Wait for build to complete (~2-5 minutes)
4. Click "locate" to find the APK file
5. Transfer APK to phone and install

---

## Development vs Production

### Development Mode (Current - Browser)
- Access via: `http://YOUR_PC_IP:3000`
- Live reload: ✅ Yes
- Laptop needed: ✅ Yes

### Production APK
- Standalone app
- Live reload: ❌ No
- Laptop needed: ❌ No
- Works offline: ✅ Yes

---

## Updating the APK

When you make changes and want to rebuild:

```bash
cd frontend
npm run build
npx cap sync
npx cap open android
# Then build APK again in Android Studio
```

---

## Troubleshooting

### Issue: "Android SDK not found"
**Solution**: Install Android Studio and set ANDROID_HOME environment variable

### Issue: "Gradle build failed"
**Solution**: Open Android Studio, let it download required SDK components

### Issue: "App crashes on phone"
**Solution**: Check browser console for errors, fix them, rebuild

---

## Native Features (Optional)

If you want to add native features later:

### Camera Access
```bash
npm install @capacitor/camera
```

### File System
```bash
npm install @capacitor/filesystem
```

### Share
```bash
npm install @capacitor/share
```

---

## Resources

- [Capacitor Docs](https://capacitorjs.com/docs)
- [Android Studio Download](https://developer.android.com/studio)
- [Capacitor Android Guide](https://capacitorjs.com/docs/android)

---

## Notes

- APK size will be ~50-80MB (includes WebView and your app)
- First build takes longer (~5-10 minutes)
- Subsequent builds are faster (~2-3 minutes)
- You can sign the APK later for Play Store distribution

---

**Status**: Ready to implement when features are complete ✅
