# 🎤 Text-to-Speech Improvements & Better Voice Options

## 🎯 Problem Statement

The current TTS implementation has several limitations:
1. **Robotic voices** - Web Speech API voices sound mechanical
2. **No voice selection on mobile** - Voices don't appear in the dropdown
3. **Poor Tagalog support** - Limited Filipino voice options
4. **No storytelling optimization** - Voices aren't designed for narration

---

## ✅ Improvements Made (Current Version)

### 1. Load Native Mobile Voices
- Fixed voice loading on Android/iOS using `getSupportedVoices()`
- Voices now appear in the settings dropdown on mobile
- Auto-selects best Filipino voice for Tagalog stories

### 2. Voice Selection on Mobile
- Users can now see and select from installed TTS voices
- Shows voice name and language code
- Properly uses voice index for Capacitor TTS

### 3. TTS Engine Installation Helper
- Added "Install TTS Engine" button
- Direct link to Play Store TTS installation
- Helpful prompts when no voices are available
- Recommends Google Text-to-Speech for Filipino support

### 4. Better Error Handling
- Clear error messages when TTS fails
- Option to install TTS engine on error
- Console logging for debugging

### 5. Filipino Voice Detection
- Searches for `fil-PH`, `fil`, and Filipino variants
- Falls back to default voice if no Filipino found
- Auto-selects best voice based on current language

---

## 🎙️ How to Get Better Voices (For Users)

### On Android Mobile (Recommended):

#### **Option 1: Google Text-to-Speech (Best for Filipino)** ⭐⭐⭐⭐⭐
1. Open Play Store
2. Search for "Google Text-to-Speech"
3. Install/Update the app
4. Open Android Settings → System → Languages & Input → Text-to-Speech
5. Select "Google Text-to-Speech Engine"
6. Tap Settings → Install voice data
7. Download **Filipino (Philippines)** voice

**Available Filipino Voices:**
- Filipino (Philippines) - Female voice
- Filipino (Philippines) - Male voice

**Quality:** High quality, natural-sounding voices optimized for storytelling

#### **Option 2: Samsung Text-to-Speech**
- Pre-installed on Samsung devices
- Good quality
- Limited Filipino support

#### **Option 3: eSpeak TTS (Free, Open Source)**
- Very robotic
- Multiple languages including Filipino
- Not recommended for storytelling

---

## 🚀 Future Upgrade Options

### Option A: Google Cloud Text-to-Speech API (RECOMMENDED) ⭐⭐⭐⭐⭐

#### **Why It's the Best:**
- **Quality:** Industry-leading WaveNet voices
- **Filipino Support:** Excellent native Filipino voices
- **Cost:** FREE tier - 1 million characters/month WaveNet, 4 million standard
- **Easy Integration:** Simple REST API

#### **Available Filipino Voices:**
```
fil-PH-Wavenet-A - Female, Natural storytelling voice
fil-PH-Wavenet-B - Female, Warm and friendly
fil-PH-Wavenet-C - Male, Clear and articulate
fil-PH-Wavenet-D - Male, Deep and authoritative

fil-PH-Standard-A - Female, Standard quality
fil-PH-Standard-B - Female, Standard quality
fil-PH-Standard-C - Male, Standard quality
fil-PH-Standard-D - Male, Standard quality
```

#### **Implementation Plan:**
```typescript
// Backend: backend/storybook/tts_service.py
from google.cloud import texttospeech

def generate_speech(text: str, language: str = 'en-US', voice_name: str = None):
    client = texttospeech.TextToSpeechClient()
    
    # Select voice based on language
    if language == 'fil-PH':
        voice_name = voice_name or 'fil-PH-Wavenet-A'
    else:
        voice_name = voice_name or 'en-US-Neural2-C'
    
    synthesis_input = texttospeech.SynthesisInput(text=text)
    voice = texttospeech.VoiceSelectionParams(
        language_code=language,
        name=voice_name
    )
    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3,
        speaking_rate=1.0,
        pitch=0.0
    )
    
    response = client.synthesize_speech(
        input=synthesis_input,
        voice=voice,
        audio_config=audio_config
    )
    
    return response.audio_content

# Frontend: Call backend API
const audio = await fetch('/api/tts/generate', {
    method: 'POST',
    body: JSON.stringify({ text, language, voice })
});
```

#### **Cost Analysis:**
- **Free Tier:** 1M WaveNet chars/month = ~20-30 full storybooks
- **Paid:** $16 per 1M WaveNet characters
- **Most users:** Will never exceed free tier

#### **Setup Steps:**
1. Create Google Cloud account (free)
2. Enable Text-to-Speech API
3. Create service account and download key
4. Add to backend: `pip install google-cloud-texttospeech`
5. Set environment variable: `GOOGLE_APPLICATION_CREDENTIALS`

---

### Option B: ElevenLabs (Premium Quality) ⭐⭐⭐⭐⭐

#### **Why It's Amazing:**
- **Quality:** Hollywood-quality, ultra-realistic
- **Emotion:** Voices have natural emotion and expression
- **Storytelling:** Optimized for narration
- **Voice Cloning:** Can clone any voice

#### **Limitations:**
- **Free Tier:** Only 10,000 characters/month (~1-2 stories)
- **No Native Tagalog:** Uses English voices (can speak Tagalog with accent)
- **Cost:** $5/month for 30K chars, $22/month for 100K chars

#### **Best For:** Premium feature for subscribers

---

### Option C: Piper TTS (Local, Offline) ⭐⭐⭐⭐

#### **Why It's Great:**
- **Quality:** Near-human quality
- **Offline:** Works without internet
- **Free:** Completely free and open source
- **Filipino:** Has Filipino voice models

#### **Implementation:**
```bash
# Install Piper
pip install piper-tts

# Download Filipino voice model
wget https://huggingface.co/rhasspy/piper-voices/resolve/main/fil/fil_PH/fil_PH-fil_filipino-medium.onnx

# Generate speech
echo "Magandang araw!" | piper \
  --model fil_PH-fil_filipino-medium.onnx \
  --output_file output.wav
```

#### **Pros:**
- Fast inference
- Small model size (20-100MB)
- Works offline
- No API costs

#### **Cons:**
- Need to bundle models in APK (+50MB)
- Need to run inference on device (CPU intensive)
- Requires native implementation

---

### Option D: Coqui TTS (Open Source) ⭐⭐⭐⭐

#### **Features:**
- Professional quality
- Voice cloning
- Multiple models
- Active community

#### **Limitations:**
- Requires self-hosting
- Limited Filipino support
- Larger models
- More complex setup

---

## 📊 Comparison Table

| Solution | Quality | Filipino | Cost | Offline | Easy Setup |
|----------|---------|----------|------|---------|------------|
| **Current (Device TTS)** | ⭐⭐ | ⚠️ Varies | Free | ✅ | ⭐⭐⭐⭐⭐ |
| **Google Cloud TTS** | ⭐⭐⭐⭐⭐ | ✅ Excellent | Free tier | ❌ | ⭐⭐⭐⭐⭐ |
| **ElevenLabs** | ⭐⭐⭐⭐⭐ | ⚠️ Limited | $5+/mo | ❌ | ⭐⭐⭐⭐⭐ |
| **Piper TTS** | ⭐⭐⭐⭐ | ✅ Good | Free | ✅ | ⭐⭐⭐ |
| **Coqui TTS** | ⭐⭐⭐⭐ | ⚠️ Limited | Free | ⚠️ | ⭐⭐ |

---

## 🎬 Quick Implementation Guide

### Phase 1: Current Improvements (DONE ✅)
- ✅ Load native voices on mobile
- ✅ Show voice selection
- ✅ Add TTS engine installer
- ✅ Better error handling
- ✅ Filipino voice detection

### Phase 2: Google Cloud TTS (Recommended Next Step)

#### **Step 1: Setup Google Cloud**
```bash
# Install SDK
pip install google-cloud-texttospeech

# Set credentials
export GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account-key.json"
```

#### **Step 2: Add Backend Endpoint**
```python
# backend/storybook/views.py
@api_view(['POST'])
def generate_tts(request):
    text = request.data.get('text')
    language = request.data.get('language', 'en-US')
    voice_name = request.data.get('voice')
    
    audio_content = tts_service.generate_speech(text, language, voice_name)
    
    response = HttpResponse(audio_content, content_type='audio/mpeg')
    response['Content-Disposition'] = 'inline; filename="speech.mp3"'
    return response
```

#### **Step 3: Update Frontend**
```typescript
// Add option to use cloud TTS
const useCloudTTS = async (text: string) => {
  const response = await fetch(`${API_BASE_URL}/api/tts/generate/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      language: language === 'tl' ? 'fil-PH' : 'en-US',
      voice: 'fil-PH-Wavenet-A'
    })
  });
  
  const audioBlob = await response.blob();
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);
  audio.play();
};
```

#### **Step 4: Add Settings Toggle**
```tsx
// Settings: Let user choose between device TTS and cloud TTS
<select value={ttsProvider} onChange={(e) => setTTSProvider(e.target.value)}>
  <option value="device">Device Voices (Free, Offline)</option>
  <option value="cloud">Cloud Voices (High Quality, Online)</option>
</select>
```

---

## 🎯 Recommended Solution

### **Hybrid Approach (Best of Both Worlds)**

1. **Default:** Device TTS with improved voice selection
   - Works offline
   - No cost
   - Fast
   - Uses improvements from Phase 1

2. **Optional:** Google Cloud TTS for premium experience
   - Toggle in settings
   - Only for users who want best quality
   - Still free tier for most users
   - Excellent Filipino support

3. **Fallback:** Always keep device TTS as backup
   - If cloud fails, use device
   - If offline, use device
   - Seamless experience

---

## 📱 User Guide: How to Get Better Voices

### For PixelTales Users:

#### **To Improve Voice Quality Now:**

1. **Open PixelTales app**
2. **Go to Story Reader**
3. **Tap the Settings icon (gear) in TTS controls**
4. **If you see "No voices available":**
   - Tap "Install TTS Engine"
   - Install "Google Text-to-Speech" from Play Store
   - Download Filipino voice data

5. **Select your preferred voice:**
   - Look for Filipino voices (fil-PH)
   - Try different voices to find the best one
   - For storytelling, female voices often work better

6. **Adjust settings:**
   - Speed: 0.9x - 1.0x for storytelling
   - Volume: 80-100%
   - Pitch: 1.0 (default)

#### **Recommended TTS Engines:**

**For Filipino Stories:**
1. Google Text-to-Speech ⭐⭐⭐⭐⭐
2. Samsung TTS (Samsung devices) ⭐⭐⭐⭐

**For English Stories:**
1. Google Text-to-Speech ⭐⭐⭐⭐⭐
2. Samsung TTS ⭐⭐⭐⭐
3. Any device default should work fine

---

## 🔧 Testing the Improvements

### Test Checklist:

#### **Mobile APK:**
- [ ] Open story reader
- [ ] Tap TTS settings
- [ ] Verify voices appear in dropdown
- [ ] Select a Filipino voice (if available)
- [ ] Play story narration
- [ ] Check voice quality
- [ ] Try "Install TTS Engine" button
- [ ] Install Google TTS and test again

#### **Web Browser:**
- [ ] Open story reader
- [ ] Tap TTS settings
- [ ] Verify voices appear
- [ ] Select different voices
- [ ] Test narration quality

---

## 📝 Summary

### What Was Fixed:
1. ✅ Voices now load on mobile
2. ✅ Voice selection works in dropdown
3. ✅ Added TTS engine installer
4. ✅ Better Filipino voice detection
5. ✅ Improved error handling

### What Users Should Do:
1. Install Google Text-to-Speech
2. Download Filipino voice data
3. Select Filipino voice in TTS settings
4. Enjoy better narration!

### Next Steps (Optional):
1. Integrate Google Cloud TTS for premium quality
2. Add voice preview feature
3. Add voice recommendations
4. Pre-cache common phrases
5. Add voice bookmarking

---

## 🎓 Technical Notes

### Files Modified:
- `frontend/src/hooks/useTextToSpeech.ts` - Added native voice loading
- `frontend/src/components/common/TTSControls.tsx` - Added install button

### Key Changes:
```typescript
// Load native voices using Capacitor
const result = await TextToSpeech.getSupportedVoices();
setVoices(result.voices);

// Use voice index for native TTS
const voiceIndex = voices.findIndex(v => v.name === currentVoice.name);
await TextToSpeech.speak({ text, voice: voiceIndex });

// Open TTS installer
await TextToSpeech.openInstall();
```

---

*Last Updated: 2024*
*Status: Phase 1 Complete ✅*
*Next: Google Cloud TTS Integration (Optional)*
