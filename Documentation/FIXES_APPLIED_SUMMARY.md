# Fixes Applied - Summary

## Three Issues Fixed

### 1. ✅ Filter to EN-US Only (Not All English)
**Issue:** Device TTS showed en-GB, en-AU, en-CA, etc.
**Fix:** Now filters to **ONLY en-US** and Filipino voices

**Changed:**
```typescript
// Before: Accepted all English variants
const isEnglish = langLower.startsWith('en');

// After: Only EN-US
const isEnglishUS = langLower === 'en-us' || langLower === 'en_us';
```

### 2. ✅ Select Specific Voices (Not Just by Name)
**Issue:** Multiple voices with same name but different languages couldn't be selected individually
**Fix:** Now uses unique identifier combining name + language + index

**Changed:**
```typescript
// Before: Only used voice.name (not unique)
value: voice.name

// After: Uses name + lang + index (unique)
value: `${voice.name}|||${voice.lang}|||${index}`
```

### 3. ⚠️ Media Notification Not Working
**Issue:** Notification doesn't appear when TTS plays
**Root Cause:** App needs to be rebuilt to include the new MediaNotificationPlugin

**Required Action:** Rebuild and reinstall APK

---

## Files Modified

### Frontend
- ✅ `frontend/src/hooks/useTextToSpeech.ts` - EN-US filter + voice selection
- ✅ `frontend/src/components/common/TTSControls.tsx` - Unique voice identification

### Backend
- ✅ `backend/storybook/tts_service.py` - WaveNet voices (free tier)

### Android (Already Created, Need Rebuild)
- ✅ `android/app/src/main/java/com/pixeltales/app/MediaNotificationPlugin.java`
- ✅ `android/app/src/main/java/com/pixeltales/app/MediaButtonReceiver.java`
- ✅ `android/app/src/main/java/com/pixeltales/app/MainActivity.java`
- ✅ `android/app/src/main/AndroidManifest.xml`
- ✅ `android/app/build.gradle`

---

## Testing Checklist

### ✅ EN-US Filter (Frontend Only - No Rebuild Needed)
1. Open app in browser (test on web first)
2. Go to Story Reader → TTS Settings
3. Select "Device Voice"
4. Check voice list - should ONLY show:
   - ✅ en-US voices
   - ✅ fil-PH, tl-PH voices
   - ❌ NO en-GB, en-AU, en-CA, etc.

### ✅ Specific Voice Selection (Frontend Only)
1. Note if there are multiple voices with same name
2. Select different voices
3. Each should work independently
4. Verify correct voice plays

### ⚠️ Media Notification (Requires APK Rebuild)
1. **MUST rebuild APK first** (see below)
2. Install new APK
3. Play story with TTS
4. Pull down notification panel
5. Should see "Pixel Tales" notification with controls

---

## 🚀 BUILD INSTRUCTIONS (For Media Notification)

### Step 1: Build Frontend
```bash
cd frontend
npm run build
npm run cap:sync
```

### Step 2: Build Android APK
**Windows:**
```bash
cd ..
build-mobile.bat
```

**Linux/Mac:**
```bash
cd ..
./build-mobile.sh
```

### Step 3: Install on Device
```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

### Step 4: Test Media Notification
1. Open app
2. Go to Story Reader
3. Click "Listen"
4. Press Home button
5. Pull down notification panel
6. **Should see:** "Pixel Tales - Story Title - Playing - X%"
7. **Should have:** [Pause] [Stop] buttons
8. Test buttons - should control TTS

---

## Expected Results

### Voice Filtering
**Before:**
```
Device Voices (20+ voices):
- en-US-Female-1
- en-US-Male-1
- en-GB-Female-1  ❌ (British)
- en-AU-Male-1    ❌ (Australian)
- en-CA-Female-1  ❌ (Canadian)
- fil-PH-Female-1 ✅
- es-ES-Female-1  ❌ (Spanish)
- fr-FR-Male-1    ❌ (French)
```

**After:**
```
Device Voices (4-8 voices):
- en-US-Female-1  ✅ (US only)
- en-US-Male-1    ✅ (US only)
- en-US-Female-2  ✅ (US only)
- fil-PH-Female-1 ✅ (Filipino)
- fil-PH-Male-1   ✅ (Filipino)
```

### Voice Selection
**Before:**
```
Problem: Can't select specific voice if multiple have same name
Voice List:
- Google US English (en-US)
- Google US English (en-GB)  ← Same name, can't distinguish
```

**After:**
```
Solution: Each voice has unique identifier
Voice List:
- Google US English (en-US)  ← Selectable
- Google UK English (en-GB)  ← Filtered out anyway
```

### Media Notification
**Before:**
```
❌ No notification when TTS plays
❌ Must keep app open
❌ Can't control from background
```

**After:**
```
┌─────────────────────────────────────┐
│ 🎵 Pixel Tales                      │
│ The Magic Forest                    │
│ Playing - 67%                       │
│ [⏸️ Pause]  [⏹️ Stop]               │
└─────────────────────────────────────┘
✅ Shows in notification panel
✅ Control from background
✅ Works on lock screen
```

---

## Why Media Notification Doesn't Work Yet

The MediaNotificationPlugin is **native Android code** (Java), which means:

1. ❌ **NOT** automatically included when you build frontend
2. ❌ **NOT** available until you rebuild the APK
3. ❌ **NOT** hot-reloadable like frontend code

**The Java files were created, but the app needs to be recompiled to include them.**

### To Fix:
```bash
# 1. Sync Capacitor (copies native plugin to Android project)
cd frontend
npm run cap:sync

# 2. Rebuild APK (compiles Java code)
cd ..
./build-mobile.bat  # or build-mobile.sh

# 3. Reinstall (old APK doesn't have plugin)
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Troubleshooting

### EN-US Filter Not Working
**Problem:** Still seeing en-GB, en-AU voices
**Solution:**
1. Clear browser cache (Ctrl+Shift+R)
2. Hard refresh page
3. Check console for filtered voice list

### Voice Selection Not Working
**Problem:** Can't select specific voices
**Solution:**
1. Rebuild frontend: `npm run build`
2. Clear cache and refresh
3. Check dropdown shows unique identifiers

### Media Notification Not Showing
**Problem:** No notification appears
**Solution:**
1. **Did you rebuild APK?** (Most common issue)
2. **Did you reinstall APK?** (Old APK doesn't have plugin)
3. Check notification permissions in Android settings
4. Check Logcat: `adb logcat | grep MediaNotification`
5. Look for errors in console

### Notification Shows But Buttons Don't Work
**Problem:** Notification appears but clicking buttons does nothing
**Solution:**
1. Check MediaButtonReceiver is registered in AndroidManifest.xml
2. Verify dependencies in build.gradle
3. Rebuild with clean: `cd android && ./gradlew clean`
4. Rebuild APK

---

## Quick Test Commands

### Check if Plugin is Registered
```bash
adb logcat | grep "MediaNotification"
```

Should see:
```
MediaNotification: Plugin loaded
MediaNotification: Notification channel created
MediaNotification: Media session setup complete
```

### Check Frontend Logs
Open Chrome DevTools Console, look for:
```
📱 Media notification: Play pressed
📱 Media notification: Pause pressed
📱 Media notification: Stop pressed
```

### Test Voice Filtering
Console should show:
```
📢 TTS: Filtered voices (English & Filipino only): 6 [...]
```

Count should be much lower than before (was 20+, now 4-8)

---

## Summary

| Fix | Status | Requires Rebuild? |
|-----|--------|-------------------|
| EN-US Filter | ✅ Applied | ❌ No (frontend only) |
| Voice Selection | ✅ Applied | ❌ No (frontend only) |
| Media Notification | ✅ Code Created | ⚠️ **YES (APK rebuild required)** |

---

## Next Steps

1. **Test EN-US filter in browser** (should work immediately)
2. **Test voice selection in browser** (should work immediately)
3. **Rebuild APK** to enable media notification
4. **Test all three features** on device

---

**Status:** 2/3 fixes active, 1/3 requires rebuild
**Action Required:** Rebuild APK for media notification
