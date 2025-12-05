# TTS Troubleshooting - Voice Quality Issues

## Issue: English Words Sound Wrong / Can't Understand

### Possible Causes

#### 1. **Wrong Language Code Being Sent**
**Problem:** Text language doesn't match voice language
**Example:** English text sent with Filipino language code

**Check in Browser Console:**
```javascript
// Look for this log:
🌥️ TTS: Cloud request: {
  voice_id: "female_english",
  language: "fil",  // ← WRONG! Should be "en" for English text
  text_length: 125,
  rate: 1,
  pitch: 0,
  volume: 0
}
```

**Solution:** The language is auto-detected from `useI18nStore()`. Make sure your story language is set correctly.

#### 2. **Voice Not Switching Properly**
**Problem:** Selecting different voice doesn't apply immediately
**Symptoms:** 
- Select "Male English" but still sounds like previous voice
- Voice only changes after app restart

**Check:**
```javascript
// In console, should see:
🌥️ TTS: Cloud request: {
  voice_id: "male_english",  // ← Should match your selection
  ...
}
```

**Solution:** Check if `cloudVoiceId` state is updating in TTSControls component.

#### 3. **Wrong Voice Name in Backend**
**Problem:** Voice name doesn't exist in Google Cloud
**Symptoms:** Very robotic or wrong accent

**Check Backend Logs:**
```python
# Should see:
🎙️ Synthesizing speech:
   - Voice: en-US-Wavenet-F
   - Language: en-US
   - Voice ID: female_english
```

**Verify voice names are correct:**
- Female English: `en-US-Wavenet-F`
- Male English: `en-US-Wavenet-A`
- Female Filipino: `fil-PH-Wavenet-A`
- Male Filipino: `fil-PH-Wavenet-D`

#### 4. **Google Cloud TTS Not Configured**
**Problem:** Backend falling back to bad quality voice
**Check:** Backend logs should NOT show errors like:
```
❌ Failed to initialize Google Cloud TTS client
```

**Solution:** Verify environment variable `GOOGLE_APPLICATION_CREDENTIALS` is set correctly.

#### 5. **Caching Issue**
**Problem:** Old audio cached, doesn't use new voice
**Solution:**
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)
- Check if audio URL is regenerated each time

---

## Debugging Steps

### Step 1: Check Frontend Logs

Open browser console and look for:

```javascript
// When you select a voice:
📢 TTS: cloudVoiceId updated to: male_english

// When you play:
🌥️ TTS: Cloud request: {
  voice_id: "male_english",  // ← Should match selection
  language: "en",            // ← Should match text language
  text_length: 125
}

// Response:
🌥️ TTS: Response status: 200
🌥️ TTS: Audio loaded, duration: 5.234
```

### Step 2: Check Backend Logs

In your backend terminal:

```python
# Should see:
🎤 Selected voice: en-US-Wavenet-A (Male (English Accent))
🎙️ Synthesizing speech:
   - Text: 125 characters
   - Voice: en-US-Wavenet-A
   - Language: en-US
   - Voice ID: male_english
✅ Speech synthesis successful: 45678 bytes
```

### Step 3: Test with Simple Text

Use very simple English text:
- "Hello, how are you today?"
- "This is a test of the voice system."
- "One, two, three, four, five."

Should sound clear and natural.

### Step 4: Test Voice Switching

1. Select "Female English"
2. Play "Hello world"
3. Stop
4. Select "Male English"
5. Play "Hello world" again
6. Should sound different!

---

## Common Issues & Solutions

### Issue 1: All Voices Sound the Same
**Cause:** `voice_id` not being sent to backend
**Fix:**
```typescript
// Check in useTextToSpeech.ts line 206
body: JSON.stringify({
  voice_id: cloudVoiceId,  // ← Must be here!
  ...
})
```

### Issue 2: Voice Switches But Sounds Wrong
**Cause:** Language code mismatch
**Example:** 
- Selected: "Female English" (en-US)
- But language sent: "fil" (Filipino)
- Result: English voice trying to speak Filipino phonetics

**Fix:** Check story language setting in your app.

### Issue 3: English Words Mispronounced
**Possible Causes:**
1. **Filipino voice used for English text**
   - Filipino voices optimize for Tagalog phonetics
   - English sounds unnatural
   
2. **Wrong SSML gender setting**
   - Some voices require specific gender setting
   
3. **Text encoding issues**
   - Special characters or formatting

**Solutions:**
1. Verify voice_id in console logs
2. Use English voice for English text
3. Clean text (remove special chars)

### Issue 4: Very Robotic Sound
**Causes:**
1. **Fallback to Standard voice** (not WaveNet)
2. **Network issue** - partial audio
3. **Wrong voice name** - doesn't exist

**Check:**
```python
# Backend should show:
Voice: en-US-Wavenet-F  # ← Should have "Wavenet"
```

Not:
```python
Voice: en-US-Standard-A  # ← This is lower quality
```

---

## Testing Script

Use this to test voices directly:

```bash
# Start backend with verbose logging
cd backend
python manage.py runserver

# In another terminal, test with curl:
curl -X POST http://localhost:8000/api/tts/synthesize/ \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, this is a test of the English voice.",
    "voice_id": "male_english",
    "language": "en",
    "rate": 1.0,
    "pitch": 0.0,
    "volume": 0.0
  }' \
  --output test_audio.mp3

# Play the audio
# Windows: test_audio.mp3 (double click)
# Linux: mpg123 test_audio.mp3
# Mac: afplay test_audio.mp3
```

Should sound clear and natural!

---

## Voice Quality Comparison

### Good Quality (WaveNet):
- Natural intonation
- Clear pronunciation
- Proper pauses
- Sounds human-like

### Bad Quality (Problem):
- Robotic/monotone
- Mispronounced words
- No natural rhythm
- Sounds mechanical

---

## Quick Fixes

### Fix 1: Force Voice Refresh
```typescript
// In TTSControls.tsx, when changing voice:
setCloudVoiceId(newVoiceId);
console.log('Voice changed to:', newVoiceId);

// Then restart playback
stop();
// Wait a moment
setTimeout(() => speak(text), 100);
```

### Fix 2: Clear Audio Cache
```typescript
// Add cache busting
const response = await fetch(`${API_BASE_URL}/api/tts/synthesize/?t=${Date.now()}`, {
  // ... rest of request
});
```

### Fix 3: Verify Voice Names
```python
# In backend, add validation:
if voice_id not in self.VOICES:
    logger.error(f"❌ Invalid voice_id: {voice_id}")
    logger.info(f"Available voices: {list(self.VOICES.keys())}")
    voice_id = 'female_english'  # fallback
```

---

## Expected Behavior

### When Working Correctly:

1. **Select "Female English":**
   - Should sound like natural US female voice
   - Clear English pronunciation
   - Smooth intonation

2. **Select "Male English":**
   - Should sound like natural US male voice
   - Different from female voice
   - Clear English pronunciation

3. **Voice Switching:**
   - Immediate effect on next playback
   - No need to restart app
   - Consistent quality

4. **Text Quality:**
   - English text: Perfect English pronunciation
   - Filipino text: Accurate Tagalog pronunciation

---

## Still Having Issues?

### Collect Debug Info:

1. **Frontend Console Log:**
   ```javascript
   // Copy the Cloud request log
   🌥️ TTS: Cloud request: { ... }
   ```

2. **Backend Log:**
   ```python
   # Copy the synthesis log
   🎙️ Synthesizing speech: ...
   ```

3. **Test Audio:**
   - Save the MP3 file
   - Test in audio player
   - Check if issue is in playback or synthesis

4. **Check Network:**
   - Open DevTools → Network tab
   - Look for `/api/tts/synthesize/` request
   - Check response size (should be 20KB-500KB)
   - Check response time (should be < 5 seconds)

---

## Contact Support

If still having issues, provide:
1. Console logs (frontend)
2. Backend logs
3. Example text that sounds wrong
4. Selected voice ID
5. Browser/device info

---

**Status:** Troubleshooting Guide
**Version:** 2.2
**Last Updated:** 2024
