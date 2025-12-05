# TTS Voice Accent Update

## Summary
Updated the Text-to-Speech (TTS) system to provide accent-specific voice selection instead of gender-based selection. The Cloud TTS now offers 4 distinct voices with English and Filipino accents.

## Changes Made

### Backend Changes

#### `backend/storybook/tts_service.py`
- **Changed voice structure** from language → gender to direct voice IDs
- **Added 4 voices**:
  - `female_english`: Female voice with English (US) accent
  - `female_filipino`: Female voice with Filipino accent  
  - `male_english`: Male voice with English (US) accent
  - `male_filipino`: Male voice with Filipino accent
- **Replaced `get_voice_name()`** method with `get_voice_config()`
  - Now accepts `voice_id` parameter for direct voice selection
  - Provides smart fallback to language-appropriate voice if no voice_id specified
- **Updated `synthesize_speech()`** method to accept `voice_id` parameter

#### `backend/storybook/tts_views.py`
- **Updated API endpoint** `/api/tts/synthesize/` to accept `voice_id` parameter
- **Updated `/api/tts/status/`** endpoint to return list of available voices with labels and accents
- Removed `gender` parameter in favor of `voice_id`

### Frontend Changes

#### `frontend/src/hooks/useTextToSpeech.ts`
- **Replaced `voiceGender`** state with `cloudVoiceId` state
- **Changed default** from `'female'` to `'female_english'`
- **Updated API call** to send `voice_id` instead of `gender`
- Updated return type to expose `cloudVoiceId` and `setCloudVoiceId`

#### `frontend/src/components/common/TTSControls.tsx`
- **Changed label** from "Voice Gender" to "Voice"
- **Updated dropdown options** to show 4 voices:
  - 👩 Female (English Accent)
  - 👩 Female (Filipino Accent)
  - 👨 Male (English Accent)
  - 👨 Male (Filipino Accent)
- Now uses `cloudVoiceId` state instead of `voiceGender`

## Voice Configuration

### Available Voices

| Voice ID | Gender | Accent | Google Cloud Voice | Language Code |
|----------|--------|--------|-------------------|---------------|
| `female_english` | Female | English (US) | `en-US-Neural2-C` | `en-US` |
| `female_filipino` | Female | Filipino | `fil-PH-Wavenet-A` | `fil-PH` |
| `male_english` | Male | English (US) | `en-US-Neural2-D` | `en-US` |
| `male_filipino` | Male | Filipino | `fil-PH-Wavenet-C` | `fil-PH` |

## User Experience Improvements

### Before
- Users selected "Male" or "Female" voice
- No accent selection
- Tagalog stories read by English-accent voices by default

### After
- Users select from 4 specific voices with clear accent labels
- Tagalog stories can use Filipino-accent voices
- English stories can use English-accent voices
- Better language/accent matching for story content

## API Changes

### POST `/api/tts/synthesize/`

**Old Request Body:**
```json
{
  "text": "Hello world",
  "language": "en",
  "gender": "female",
  "rate": 1.0,
  "pitch": 0.0,
  "volume": 0.0
}
```

**New Request Body:**
```json
{
  "text": "Hello world",
  "voice_id": "female_english",
  "language": "en",
  "rate": 1.0,
  "pitch": 0.0,
  "volume": 0.0
}
```

**Note:** The `language` parameter is now a fallback. If `voice_id` is not provided or invalid, the system will auto-select an appropriate voice based on the language.

### GET `/api/tts/status/`

**New Response:**
```json
{
  "available": true,
  "service": "google-cloud-tts",
  "voices": [
    {
      "id": "female_english",
      "label": "Female (English Accent)",
      "accent": "english"
    },
    {
      "id": "female_filipino",
      "label": "Female (Filipino Accent)",
      "accent": "filipino"
    },
    {
      "id": "male_english",
      "label": "Male (English Accent)",
      "accent": "english"
    },
    {
      "id": "male_filipino",
      "label": "Male (Filipino Accent)",
      "accent": "filipino"
    }
  ]
}
```

## Backward Compatibility

The backend maintains backward compatibility:
- If no `voice_id` is provided, the system falls back to language-based selection
- The `language` parameter still works as before
- Old API calls without `voice_id` will automatically select appropriate voices

## Testing

To test the new voice system:

1. **In Story Reader Page:**
   - Click the Settings (⚙️) icon in TTS controls
   - Select "☁️ Cloud Voice" as Voice Quality
   - You should see a "Voice" dropdown with 4 options
   - Select different voices and test with both English and Tagalog stories

2. **Verify Accent Matching:**
   - For Tagalog stories, try "Female (Filipino Accent)" or "Male (Filipino Accent)"
   - For English stories, try "Female (English Accent)" or "Male (English Accent)"
   - Listen to the pronunciation and accent differences

## Device Voice Filtering

### Filter Implementation
The device/offline TTS now filters voices to show **only English and Filipino voices**:

**Accepted Language Codes:**
- English: `en`, `en-US`, `en-GB`, etc. (any code starting with "en")
- Filipino/Tagalog: `fil`, `fil-PH`, `tl`, `tl-PH`, or any code containing:
  - "ph" (Philippines)
  - "filipino"
  - "tagalog"

**Before:** Device voice dropdown showed all installed voices (Spanish, French, German, etc.)

**After:** Device voice dropdown shows only English and Filipino voices

This filtering applies to:
- Native platform (Android APK using Capacitor TTS plugin)
- Web platform (browsers using Web Speech API)

### Filter Logic
```typescript
const filteredVoices = voices.filter(v => {
  if (!v.lang) return false;
  const langLower = v.lang.toLowerCase();
  
  // Include English voices (en, en-US, en-GB, etc.)
  const isEnglish = langLower.startsWith('en');
  
  // Include Filipino/Tagalog voices (fil, fil-PH, tl, tl-PH)
  const isFilipino = langLower.startsWith('fil') || 
                     langLower.startsWith('tl') || 
                     langLower.includes('ph') ||
                     langLower.includes('filipino') ||
                     langLower.includes('tagalog');
  
  return isEnglish || isFilipino;
});
```

## Files Modified

### Backend
- `backend/storybook/tts_service.py`
- `backend/storybook/tts_views.py`

### Frontend
- `frontend/src/hooks/useTextToSpeech.ts` (Cloud voice selection + Device voice filtering)
- `frontend/src/components/common/TTSControls.tsx` (UI for voice selection)

## Notes

- **No British English accent** as per requirement - all English voices use US accent
- Device/offline TTS still uses the original voice selection system (shows available device voices)
- Cloud TTS is only available when online and Google Cloud TTS credentials are configured
- The system gracefully falls back to device TTS if cloud TTS is unavailable
