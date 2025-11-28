# Capacitor Mobile App Setup Guide

This guide will help you build the Pixel Tales app as an Android APK with proper permissions, UI handling, and navigation.

## Prerequisites

1. **Node.js and npm** installed
2. **Android Studio** installed
3. **Java JDK 17** or higher installed

## Step 1: Install Capacitor

```bash
cd frontend
npm install @capacitor/core @capacitor/cli @capacitor/android
npm install @capacitor/status-bar @capacitor/keyboard @capacitor/camera @capacitor/filesystem @capacitor/app
```

## Step 2: Initialize Capacitor

The `capacitor.config.ts` file has already been created in the root directory with the following configuration:

- App ID: `com.pixeltales.app`
- App Name: `Pixel Tales`
- Web directory: `frontend/dist`
- Status bar configured to not overlay the web view
- Safe area insets enabled

## Step 3: Build Your Frontend

```bash
cd frontend
npm run build
```

## Step 4: Add Android Platform

```bash
# From the root directory
npx cap add android
```

## Step 5: Configure Android Permissions

Open `android/app/src/main/AndroidManifest.xml` and add the following permissions inside the `<manifest>` tag:

```xml
<!-- Camera and Photo permissions -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"
    android:maxSdkVersion="32" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />

<!-- Microphone permission for audio recording -->
<uses-permission android:name="android.permission.RECORD_AUDIO" />

<!-- Internet permission -->
<uses-permission android:name="android.permission.INTERNET" />

<!-- Network state -->
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

<!-- Camera feature declaration -->
<uses-feature android:name="android.hardware.camera" android:required="false" />
<uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />
```

## Step 6: Sync Capacitor

Every time you make changes to the web app, run:

```bash
npm run build
npx cap sync
```

## Step 7: Open in Android Studio

```bash
npx cap open android
```

## Step 8: Build APK

In Android Studio:

1. Go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**
2. Wait for the build to complete
3. Find your APK in `android/app/build/outputs/apk/debug/app-debug.apk`

For a release APK:

1. Go to **Build > Generate Signed Bundle / APK**
2. Select **APK**
3. Create or select your keystore
4. Choose **release** build variant
5. Find your APK in `android/app/build/outputs/apk/release/`

## Features Implemented

### 1. Permission Handling ✅

The app now includes:
- **Camera permission** - Automatically requested when needed
- **Storage permission** - For saving and loading files
- **Microphone permission** - For audio features

Permissions are handled by:
- `useCapacitorPermissions` hook in `frontend/src/hooks/useCapacitorPermissions.ts`
- Automatic permission requests when features are accessed

### 2. Status Bar & Safe Area ✅

The app properly handles status bars and notches:
- Status bar doesn't overlay content
- Safe area insets applied to all pages
- Canvas drawing tools positioned correctly below status bar
- Bottom toolbar positioned above navigation bar

Implemented via:
- CSS safe area variables in `frontend/src/index.css`
- `viewport-fit=cover` meta tag in `frontend/index.html`
- Status bar configuration in `frontend/src/main.tsx`
- Canvas-specific safe areas in `frontend/src/canvas-studio.css`

### 3. Back Button Navigation ✅

Android back button now works properly:
- Navigates back in history instead of closing the app
- On home page, minimizes app instead of closing
- Implemented in `useCapacitorBackButton` hook

## Usage in Your App

### Requesting Permissions

```typescript
import { useCapacitorPermissions } from './hooks/useCapacitorPermissions';

function MyComponent() {
  const { requestCameraPermission, permissionsGranted } = useCapacitorPermissions();
  
  const handleTakePhoto = async () => {
    const granted = await requestCameraPermission();
    if (granted) {
      // Proceed with camera functionality
    }
  };
}
```

### Using Safe Area Heights

```typescript
import { useStatusBarHeight } from './hooks/useStatusBarHeight';

function MyComponent() {
  const { statusBarHeight, isCapacitor } = useStatusBarHeight();
  
  return (
    <div style={{ paddingTop: statusBarHeight }}>
      {/* Your content */}
    </div>
  );
}
```

### Back Button is Automatic

Just import `useCapacitorBackButton` in your main App component (already done in `App.tsx`):

```typescript
import { useCapacitorBackButton } from './hooks/useCapacitorBackButton';

function App() {
  useCapacitorBackButton(); // That's it!
  // ... rest of your app
}
```

## Testing

### Test on Device

1. Enable USB debugging on your Android device
2. Connect via USB
3. In Android Studio, select your device
4. Click the Run button

### Test Permissions

1. Open the app
2. Navigate to a feature that requires permissions (e.g., camera)
3. The app should automatically request permission
4. Grant the permission
5. The feature should now work

### Test Back Button

1. Navigate through multiple pages
2. Press the Android back button
3. Should navigate back through history
4. On home page, should minimize (not close) the app

### Test Status Bar

1. Open canvas drawing page
2. Verify tools are not hidden under status bar
3. Verify you can access all controls
4. Test on devices with notches/punch holes

## Troubleshooting

### Permissions Not Working

1. Check `AndroidManifest.xml` has all required permissions
2. Run `npx cap sync` after adding permissions
3. Uninstall and reinstall the app on your device

### Status Bar Overlapping

1. Verify `viewport-fit=cover` is in index.html
2. Check CSS safe area variables are defined
3. Ensure `StatusBar.setOverlaysWebView({ overlay: false })` is called

### Back Button Not Working

1. Verify Capacitor App plugin is installed
2. Check browser console for errors
3. Ensure `useCapacitorBackButton` hook is called in App component

### Build Errors

1. Clean build: `cd android && ./gradlew clean`
2. Sync Capacitor: `npx cap sync`
3. Rebuild: `cd android && ./gradlew assembleDebug`

## Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Permissions Guide](https://capacitorjs.com/docs/android/configuration#permissions)
- [Status Bar Plugin](https://capacitorjs.com/docs/apis/status-bar)
- [Camera Plugin](https://capacitorjs.com/docs/apis/camera)

## Next Steps

1. Test thoroughly on different Android devices
2. Customize app icon and splash screen
3. Configure release signing for production
4. Optimize performance for mobile devices
5. Test offline functionality
6. Add analytics and crash reporting

## Notes

- Always run `npm run build` and `npx cap sync` after making changes to your web app
- Test on real devices, not just emulators, especially for permissions
- Keep Capacitor and plugins updated
- The app automatically detects if running in Capacitor and applies mobile-specific styles
