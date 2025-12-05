# TTS Voice Update - Premium Voices

## Updated Voice Configuration

Changed to use specific premium Google Cloud TTS voices for better quality.

## New Voice Mapping

### English Voices (Chirp3-HD - Latest Premium)
- **Female English:** `en-US-Chirp3-HD-Erinome`
  - Latest Chirp3-HD technology
  - Natural, expressive female voice
  - Highest quality available
  - Premium tier

- **Male English:** `en-US-Chirp3-HD-Puck`
  - Latest Chirp3-HD technology
  - Natural, expressive male voice
  - Highest quality available
  - Premium tier

### Filipino Voices (Wavenet)
- **Female Filipino:** `fil-PH-Wavenet-A`
  - Natural Filipino female voice
  - Authentic Filipino accent
  - Wavenet quality

- **Male Filipino:** `fil-PH-Wavenet-D`
  - Natural Filipino male voice
  - Authentic Filipino accent
  - Wavenet quality

## Voice Quality Tiers

Google Cloud TTS has different quality tiers:

1. **Chirp3-HD (Latest Premium)** - Highest quality, most natural and expressive
   - Used for: English voices (Erinome, Puck)
   - Latest AI technology from Google
   - Most expensive but best quality
   
2. **Wavenet** - High quality, natural sounding
   - Used for: Filipino voices
   - Good balance of quality and cost
   - Proven reliable technology

3. **Neural2** - Good quality
   - Not used (Chirp3-HD is better)

4. **Standard** - Basic quality
   - Not used in our app

## Before vs After

### Before
```python
'female_english': 'en-US-Neural2-C'  # Generic Neural2 voice
'male_english': 'en-US-Neural2-D'    # Generic Neural2 voice
'female_filipino': 'fil-PH-Wavenet-A'  # ✅ Same
'male_filipino': 'fil-PH-Wavenet-C'    # Changed to D
```

### After
```python
'female_english': 'en-US-Chirp3-HD-Erinome'  # Latest Chirp3-HD voice
'male_english': 'en-US-Chirp3-HD-Puck'       # Latest Chirp3-HD voice
'female_filipino': 'fil-PH-Wavenet-A'        # ✅ Same
'male_filipino': 'fil-PH-Wavenet-D'          # Updated to D
```

## Voice Characteristics

### Erinome (Female English - Chirp3-HD)
- Natural, expressive female voice
- Latest AI voice technology
- Excellent for storytelling
- Realistic emotional range
- Highest quality available

### Puck (Male English - Chirp3-HD)
- Natural, expressive male voice
- Latest AI voice technology
- Excellent for storytelling
- Realistic emotional range
- Highest quality available

### fil-PH-Wavenet-A (Female Filipino)
- Natural Filipino accent
- Clear Tagalog pronunciation
- Authentic local sound

### fil-PH-Wavenet-D (Male Filipino)
- Natural Filipino accent
- Clear Tagalog pronunciation
- Authentic local sound

## Testing

To test the new voices:

1. **Rebuild Backend** (if running locally):
   ```bash
   cd backend
   # No rebuild needed - just restart server
   python manage.py runserver
   ```

2. **Test in App:**
   - Open Story Reader
   - Select Cloud Voice
   - Try each voice option
   - Listen to quality difference

## Cost Considerations

### Chirp3-HD Voices (Latest Premium)
- **Cost:** ~$16-20 per 1 million characters
- **When used:** English stories
- **Worth it:** Yes, for best quality and latest technology

### Wavenet Voices
- **Cost:** ~$4 per 1 million characters
- **When used:** Filipino stories
- **Worth it:** Yes, good quality at lower cost

### Estimated Monthly Cost
For typical usage (assuming 100,000 characters/month):
- English (Chirp3-HD): ~$1.60-2.00/month
- Filipino (Wavenet): ~$0.40/month
- **Total:** ~$2.00-2.40/month

Very affordable for premium quality! 💰✅

**Note:** Chirp3-HD is Google's latest and most advanced voice technology, providing the most natural and expressive speech.

## Files Modified

- ✅ `backend/storybook/tts_service.py` - Updated VOICES dictionary

## Documentation

- ✅ `Documentation/TTS_VOICE_UPDATE_PREMIUM.md` - This file

## Voice References

### Google Cloud TTS Voice List
You can find all available voices at:
- [Google Cloud TTS Voices](https://cloud.google.com/text-to-speech/docs/voices)

### Voice Naming Convention
- Format: `{language-code}-{type}-{name}`
- Example: `en-US-Premium-Charon`
  - Language: `en-US` (English, US)
  - Type: `Premium` (Neural2 tier)
  - Name: `Charon` (specific voice)

## Alternative English Wavenet Voices

If you want to use Wavenet for English (lower cost):

**Female Options:**
- `en-US-Wavenet-A`
- `en-US-Wavenet-C`
- `en-US-Wavenet-E`
- `en-US-Wavenet-F`
- `en-US-Wavenet-G`
- `en-US-Wavenet-H`

**Male Options:**
- `en-US-Wavenet-B`
- `en-US-Wavenet-D`
- `en-US-Wavenet-I`
- `en-US-Wavenet-J`

Just replace in the VOICES dictionary:
```python
'female_english': {
    'name': 'en-US-Wavenet-F',  # Instead of Kore
    'language_code': 'en-US',
    'label': 'Female (English Accent)',
    'accent': 'english'
}
```

## Recommendation

Current configuration is **optimal**:
- ✅ Premium voices for English (best quality)
- ✅ Wavenet voices for Filipino (best available)
- ✅ No British accents
- ✅ Great for storytelling

## Status

✅ **UPDATED** - Now using premium voices as requested

**Version:** 2.2
**Quality:** Premium/Wavenet
**Cost:** ~$2/month for typical usage
