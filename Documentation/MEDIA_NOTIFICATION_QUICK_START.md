# Media Notification - Quick Start Guide

## What's New? 🎉

Your TTS story narration now works like Spotify! When listening to a story, you can:
- **Control playback from notification panel** 📱
- **Play/Pause/Stop from anywhere** - even when app is in background
- **See progress in notification** - real-time percentage updates
- **Lock screen controls** - control from lock screen too!

## Visual Preview

### Notification Panel
```
┌─────────────────────────────────────┐
│ 🎵 Pixel Tales                      │
│                                     │
│ The Adventures of Luna              │
│ Playing - 34%                       │
│                                     │
│ [⏸️ Pause]  [⏹️ Stop]               │
└─────────────────────────────────────┘
```

### When Paused
```
┌─────────────────────────────────────┐
│ 🎵 Pixel Tales                      │
│                                     │
│ The Adventures of Luna              │
│ Paused - 34%                        │
│                                     │
│ [▶️ Play]   [⏹️ Stop]               │
└─────────────────────────────────────┘
```

## How to Use

### For Users

1. **Start Reading a Story**
   - Open any story in Story Reader
   - Click the "Listen" button (speaker icon)

2. **Go to Background**
   - Press Home button
   - Or switch to another app
   - Story keeps playing! 🎧

3. **Control from Notification**
   - Pull down notification panel
   - See "Pixel Tales" notification
   - Tap Pause/Play/Stop buttons

4. **Lock Screen Controls**
   - Works even on lock screen
   - Control without unlocking phone

## Build & Deploy

### Step 1: Sync Capacitor
```bash
cd frontend
npm run build
npm run cap:sync
```

### Step 2: Build APK
**Windows:**
```bash
build-mobile.bat
```

**Linux/Mac:**
```bash
./build-mobile.sh
```

### Step 3: Install on Device
```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

## Testing Checklist

- [ ] Start TTS playback in Story Reader
- [ ] Notification appears with story title
- [ ] Pause button works from notification
- [ ] Play button resumes from notification
- [ ] Stop button stops and hides notification
- [ ] Progress percentage updates
- [ ] Works when app in background
- [ ] Works from lock screen

## Troubleshooting

### ❌ Notification doesn't appear
**Fix:** Check notification permissions in Settings → Apps → Pixel Tales → Notifications

### ❌ Buttons don't work
**Fix:** Rebuild APK and reinstall:
```bash
cd frontend && npm run build && npm run cap:sync
cd .. && cd android && ./gradlew clean assembleDebug
```

### ❌ Notification stays after stop
**Fix:** Force stop app and restart

## What Was Changed?

### Android (Native)
- ✅ Created `MediaNotificationPlugin.java` - Notification manager
- ✅ Created `MediaButtonReceiver.java` - Button handler
- ✅ Updated `MainActivity.java` - Plugin registration
- ✅ Updated `AndroidManifest.xml` - Permissions
- ✅ Updated `build.gradle` - Media dependencies

### Frontend (JavaScript/TypeScript)
- ✅ Created `useMediaNotification.ts` - React hook
- ✅ Updated `TTSControls.tsx` - Notification integration
- ✅ Updated `StoryReaderPage.tsx` - Pass story title

## Technical Stack

- **Android MediaSession** - System integration
- **NotificationCompat** - Notification UI
- **Capacitor Plugin** - Native/JS bridge
- **React Hooks** - State management

## Benefits

### For Users 👥
- 🎧 Listen while multitasking
- 📱 No need to keep app open
- 🔒 Control from lock screen
- 🔋 Better battery (screen can be off)

### For App 📱
- ⭐ Professional media app experience
- 🚀 Modern Android standards
- 💫 Better user engagement
- 🎵 Feels like Spotify/YouTube Music

## Next Steps

After building and testing:

1. **User Testing**
   - Test with real users
   - Get feedback on controls
   - Check different Android versions

2. **Polish**
   - Add story cover art to notification (future)
   - Add skip forward/back buttons (future)
   - Add playback speed control (future)

3. **Release**
   - Update version in `build.gradle`
   - Build release APK with signing
   - Deploy to Play Store or distribute

## Support

- **Full Documentation:** `Documentation/MEDIA_NOTIFICATION_TTS_GUIDE.md`
- **TTS Documentation:** `Documentation/TTS_VOICE_ACCENT_UPDATE.md`
- **Build Issues:** Check `BUILD_INSTRUCTIONS.txt`

---

**Status:** ✅ Complete and Ready for Testing
**Platform:** Android Only (iOS future)
**Version:** 1.0
