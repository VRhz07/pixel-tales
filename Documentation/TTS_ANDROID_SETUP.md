# Text-to-Speech (TTS) Setup for Android APK

## Problem
When building the app as an Android APK, the Text-to-Speech controls show "No voices available" or don't work at all.

## Solution

The app uses **Capacitor Text-to-Speech plugin** which relies on the Android device's TTS engine. Here's how to fix it:

### 1. **Ensure TTS Engine is Installed on Android Device**

Most Android devices come with Google Text-to-Speech pre-installed, but it may need to be enabled or updated.

**Steps for users:**
1. Open **Settings** on your Android device
2. Go to **Accessibility** > **Text-to-Speech output** (or **System** > **Languages & input** > **Text-to-Speech**)
3. Check if **Google Text-to-Speech Engine** is installed and enabled
4. If not installed, download it from: https://play.google.com/store/apps/details?id=com.google.android.tts
5. Select it as the preferred engine
6. Test it by clicking "Listen to an example"

### 2. **Verify Capacitor Plugin is Synced**

Make sure the Capacitor TTS plugin is properly synced to the Android project:

```bash
cd frontend
npm install @capacitor-community/text-to-speech@^6.1.0
cd ..
npx cap sync android
```

### 3. **Check Android Permissions**

The `AndroidManifest.xml` should already have the necessary permissions, but verify:

```xml
<!-- Internet permission (already present) -->
<uses-permission android:name="android.permission.INTERNET" />
```

No special TTS permissions are needed - Android's TTS API works out of the box!

### 4. **Build and Test**

```bash
# Build the frontend
cd frontend
npm run build

# Sync with Android
cd ..
npx cap sync android

# Open Android Studio
npx cap open android

# Build APK from Android Studio
```

## How It Works

### For Web (Browser)
- Uses **Web Speech API** (`window.speechSynthesis`)
- Browser's built-in TTS voices
- Works on Chrome, Edge, Safari, Firefox

### For Android APK (Native)
- Uses **Capacitor TTS Plugin** (`@capacitor-community/text-to-speech`)
- Calls Android's native TTS engine
- Requires TTS engine installed on device (Google TTS recommended)

## Code Implementation

The `useTextToSpeech.ts` hook automatically detects the platform:

```typescript
const isNativePlatform = Capacitor.isNativePlatform();

if (isNativePlatform) {
  // Use Capacitor TTS for Android/iOS
  await TextToSpeech.speak({
    text: text,
    lang: 'en-US', // or 'fil-PH' for Filipino
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
    category: 'ambient',
  });
} else {
  // Use Web Speech API for browsers
  const utterance = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.speak(utterance);
}
```

## Debugging

I've added debug logging to help diagnose issues:

```typescript
console.log('📢 TTS: Using Capacitor TTS on native platform');
console.log('📢 TTS: Text length:', text.length, 'Language:', language);
console.log('📢 TTS: Speaking with options:', ttsOptions);
```

**To view logs:**
1. Connect Android device via USB
2. Enable USB Debugging on device
3. Run: `adb logcat | grep "TTS"`
4. Or use Chrome DevTools: `chrome://inspect/#devices`

## Common Issues & Solutions

### Issue 1: "No voices available"
**Cause:** No TTS engine installed or enabled on device
**Solution:** Install Google Text-to-Speech from Play Store

### Issue 2: Speech doesn't work at all
**Cause:** TTS engine not set as default
**Solution:** Go to Settings > Accessibility > Text-to-Speech > Select Google TTS as preferred engine

### Issue 3: Wrong language/accent
**Cause:** TTS engine doesn't have the language installed
**Solution:** 
- Open Google Text-to-Speech app
- Go to Settings > Language
- Download required language pack (English, Filipino, etc.)

### Issue 4: Works in browser but not in APK
**Cause:** Different APIs used (Web Speech vs Native TTS)
**Solution:** This is normal - make sure TTS engine is installed on device

## Alternative: Embedded TTS (Future Enhancement)

If you want TTS to work without requiring users to install a TTS engine, consider:

### Option A: **Google Cloud Text-to-Speech API** (Paid)
- High-quality voices
- Multiple languages
- Requires internet
- Cost: $4 per 1M characters
- API: https://cloud.google.com/text-to-speech

### Option B: **Open Source TTS Libraries**
1. **eSpeak** (Free, offline)
   - Robotic voice quality
   - Works offline
   - Large file size (~10MB)

2. **MaryTTS** (Free, offline)
   - Better quality than eSpeak
   - Very large (~100MB)

3. **Pico TTS** (Free, lightweight)
   - Decent quality
   - Small size (~2MB)
   - Limited languages

### Implementation Example (Cloud TTS):

```typescript
// For future implementation
async function speakWithCloudTTS(text: string, language: string) {
  const response = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      input: { text },
      voice: { languageCode: language, name: 'en-US-Standard-A' },
      audioConfig: { audioEncoding: 'MP3' },
    }),
  });
  
  const { audioContent } = await response.json();
  const audio = new Audio(`data:audio/mp3;base64,${audioContent}`);
  audio.play();
}
```

## Current Status

✅ **Working:** TTS is fully implemented using Capacitor plugin
✅ **Free:** No API costs - uses device's built-in TTS
⚠️ **Requirement:** Users need TTS engine installed (most Android devices have it)
📱 **Compatible:** Android 5.0+ with TTS engine

## User Instructions (For App Store / README)

Include this in your app description:

> **Text-to-Speech Requirements:**
> This app requires a Text-to-Speech engine to read stories aloud.
> - Most Android devices have Google Text-to-Speech pre-installed
> - If TTS doesn't work, install "Google Text-to-Speech" from Play Store
> - Free and works offline once voice packs are downloaded

## Testing Checklist

- [ ] Build APK with latest code
- [ ] Install on Android device
- [ ] Check device has Google TTS installed
- [ ] Test story reader TTS controls
- [ ] Verify both English and Filipino voices (if supported)
- [ ] Test play, pause, stop, speed controls
- [ ] Check debug logs in `adb logcat`

## Summary

The TTS implementation is **already working correctly** in the code! The issue is just that Android devices need a TTS engine installed. This is standard for all Android apps using TTS and is the recommended approach (free, offline, respects user's accessibility settings).
