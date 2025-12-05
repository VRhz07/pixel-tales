# Media Notification for TTS Playback

## Overview
Added Android media notification controls for Text-to-Speech playback, allowing users to control story narration from the notification panel even when the app is in the background.

## Features

### 📱 Media Session Integration
- **Persistent Notification**: Shows a notification when TTS is playing
- **Playback Controls**: Play, Pause, and Stop buttons in notification
- **Progress Display**: Shows current playback progress (%)
- **Background Control**: Control playback without opening the app
- **Lock Screen Controls**: Access controls from lock screen

### 🎯 User Experience
When listening to a story with TTS:
1. Start playing the story narration
2. Press home button or switch apps
3. Pull down notification panel
4. See "Pixel Tales" notification with story title
5. Control playback (Play/Pause/Stop) from notification
6. See progress percentage update in real-time

## Implementation Details

### Android Components

#### 1. MediaNotificationPlugin.java
Custom Capacitor plugin that manages the media notification.

**Key Features:**
- Creates notification channel for story playback
- Sets up MediaSession for system integration
- Handles play, pause, stop actions from notification
- Updates notification dynamically with progress
- Integrates with Android's media system

**Location:** `android/app/src/main/java/com/pixeltales/app/MediaNotificationPlugin.java`

#### 2. MediaButtonReceiver.java
Broadcast receiver for media button actions.

**Purpose:**
- Captures notification button clicks
- Routes actions to the MediaNotificationPlugin

**Location:** `android/app/src/main/java/com/pixeltales/app/MediaButtonReceiver.java`

#### 3. AndroidManifest.xml Updates
Added required permissions and receiver declaration:

```xml
<!-- Foreground service for media playback -->
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.WAKE_LOCK" />

<!-- Media Button Receiver -->
<receiver android:name=".MediaButtonReceiver" android:exported="false">
    <intent-filter>
        <action android:name="com.pixeltales.app.PLAY" />
        <action android:name="com.pixeltales.app.PAUSE" />
        <action android:name="com.pixeltales.app.STOP" />
    </intent-filter>
</receiver>
```

#### 4. build.gradle Dependencies
Added media session libraries:

```gradle
implementation "androidx.media:media:1.6.0"
implementation "com.google.android.material:material:1.9.0"
```

### Frontend Components

#### 1. useMediaNotification Hook
React hook that bridges JavaScript and native Android code.

**Features:**
- `showNotification()` - Display media notification
- `hideNotification()` - Remove notification
- `updateNotification()` - Update notification content
- Event listeners for play, pause, stop actions
- Auto-cleanup on unmount

**Location:** `frontend/src/hooks/useMediaNotification.ts`

**Usage:**
```typescript
const {
  showNotification,
  hideNotification,
  updateNotification,
  isSupported
} = useMediaNotification({
  onPlay: () => { /* handle play */ },
  onPause: () => { /* handle pause */ },
  onStop: () => { /* handle stop */ }
});
```

#### 2. TTSControls Component Enhancement
Integrated media notification into existing TTS controls.

**Changes:**
- Added `storyTitle` prop for notification display
- Automatically shows/hides notification based on TTS state
- Updates notification progress in real-time
- Syncs notification controls with TTS state

**Location:** `frontend/src/components/common/TTSControls.tsx`

#### 3. StoryReaderPage Integration
Passes story title to TTSControls for notification display.

**Location:** `frontend/src/pages/StoryReaderPage.tsx`

## Notification Flow

### Playing Story
```
User clicks Play
    ↓
TTS starts speaking
    ↓
Notification appears
    ↓
Shows: "Story Title"
       "Playing - 15%"
    ↓
[Pause] [Stop] buttons
```

### Paused State
```
User clicks Pause (in-app or notification)
    ↓
TTS pauses
    ↓
Notification updates
    ↓
Shows: "Story Title"
       "Paused - 47%"
    ↓
[Play] [Stop] buttons
```

### Stopped State
```
User clicks Stop
    ↓
TTS stops
    ↓
Notification disappears
    ↓
Clean exit
```

## Technical Details

### MediaSession Integration
The plugin uses `MediaSessionCompat` for proper system integration:
- **Actions Supported:**
  - `ACTION_PLAY` - Start/resume playback
  - `ACTION_PAUSE` - Pause playback
  - `ACTION_STOP` - Stop playback
- **Playback State:** Synced with actual TTS state
- **Metadata:** Story title displayed in notification

### Notification Channel
- **Channel ID:** `tts_playback_channel`
- **Name:** Story Playback
- **Importance:** Low (non-intrusive)
- **Badge:** Disabled
- **Sound:** Silent (for background playback)

### Event Communication
```
Android Notification Button
    ↓
MediaButtonReceiver (BroadcastReceiver)
    ↓
MediaSessionCompat.Callback
    ↓
Capacitor Plugin (notifyListeners)
    ↓
JavaScript Event Listener
    ↓
TTS Control Functions
```

## Testing Guide

### 1. Test Basic Playback
1. Open a story in Story Reader
2. Click "Listen" to start TTS
3. Check notification panel - should see "Pixel Tales" notification
4. Verify story title and "Playing - X%" text appears

### 2. Test Pause/Resume
1. While playing, click Pause button in notification
2. TTS should pause, notification should update to "Paused - X%"
3. Click Play button in notification
4. TTS should resume, notification shows "Playing - X%"

### 3. Test Stop
1. While playing, click Stop button in notification
2. TTS should stop completely
3. Notification should disappear

### 4. Test Background Control
1. Start playing story
2. Press Home button (app goes to background)
3. Pull down notification panel
4. Control playback from notification
5. Verify TTS responds correctly

### 5. Test Progress Updates
1. Start playing story
2. Watch progress percentage update in notification
3. Progress should match in-app TTS progress bar

### 6. Test Lock Screen
1. Start playing story
2. Lock device
3. Wake device (stay on lock screen)
4. Media controls should be visible on lock screen
5. Test play/pause from lock screen

## Files Modified/Created

### Created Files
- ✅ `android/app/src/main/java/com/pixeltales/app/MediaNotificationPlugin.java`
- ✅ `android/app/src/main/java/com/pixeltales/app/MediaButtonReceiver.java`
- ✅ `frontend/src/hooks/useMediaNotification.ts`
- ✅ `frontend/src/hooks/useTextToSpeechWithNotification.ts` (optional helper)

### Modified Files
- ✅ `android/app/src/main/java/com/pixeltales/app/MainActivity.java` - Plugin registration
- ✅ `android/app/src/main/AndroidManifest.xml` - Permissions and receiver
- ✅ `android/app/build.gradle` - Media dependencies
- ✅ `frontend/src/components/common/TTSControls.tsx` - Notification integration
- ✅ `frontend/src/pages/StoryReaderPage.tsx` - Pass story title

### Documentation
- ✅ `Documentation/MEDIA_NOTIFICATION_TTS_GUIDE.md` - This file

## Build Instructions

### 1. Sync Capacitor
After all changes, sync the Android project:
```bash
cd frontend
npm run build
npm run cap:sync
```

### 2. Build APK
```bash
cd android
./gradlew assembleDebug
```

Or use the build scripts:
```bash
# Windows
build-mobile.bat

# Linux/Mac
./build-mobile.sh
```

### 3. Install & Test
```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

## Troubleshooting

### Notification Not Appearing
**Issue:** Notification doesn't show when TTS starts
**Solutions:**
1. Check notification permissions in Android settings
2. Verify notification channel is created
3. Check Logcat for errors: `adb logcat | grep MediaNotification`

### Controls Not Working
**Issue:** Clicking notification buttons doesn't control TTS
**Solutions:**
1. Verify MediaButtonReceiver is registered in manifest
2. Check event listeners are properly set up
3. Look for JavaScript errors in console

### Notification Persists After Stop
**Issue:** Notification stays after stopping TTS
**Solutions:**
1. Ensure `hideNotification()` is called
2. Check cleanup in `useEffect` return function
3. Verify notification ID matches

### Wrong Story Title
**Issue:** Notification shows wrong or default title
**Solutions:**
1. Verify `storyTitle` prop is passed to TTSControls
2. Check story object has `title` property
3. Ensure prop drilling is correct

## Future Enhancements

### Potential Improvements
- ⭐ **Seek Controls:** Add forward/backward skip buttons
- ⭐ **Cover Art:** Show story cover image in notification
- ⭐ **Chapter Navigation:** Next/Previous page buttons
- ⭐ **Speed Control:** Adjust playback speed from notification
- ⭐ **Timer:** Auto-stop after X minutes
- ⭐ **Bluetooth:** Car/headphone button support

### iOS Support
Currently Android-only. For iOS:
- Use `MediaPlayer` framework
- Implement `MPNowPlayingInfoCenter`
- Handle Control Center integration
- Add lock screen controls

## Benefits

### User Experience
- ✅ **Multitasking:** Listen while using other apps
- ✅ **Convenience:** Quick controls without opening app
- ✅ **Professional:** Feels like Spotify/YouTube Music
- ✅ **Battery Efficient:** No need to keep screen on

### App Quality
- ✅ **Modern UX:** Expected feature in media apps
- ✅ **System Integration:** Native Android behavior
- ✅ **Accessibility:** Easier control for all users
- ✅ **Engagement:** Encourages longer listening sessions

## Summary

This feature transforms Pixel Tales from a simple reader app into a professional storytelling platform with background audio support. Users can now enjoy stories while doing other activities, with full control from the notification panel - just like their favorite music or podcast apps! 🎵📖✨
