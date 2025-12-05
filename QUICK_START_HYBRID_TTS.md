# 🚀 Quick Start: Hybrid TTS (Cloud + Device)

## 🎯 What You Get

✅ **Premium Filipino voices** (Google WaveNet) when online
✅ **Device voices** as fallback when offline  
✅ **Automatic switching** - seamless experience
✅ **100% FREE** for personal use (Google free tier)

---

## ⚡ 5-Minute Setup

### Step 1: Install Backend Package (30 seconds)

```bash
cd backend
pip install google-cloud-texttospeech==2.16.3
```

### Step 2: Get Google Cloud Key (3 minutes)

1. Go to https://console.cloud.google.com
2. Create new project (or use existing)
3. Enable **"Cloud Text-to-Speech API"**
4. IAM & Admin → Service Accounts → **Create Service Account**
5. Grant role: **"Cloud Text-to-Speech User"**
6. Create Key → **JSON** → Download

### Step 3: Set Environment Variable (1 minute)

**Windows (PowerShell):**
```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\service-account-key.json"
```

**Linux/Mac:**
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
```

**Or add to backend/.env:**
```
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

### Step 4: Test Backend (30 seconds)

```bash
cd backend
python manage.py runserver
```

Open: http://localhost:8000/api/tts/status/

Should see:
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

### Step 5: Build APK

```bash
cd frontend
npm run build
npx cap sync android
npx cap open android
```

---

## 🎤 Available Voices

### English:
- 👩 **Female**: Natural, clear voice for storytelling
- 👨 **Male**: Natural, clear voice for storytelling

### Filipino:
- 👩 **Female**: Native Tagalog WaveNet voice (fil-PH-Wavenet-A)
- 👨 **Male**: Native Tagalog WaveNet voice (fil-PH-Wavenet-C)

---

## 💡 How to Use

1. **Open any story in PixelTales**
2. **Tap the speaker icon** 🔊
3. **Tap settings** ⚙️
4. **Choose voice quality:**
   - ☁️ **Cloud Voice** (Premium, online)
   - 📱 **Device Voice** (Good, offline)
5. **Select gender** (for Cloud Voice)
6. **Tap play and enjoy!** 🎉

---

## 💰 Cost

### Free Tier (Monthly):
- **1 million characters** with WaveNet voices
- = **~100 full storybooks per month**
- = **~3 stories per day**

### For Most Users:
**100% FREE FOREVER!** 🎉

You'll only pay if you exceed 100 stories/month, which is unlikely for personal use.

---

## 🔄 How Fallback Works

```
Story starts playing
    ↓
Is Cloud TTS enabled? → NO → Use Device TTS ✅
    ↓ YES
Is device online? → NO → Use Device TTS ✅
    ↓ YES
Try Cloud TTS
    ↓
Success? → Play with premium voice ✅
    ↓ Fail?
Fallback to Device TTS ✅
```

**Result:** Always works! 🚀

---

## 🎯 Features

✅ **Smart Fallback** - Never fails to play
✅ **Premium Quality** - Hollywood-level voices  
✅ **Native Filipino** - Perfect Tagalog pronunciation
✅ **Works Offline** - Device TTS always available
✅ **Easy Toggle** - Switch between cloud/device
✅ **Free Tier** - Generous quota
✅ **No Setup for Users** - Works out of the box

---

## 🛠️ Troubleshooting

### "Cloud TTS not available"
- Check if backend is running
- Verify `GOOGLE_APPLICATION_CREDENTIALS` path
- Enable Text-to-Speech API in Google Cloud

### "No device voices"
- Install Google Text-to-Speech from Play Store
- Download Filipino voice data
- Restart app

### "Service account error"
- Check JSON key file exists
- Verify service account has correct role
- Re-download key if needed

---

## 📁 Files Changed

### Backend (3 files):
1. `backend/storybook/tts_service.py` ✅ (NEW)
2. `backend/storybook/tts_views.py` ✅ (NEW)
3. `backend/storybook/urls.py` ✅ (UPDATED)
4. `backend/requirements.txt` ✅ (UPDATED)

### Frontend (2 files):
1. `frontend/src/hooks/useTextToSpeech.ts` ✅ (UPDATED)
2. `frontend/src/components/common/TTSControls.tsx` ✅ (UPDATED)

---

## ✅ Testing Checklist

Before deploying, test:

- [ ] Backend starts without errors
- [ ] `/api/tts/status/` returns `"available": true`
- [ ] Can synthesize English text
- [ ] Can synthesize Filipino text  
- [ ] APK builds successfully
- [ ] Cloud TTS works on mobile (online)
- [ ] Device TTS works on mobile (offline)
- [ ] Switching between modes works
- [ ] Voice quality is noticeably better

---

## 🎉 Success!

If you completed all steps, you now have:
- ✅ Premium Filipino TTS voices
- ✅ Automatic offline fallback
- ✅ Professional narration quality
- ✅ Free for personal use

**Enjoy natural storytelling!** 📚🎤

---

## 📚 Full Documentation

See `Documentation/12-Text-To-Speech/HYBRID_TTS_IMPLEMENTATION_GUIDE.md` for:
- Detailed API documentation
- Advanced configuration
- Security best practices
- Future enhancements
- Complete troubleshooting guide

---

*Setup Time: ~5 minutes*  
*Difficulty: ⭐⭐ Easy*  
*Status: ✅ Ready to use*
