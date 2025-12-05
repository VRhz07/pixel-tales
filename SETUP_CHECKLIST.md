# ✅ Setup Checklist - Hybrid TTS Implementation

## 📋 Quick Reference

### What You Need:
- [ ] Google Cloud account (free)
- [ ] 15 minutes for setup
- [ ] Backend running
- [ ] Internet connection (for cloud TTS)

---

## 🚀 Step-by-Step Setup

### ✅ STEP 1: Install Backend Package
```bash
cd backend
pip install google-cloud-texttospeech==2.16.3
```
**Time: 30 seconds**

---

### ✅ STEP 2: Create Google Cloud Project
1. Go to: https://console.cloud.google.com
2. Click "Create Project" or select existing
3. Project name: `pixeltales-tts` (or any name)
4. Click "Create"

**Time: 1 minute**

---

### ✅ STEP 3: Enable Text-to-Speech API
1. In Google Cloud Console, go to "APIs & Services"
2. Click "Enable APIs and Services"
3. Search for "Cloud Text-to-Speech API"
4. Click "Enable"

**Time: 1 minute**

---

### ✅ STEP 4: Create Service Account
1. Go to "IAM & Admin" → "Service Accounts"
2. Click "Create Service Account"
3. Name: `pixeltales-tts`
4. Click "Create and Continue"
5. Select role: "Cloud Text-to-Speech User"
6. Click "Continue" → "Done"

**Time: 2 minutes**

---

### ✅ STEP 5: Create and Download Key
1. Click on the service account you just created
2. Go to "Keys" tab
3. Click "Add Key" → "Create new key"
4. Select "JSON"
5. Click "Create"
6. Save the downloaded file somewhere safe

**Time: 1 minute**

---

### ✅ STEP 6: Set Environment Variable

**Windows (PowerShell):**
```powershell
# Run this BEFORE starting backend
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\your\service-account-key.json"
```

**Linux/Mac:**
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account-key.json"
```

**Or create backend/.env file:**
```
GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/service-account-key.json
```

**Time: 1 minute**

---

### ✅ STEP 7: Test Backend
```bash
cd backend
python manage.py runserver
```

Open browser: http://localhost:8000/api/tts/status/

**Expected response:**
```json
{
  "available": true,
  "service": "google-cloud-tts",
  "voices": {
    "en": ["female", "male"],
    "fil": ["female", "male"]
  }
}
```

**Time: 2 minutes**

---

### ✅ STEP 8: Test Synthesis (Optional)
```bash
curl -X POST http://localhost:8000/api/tts/synthesize/ \
  -H "Content-Type: application/json" \
  -d '{"text":"Magandang araw!","language":"fil","gender":"female"}'
```

Should download an MP3 file with beautiful Filipino voice!

**Time: 1 minute**

---

### ✅ STEP 9: Build Frontend
```bash
cd frontend
npm run build
```

**Time: 2 minutes**

---

### ✅ STEP 10: Sync and Build APK
```bash
npx cap sync android
npx cap open android
```

In Android Studio:
- Build → Build Bundle(s)/APK(s) → Build APK
- Or run on device/emulator

**Time: 5 minutes**

---

## 🎯 Testing Checklist

### Test in Mobile App:
- [ ] Open any story
- [ ] Tap speaker icon 🔊
- [ ] Story plays with voice
- [ ] Tap settings ⚙️
- [ ] See "Voice Quality" dropdown
- [ ] Cloud Voice shows "Online" status
- [ ] Select Cloud Voice
- [ ] Select Female or Male
- [ ] Play story
- [ ] Voice quality is MUCH better! 🎉
- [ ] Turn off WiFi
- [ ] Play story again
- [ ] Falls back to device voice ✅
- [ ] Turn on WiFi
- [ ] Switches back to cloud voice ✅

---

## 🎤 Voice Comparison Test

### Device TTS (Before):
"Magandang araw" - Sounds robotic 😐

### Cloud TTS WaveNet (After):
"Magandang araw" - Natural, like a real person! 🎉

**Try it yourself - the difference is HUGE!**

---

## 💰 Cost Check

After setup, check your usage:
1. Go to Google Cloud Console
2. Navigation → Billing → Reports
3. Filter by "Cloud Text-to-Speech API"
4. See usage (should be $0.00 for now)

**Free tier: 1M characters = ~100 stories/month**

---

## ⚠️ Troubleshooting

### "available": false in /api/tts/status/

**Fix:**
```bash
# Check if env variable is set
echo $GOOGLE_APPLICATION_CREDENTIALS  # Linux/Mac
echo $env:GOOGLE_APPLICATION_CREDENTIALS  # Windows

# Make sure file exists
ls $GOOGLE_APPLICATION_CREDENTIALS  # Linux/Mac
Test-Path $env:GOOGLE_APPLICATION_CREDENTIALS  # Windows

# Restart backend after setting env variable
```

---

### "Permission denied" error

**Fix:**
1. Go to Google Cloud Console
2. IAM & Admin → Service Accounts
3. Make sure your service account has "Cloud Text-to-Speech User" role
4. If not, click on it and add the role

---

### "API not enabled" error

**Fix:**
1. Go to Google Cloud Console
2. APIs & Services → Library
3. Search "Cloud Text-to-Speech API"
4. Click "Enable"
5. Wait 1 minute
6. Try again

---

### APK builds but TTS doesn't work

**Check:**
1. Is backend running? (http://localhost:8000)
2. Is device connected to same network?
3. Check API_BASE_URL in frontend/src/config/constants.ts
4. Should point to your backend (not localhost on mobile)
5. For testing, use your computer's IP: `http://192.168.1.X:8000`

---

## 🎉 Success Indicators

You'll know it's working when:
- ✅ /api/tts/status/ returns `"available": true`
- ✅ Voice quality is noticeably better
- ✅ Filipino pronunciation is natural
- ✅ Settings show "Premium quality (Google WaveNet)"
- ✅ Offline fallback works
- ✅ No errors in console

---

## 📊 Quick Stats

### Setup Time:
- **Minimum:** 15 minutes (if everything goes smooth)
- **Average:** 20-30 minutes (with testing)
- **Maximum:** 45 minutes (with troubleshooting)

### Difficulty:
- ⭐⭐ Easy (if you follow steps)
- ⭐⭐⭐ Medium (if you encounter issues)

### Value:
- 🎯 **HUGE!** Professional-quality narration
- 🇵🇭 Native Filipino voices
- 💰 Free for personal use
- 🚀 Premium feature

---

## 🎊 You're Done!

If all tests pass, you now have:
- ✅ Premium WaveNet voices (English + Filipino)
- ✅ Smart online/offline fallback
- ✅ Natural storytelling narration
- ✅ Professional app quality
- ✅ Free for personal use!

**Congratulations! Enjoy your premium TTS system!** 🎉📚🎤

---

## 📚 Next Steps

### Optional Improvements:
1. **Audio Caching** - Store generated audio to reduce API calls
2. **Usage Monitoring** - Set up alerts in Google Cloud
3. **Rate Limiting** - Protect your API from abuse
4. **Voice Preview** - Let users hear samples

### Documentation:
- Full guide: `Documentation/12-Text-To-Speech/HYBRID_TTS_IMPLEMENTATION_GUIDE.md`
- Quick start: `QUICK_START_HYBRID_TTS.md`
- Session summary: `Documentation/TTS_KEYBOARD_AND_HYBRID_TTS_COMPLETE.md`

---

**Questions? Check the documentation or console logs!**

*Setup checklist created: 2024*
*Estimated time: 15-30 minutes*
*Difficulty: ⭐⭐ Easy*
*Value: 🎯 HUGE!*
