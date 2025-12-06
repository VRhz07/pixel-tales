# 🎤 Voice Quick Reference Card

## Voice Options

| Voice ID | Label | Language | Quality | Best For |
|----------|-------|----------|---------|----------|
| `female_english` | 👩 Female (US English) | en-US | Neural2 | Children's stories, warm narration |
| `male_english` | 👨 Male (US English) | en-US | Neural2 | Educational content, clear narration |
| `female_filipino` | 👩 Female (Filipino Tagalog) | fil-PH | WaveNet | Filipino children's stories |
| `male_filipino` | 👨 Male (Filipino Tagalog) | fil-PH | WaveNet | Filipino educational content |

## How to Change Voice

### In the App UI:
1. Open any story in Story Reader
2. Click the **⚙️ Settings** icon on TTS controls
3. Make sure **"☁️ Cloud Voice"** is selected
4. Choose your voice from the **"Voice"** dropdown
5. Close settings and click **Play** ▶️

### Voice Changes Are Saved:
- ✅ Your selection persists across page refreshes
- ✅ Saved to browser localStorage
- ✅ Applied immediately to all stories

## Testing Voices

### Quick Test in Browser:
```javascript
// Open DevTools Console (F12) and run:
localStorage.setItem('tts_cloudVoiceId', 'female_english');
// Then refresh and play any story
```

### Test All Voices:
```powershell
# Run test script (generates MP3 files)
python test_google_cloud_voices.py
```

## Troubleshooting

### Voice Not Changing?
**Check Console Logs:**
```
🎤 Voice changed to: female_english
🎤 TTS: Saved cloud voice preference: female_english
```

**Check Backend Logs:**
```
🎤 Selected voice: en-US-Neural2-F (Female (US English - Natural))
🎙️ Synthesizing speech:
   - Voice: en-US-Neural2-F
```

### Still Sounds Wrong?
1. Clear browser cache and localStorage
2. Restart backend server
3. Check you're online (Cloud TTS requires internet)
4. Verify Google Cloud credentials are set

## Voice Specifications

### US English (Neural2)
```python
Female: en-US-Neural2-F  # Warm, expressive, natural
Male:   en-US-Neural2-D  # Clear, engaging, natural
```

### Filipino Tagalog (WaveNet)
```python
Female: fil-PH-Wavenet-A  # Native speaker, clear
Male:   fil-PH-Wavenet-D  # Native speaker, authoritative
```

## API Request Format

```json
POST /api/tts/synthesize/
{
  "text": "Your story text here",
  "voice_id": "female_english",
  "language": "en",
  "rate": 1.0,
  "pitch": 0.0,
  "volume": 0.0
}
```

## localStorage Keys

```javascript
tts_cloudVoiceId: 'female_english' | 'male_english' | 'female_filipino' | 'male_filipino'
tts_useCloudTTS: 'true' | 'false'
```

## Default Voice

If no preference saved:
- **Default**: `female_english` (US English Neural2 female)
- **Auto-detect**: Based on story language if available

## Free Tier Limits

- **1,000,000 characters/month FREE**
- Average story: 500-1000 characters
- Can read ~1000-2000 stories/month for FREE

---

💡 **Pro Tip**: Try all 4 voices to find your favorite! Each has a unique personality.
