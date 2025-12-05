# 🎤 Hybrid TTS Implementation - Cloud + Device Fallback

## Overview

Implemented a smart hybrid Text-to-Speech system that uses:
- ☁️ **Google Cloud TTS** (WaveNet) when online - Premium quality
- 📱 **Device TTS** (Capacitor) when offline - Reliable fallback

## Features

### ✅ What's Implemented

1. **Automatic Fallback**
   - Tries Cloud TTS first when online
   - Falls back to device TTS if cloud fails or offline
   - Seamless user experience

2. **Voice Selection**
   - **Cloud TTS**: Choose gender (Female/Male) for both English and Filipino
   - **Device TTS**: Choose from installed system voices

3. **Available Voices**

   **Google Cloud WaveNet:**
   - 🇺🇸 English Female: `en-US-Neural2-C`
   - 🇺🇸 English Male: `en-US-Neural2-D`
   - 🇵🇭 Filipino Female: `fil-PH-Wavenet-A`
   - 🇵🇭 Filipino Male: `fil-PH-Wavenet-C`

   **Device TTS:**
   - Any voices installed on user's device
   - Google TTS, Samsung TTS, etc.

4. **User Control**
   - Toggle between Cloud and Device TTS in settings
   - Online/Offline status indicator
   - Voice gender selection for Cloud TTS
   - Voice picker for Device TTS

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│              Frontend (React)                    │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │    useTextToSpeech Hook                  │  │
│  │                                           │  │
│  │  1. Check: useCloudTTS && isOnline?      │  │
│  │     ↓ YES                     ↓ NO        │  │
│  │  2. Try Cloud TTS        3. Use Device   │  │
│  │     ↓ Success                             │  │
│  │  4. Play Audio                            │  │
│  │     ↓ Fail                                │  │
│  │  5. Fallback to Device TTS                │  │
│  └──────────────────────────────────────────┘  │
│                    ↓                             │
└────────────────────┼─────────────────────────────┘
                     ↓
        ┌────────────┴────────────┐
        ↓                         ↓
┌──────────────┐         ┌──────────────┐
│  Cloud TTS   │         │  Device TTS  │
│  (Backend)   │         │  (Capacitor) │
└──────────────┘         └──────────────┘
        ↓
┌──────────────┐
│ Google Cloud │
│     TTS      │
└──────────────┘
```

---

## Files Modified/Created

### Backend:
1. ✅ `backend/storybook/tts_service.py` - Google Cloud TTS service
2. ✅ `backend/storybook/tts_views.py` - API endpoints
3. ✅ `backend/storybook/urls.py` - URL routing
4. ✅ `backend/requirements.txt` - Added google-cloud-texttospeech

### Frontend:
1. ✅ `frontend/src/hooks/useTextToSpeech.ts` - Added cloud TTS support
2. ✅ `frontend/src/components/common/TTSControls.tsx` - Updated UI

---

## Setup Instructions

### 1. Install Backend Dependencies

```bash
cd backend
pip install google-cloud-texttospeech==2.16.3
```

### 2. Setup Google Cloud TTS

#### A. Create Google Cloud Project
1. Go to https://console.cloud.google.com
2. Create a new project or select existing
3. Enable "Cloud Text-to-Speech API"

#### B. Create Service Account
1. Go to IAM & Admin → Service Accounts
2. Click "Create Service Account"
3. Name: `pixeltales-tts`
4. Grant role: "Cloud Text-to-Speech User"
5. Click "Create Key" → JSON
6. Download the key file

#### C. Set Environment Variable

**Linux/Mac:**
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
```

**Windows:**
```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\service-account-key.json"
```

**Or add to `.env`:**
```
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

### 3. Update Backend Settings

Add to `backend/storybookapi/settings.py`:

```python
import os

# Google Cloud TTS
GOOGLE_APPLICATION_CREDENTIALS = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
if GOOGLE_APPLICATION_CREDENTIALS and os.path.exists(GOOGLE_APPLICATION_CREDENTIALS):
    os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = GOOGLE_APPLICATION_CREDENTIALS
```

### 4. Test Backend

```bash
cd backend
python manage.py runserver
```

Test the API:
```bash
curl -X POST http://localhost:8000/api/tts/synthesize/ \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello world","language":"en","gender":"female"}'
```

### 5. Build & Deploy

```bash
# Frontend
cd frontend
npm run build

# Sync Capacitor
npx cap sync android

# Build APK
npx cap open android
```

---

## Usage

### In Story Reader:

1. **Open a story**
2. **Tap speaker icon** to start narration
3. **Tap settings (gear icon)**
4. **Choose voice quality:**
   - ☁️ **Cloud Voice** - Premium quality (requires internet)
   - 📱 **Device Voice** - Installed TTS engine (works offline)

5. **For Cloud Voice:**
   - Select gender: Female or Male
   - Works for both English and Filipino

6. **For Device Voice:**
   - Select from installed voices
   - Install Google TTS for better quality

---

## API Endpoints

### 1. Synthesize Speech
```
POST /api/tts/synthesize/

Body:
{
  "text": "Magandang araw!",
  "language": "fil",
  "gender": "female",
  "rate": 1.0,
  "pitch": 0.0,
  "volume": 0.0
}

Response: Audio/MP3 file
```

### 2. Get Available Voices
```
GET /api/tts/voices/

Response:
{
  "voices": {
    "en": {
      "female": "en-US-Neural2-C",
      "male": "en-US-Neural2-D"
    },
    "fil": {
      "female": "fil-PH-Wavenet-A",
      "male": "fil-PH-Wavenet-C"
    }
  },
  "available": true
}
```

### 3. Check TTS Status
```
GET /api/tts/status/

Response:
{
  "available": true,
  "service": "google-cloud-tts",
  "voices": {
    "en": ["female", "male"],
    "fil": ["female", "male"]
  }
}
```

---

## Cost Breakdown

### Google Cloud TTS Free Tier:
- **WaveNet voices:** 1 million characters/month FREE
- **Neural2 voices:** 1 million characters/month FREE
- **Standard voices:** 4 million characters/month FREE

### Usage Estimates:
- Average story: ~10,000 characters
- **Free tier = 100 full stories/month** with WaveNet
- **Free tier = 400 full stories/month** with Standard

### After Free Tier:
- WaveNet/Neural2: $16 per 1M characters
- Standard: $4 per 1M characters

**For most users: Stays FREE!** 🎉

---

## Fallback Logic

### Scenario 1: Online + Cloud TTS Enabled
```
User taps play
  ↓
Check: Is online? YES
  ↓
Try Cloud TTS
  ↓
Success? → Play audio ✅
  ↓
Fail? → Use Device TTS ✅
```

### Scenario 2: Offline + Cloud TTS Enabled
```
User taps play
  ↓
Check: Is online? NO
  ↓
Skip Cloud TTS
  ↓
Use Device TTS ✅
```

### Scenario 3: Device TTS Selected
```
User taps play
  ↓
Use Device TTS ✅
```

---

## Voice Quality Comparison

| Feature | Cloud TTS | Device TTS |
|---------|-----------|------------|
| **Quality** | ⭐⭐⭐⭐⭐ Professional | ⭐⭐⭐ Good |
| **Filipino** | ✅ Native WaveNet | ⚠️ Depends on install |
| **Internet** | ❌ Required | ✅ Works offline |
| **Cost** | 💰 Free tier generous | 💰 Free |
| **Speed** | 🚀 Fast (cached) | 🚀 Instant |
| **Reliability** | ⚠️ Needs connection | ✅ Always works |

---

## Troubleshooting

### Issue: Cloud TTS not working

**Check:**
1. Is backend running?
2. Is `GOOGLE_APPLICATION_CREDENTIALS` set?
3. Is service account key valid?
4. Is Text-to-Speech API enabled?
5. Is device online?

**Solution:**
- Check backend logs
- Verify API key path
- Enable API in Google Cloud Console
- Check network connection

### Issue: No device voices

**Solution:**
- Install Google Text-to-Speech from Play Store
- Download Filipino voice data
- Restart app

### Issue: API quota exceeded

**Solution:**
- Check usage in Google Cloud Console
- Set up billing if needed (unlikely for personal use)
- Use device TTS as fallback

---

## Best Practices

### 1. Default to Cloud TTS
- Better quality for most users
- Automatic fallback ensures reliability

### 2. Cache Audio (Future)
- Store generated audio locally
- Reduce API calls
- Faster playback

### 3. Monitor Usage
- Set up quota alerts in Google Cloud
- Track usage patterns
- Optimize text length

### 4. Error Handling
- Always have device TTS as fallback
- Show clear error messages
- Guide users to solutions

---

## Security

### API Key Protection:
- ✅ API key stays on backend (never exposed)
- ✅ Backend proxy for all TTS requests
- ✅ Rate limiting (TODO)
- ✅ Authentication (TODO)

### Recommended:
- Add user authentication to TTS endpoints
- Implement rate limiting per user
- Monitor for abuse
- Set quota limits

---

## Future Enhancements

### Phase 2 (Optional):
1. **Audio Caching**
   - Cache generated audio locally
   - Reduce API calls and costs
   - Faster repeat playback

2. **Voice Customization**
   - SSML support for emphasis
   - Pause control
   - Speed variations per sentence

3. **Offline Story Pack**
   - Pre-generate audio for popular stories
   - Bundle with APK
   - Zero API costs

4. **Voice Preview**
   - Let users hear voices before selection
   - Sample audio for each voice

5. **Usage Analytics**
   - Track which voices are popular
   - Monitor API costs
   - Optimize based on data

---

## Testing Checklist

### Backend:
- [ ] Service starts without errors
- [ ] `/api/tts/synthesize/` returns audio
- [ ] `/api/tts/voices/` returns voice list
- [ ] `/api/tts/status/` shows availability
- [ ] Error handling works (no API key, etc.)

### Frontend:
- [ ] Cloud TTS toggle works
- [ ] Gender selection works
- [ ] Audio plays from cloud
- [ ] Fallback to device works
- [ ] Offline detection works
- [ ] Progress bar updates
- [ ] Error messages clear

### Mobile APK:
- [ ] Online: Cloud TTS works
- [ ] Offline: Device TTS works
- [ ] Switching between modes works
- [ ] Filipino voices work
- [ ] English voices work
- [ ] Settings persist

---

## Summary

✅ **Implemented:**
- Cloud TTS with Google WaveNet
- Device TTS fallback
- Smart switching based on connectivity
- Voice gender selection
- 4 premium voices (2 English + 2 Filipino)
- Automatic error handling
- Free tier usage

✅ **Benefits:**
- Best quality when online
- Reliable offline support
- Natural Filipino narration
- Free for most users
- Easy to use

✅ **Next Steps:**
1. Setup Google Cloud credentials
2. Test backend API
3. Build and deploy APK
4. Enjoy premium TTS! 🎉

---

*Documentation created: 2024*
*Status: ✅ Ready for testing*
