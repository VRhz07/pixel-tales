# Testing Voice Changes - Step by Step

## Before You Start
Make sure:
- ✅ Backend is running (on Render or locally)
- ✅ Frontend is running
- ✅ You're logged into the app
- ✅ You have internet connection (for Cloud TTS)

## Test Procedure

### Step 1: Open Story Reader
1. Go to Library page
2. Open any story (or create a test story with some text)
3. You should see the Story Reader page

### Step 2: Open TTS Settings
1. Look for the TTS controls at the bottom/top
2. Click the **⚙️ Settings/Gear** icon
3. A modal/panel should open with TTS settings

### Step 3: Verify Cloud Voice is Enabled
1. Look for "Voice Source" or similar setting
2. Make sure **"☁️ Cloud Voice"** is selected
3. It should show **(Online)** if you have internet

### Step 4: Change Voice
1. Find the **"Voice"** dropdown (only shows when Cloud Voice is enabled)
2. You should see 4 options:
   - 👩 Female (US English)
   - 👨 Male (US English)  
   - 👩 Female (Filipino Tagalog)
   - 👨 Male (Filipino Tagalog)
3. Select **"👩 Female (US English)"**
4. Look at browser console (F12 → Console tab)
5. You should see: `🎤 Voice changed to: female_english`

### Step 5: Test Playback
1. Close the TTS settings modal
2. Click the **▶️ Play** button
3. Listen to the voice - it should sound natural and warm
4. Check console logs for:
   ```
   🌥️ TTS: Cloud request: { voice_id: 'female_english', ... }
   🌥️ TTS: Response status: 200
   🌥️ TTS: Cloud TTS playback started
   ```

### Step 6: Change to Another Voice
1. **Stop** the current playback
2. Open TTS settings again
3. Select **"👨 Male (US English)"**
4. Console should show: `🎤 Voice changed to: male_english`
5. Click **▶️ Play** again
6. Voice should now be male and sound different

### Step 7: Test Filipino Voice
1. Stop playback
2. Open TTS settings
3. Select **"👩 Female (Filipino Tagalog)"**
4. Play some Filipino text (or English text with Filipino accent)
5. Voice should sound like a native Filipino speaker

### Step 8: Verify Persistence
1. Select your favorite voice (e.g., Female US English)
2. **Refresh the page** (F5 or Ctrl+R)
3. Open TTS settings again
4. The same voice should still be selected
5. Play to verify it's using that voice

## What to Look For

### ✅ Good Signs
- Dropdown changes when you select a voice
- Console shows voice change logs
- Voice actually sounds different when changed
- Selected voice persists after page refresh
- Natural, human-like speech quality
- Backend logs show correct voice name

### ❌ Bad Signs
- Dropdown doesn't change when clicked
- No console logs when selecting voice
- Voice sounds the same no matter what you select
- Voice resets to default after page refresh
- Robotic or mechanical speech quality
- Backend logs show wrong voice or errors

## Common Issues & Fixes

### Issue: Voice Doesn't Change
**Check:**
```javascript
// In browser console:
localStorage.getItem('tts_cloudVoiceId')
// Should return: "female_english" or whatever you selected
```

**Fix:**
```javascript
// Force set a voice:
localStorage.setItem('tts_cloudVoiceId', 'male_english');
// Then refresh page
```

### Issue: Voice Sounds Robotic (English)
**Check backend logs for:**
```
Voice: en-US-Neural2-F  ✅ GOOD
Voice: en-US-Wavenet-F  ❌ BAD (old voice)
```

**Fix:** Update backend code (already done in this update)

### Issue: "TTS Service Not Available"
**Check:**
- Backend server is running
- Google Cloud credentials are configured
- You have internet connection
- Backend logs show: `✅ Google Cloud TTS client initialized successfully`

### Issue: Dropdown Shows But Can't Select
**Check:**
- React DevTools → Components → TTSControls
- Look for `cloudVoiceId` state
- Try clicking multiple times
- Check for JavaScript errors in console

## Backend Verification

### Check Backend Logs Should Show:
```
🎤 TTS request: 234 chars, voice_id: female_english, fallback_lang: en
🎤 Selected voice: en-US-Neural2-F (Female (US English - Natural))
🎙️ Synthesizing speech:
   - Text: 234 characters
   - Voice: en-US-Neural2-F (Female (US English - Natural))
   - Language: en-US
   - Voice ID: female_english
   - Description: Natural and expressive female voice
   - Rate: 1.0, Pitch: 0.0, Volume: 0.0
✅ Speech synthesis successful: 45678 bytes
```

### Warning Signs in Backend:
```
⚠️ Expected Neural2 voice for English, but got: en-US-Wavenet-F
⚠️ Expected fil-PH language code for Filipino, but got: tl-PH
```

## Network Tab Verification

1. Open DevTools → Network tab
2. Play a story with TTS
3. Look for request to `/api/tts/synthesize/`
4. Check Request Payload:
   ```json
   {
     "text": "Story text...",
     "voice_id": "female_english",  ← Should match your selection
     "language": "en",
     "rate": 1.0,
     "pitch": 0.0,
     "volume": 0.0
   }
   ```
5. Response should be audio/mpeg (binary data)

## Success Criteria

You've successfully set up voices when:
- [x] All 4 voices show in dropdown
- [x] Selecting a voice changes the dropdown display
- [x] Console logs confirm voice change
- [x] Playing audio uses the selected voice
- [x] Voice sounds natural (not robotic)
- [x] Voice persists after page refresh
- [x] English voices sound American
- [x] Filipino voices sound native
- [x] Backend logs show Neural2 for English

## Quick Test Commands

### Test Voice Persistence:
```javascript
// Set voice
localStorage.setItem('tts_cloudVoiceId', 'male_filipino');
location.reload();

// Check after reload
console.log(localStorage.getItem('tts_cloudVoiceId')); // Should be 'male_filipino'
```

### Test All Voices Quickly:
```javascript
const voices = ['female_english', 'male_english', 'female_filipino', 'male_filipino'];
voices.forEach(v => {
  localStorage.setItem('tts_cloudVoiceId', v);
  console.log('Set voice to:', v);
  // Reload page and test each one
});
```

## Need Help?

If voices still don't work after following these steps:
1. Share backend logs (from `/api/tts/synthesize/` request)
2. Share browser console logs
3. Share Network tab request/response
4. Run `python test_google_cloud_voices.py` and share results
