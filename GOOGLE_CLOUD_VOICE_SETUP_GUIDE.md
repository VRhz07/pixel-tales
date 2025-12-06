# Google Cloud TTS Voice Setup & Troubleshooting Guide

## 🎯 Overview
This guide helps you set up and troubleshoot natural-sounding voices for US English and Filipino Tagalog.

## 📋 Current Voice Configuration

### US English Voices (Premium Neural2)
- **Female**: `en-US-Neural2-F` - Natural, warm, and expressive female voice
- **Male**: `en-US-Neural2-D` - Natural, clear, and engaging male voice

### Filipino/Tagalog Voices (WaveNet)
- **Female**: `fil-PH-Wavenet-A` - Native Filipino/Tagalog female voice
- **Male**: `fil-PH-Wavenet-D` - Native Filipino/Tagalog male voice

## 🔧 What Was Fixed

### Issue 1: Voices Not Changing
**Problem**: Voice selection dropdown didn't persist or apply changes

**Solution**: 
- Added localStorage persistence for voice selection
- Voice preference now saved automatically when changed
- Survives page refreshes and app restarts

### Issue 2: Voice Quality Not Natural
**Problem**: WaveNet voices for English sounded robotic

**Solution**:
- Upgraded US English voices to Neural2 (Google's latest and most natural)
- Kept Filipino voices as WaveNet (best available for Filipino)
- Both are within the FREE tier (1M characters/month)

### Issue 3: Voice Not Applying
**Problem**: Backend might be using wrong voice or language code

**Solution**:
- Enhanced logging to show which voice is being used
- Added proper voice_id parameter passing
- Fixed language code mapping (tl → fil-PH)

## 🧪 Testing Your Voices

### Option 1: Use the Test Script
```powershell
# From project root
python test_google_cloud_voices.py
```

This will:
- Check if Google Cloud TTS is configured
- Generate 4 test MP3 files (one for each voice)
- Save them to your current directory
- Let you compare voice quality

### Option 2: Test in the App
1. Open your app and go to Story Reader
2. Click the TTS settings (⚙️ icon)
3. Make sure "Cloud Voice" is selected
4. Try each voice from the dropdown:
   - 👩 Female (US English)
   - 👩 Female (Filipino Tagalog)
   - 👨 Male (US English)
   - 👨 Male (Filipino Tagalog)
5. Click Play and listen to the difference

## 🔍 Troubleshooting

### Problem: Voice Doesn't Change When Selected
**Check:**
1. Open browser DevTools (F12) → Console
2. Look for logs: `🎤 Voice changed to: [voice_id]`
3. Look for logs: `🎤 TTS: Saved cloud voice preference: [voice_id]`

**If you don't see these logs:**
- The dropdown might not be triggering the onChange event
- Try refreshing the page and selecting again

**If you see the logs but voice doesn't change:**
- Check the network tab for the `/api/tts/synthesize/` request
- Verify the `voice_id` parameter is being sent correctly

### Problem: Voice Sounds Wrong or Robotic
**Check the backend logs** for lines like:
```
🎤 Selected voice: en-US-Neural2-F (Female (US English - Natural))
🎙️ Synthesizing speech:
   - Voice: en-US-Neural2-F
   - Language: en-US
   - Voice ID: female_english
```

**If you see WaveNet instead of Neural2 for English:**
- Your backend code wasn't updated
- Pull the latest changes and restart the server

**If Filipino voice sounds wrong:**
- Make sure the language code is `fil-PH` not `tl` or `tl-PH`
- Check the voice name is exactly `fil-PH-Wavenet-A` or `fil-PH-Wavenet-D`

### Problem: "TTS Service Not Available"
**This means Google Cloud credentials are not configured:**

1. Check environment variables:
   ```powershell
   # On Render/production
   Check GOOGLE_APPLICATION_CREDENTIALS is set
   
   # Locally
   $env:GOOGLE_APPLICATION_CREDENTIALS
   ```

2. Verify the service account JSON file exists and has proper permissions

3. Check Google Cloud console:
   - Text-to-Speech API is enabled
   - Service account has "Cloud Text-to-Speech API User" role
   - Billing is enabled (required even for free tier)

## 🎨 Voice Selection Best Practices

### For Children's Stories
- **English**: Use `female_english` (warm and expressive)
- **Filipino**: Use `female_filipino` (native speaker, clear)

### For Educational Content
- **English**: Use `male_english` (clear and engaging)
- **Filipino**: Use `male_filipino` (authoritative, clear)

### For Mixed Language Stories
- Let users switch voices in settings
- Auto-detect based on text language
- Current implementation already does this!

## 💡 Voice Feature Enhancements

### Current Features ✅
- [x] 4 voice options (2 languages × 2 genders)
- [x] Voice selection persists across sessions
- [x] Automatic fallback to device TTS if offline
- [x] Visual indicators for voice type (🇺🇸/🇵🇭)
- [x] Premium Neural2 voices for English
- [x] Native Filipino voices for Tagalog

### Recommended Additions 🚀
- [ ] Voice preview button (play sample without reading story)
- [ ] Speed adjustment (already supported in backend!)
- [ ] Pitch adjustment (already supported in backend!)
- [ ] Favorites/quick switch between 2 voices
- [ ] Voice personality tags (warm, clear, energetic, etc.)

## 📊 Pricing & Limits

### Google Cloud TTS Free Tier
- **1 million characters per month FREE**
- WaveNet voices: $16 per 1M characters after free tier
- Neural2 voices: $16 per 1M characters after free tier
- Pricing is the same for both!

### Cost Estimation
- Average story: 500-1000 characters
- Can read 1000-2000 stories per month FREE
- For a typical user, this is essentially unlimited

## 🔐 Security Note
Never commit your Google Cloud service account JSON file to git!
Always use environment variables in production.

## ✅ Verification Checklist

- [ ] Voice selection dropdown shows 4 options
- [ ] Selected voice persists after page refresh
- [ ] English voices sound natural (not robotic)
- [ ] Filipino voices sound native (not accent-shifted)
- [ ] Console logs show correct voice_id being used
- [ ] Backend logs show Neural2 for English voices
- [ ] Network requests include voice_id parameter
- [ ] localStorage contains tts_cloudVoiceId key

## 📞 Getting Help

If voices still don't sound right after following this guide:
1. Run the test script to generate sample audio files
2. Compare the samples to what you hear in the app
3. Check browser console and backend logs
4. Verify Google Cloud API is responding correctly

## 🎉 Success Criteria

You should hear:
- **US English voices**: Natural, human-like, expressive
- **Filipino voices**: Native speaker quality, clear pronunciation
- **Smooth transitions**: No glitches when switching voices
- **Consistent quality**: Same voice every time you select it
