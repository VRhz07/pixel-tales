# 🚀 Deployment Checklist - Voice Fix

## Pre-Deployment Verification

### ✅ Code Changes Verified
- [ ] Backend: `backend/storybook/tts_service.py` updated
  - [ ] Neural2 voices configured for US English
  - [ ] WaveNet voices configured for Filipino
  - [ ] Enhanced logging added
  - [ ] Voice validation warnings added
- [ ] Frontend: `frontend/src/hooks/useTextToSpeech.ts` updated
  - [ ] localStorage persistence added for cloudVoiceId
  - [ ] localStorage persistence added for useCloudTTS
  - [ ] Save effects added
- [ ] Frontend: `frontend/src/components/common/TTSControls.tsx` updated
  - [ ] Voice labels clarified
  - [ ] Helper text added
  - [ ] Change logging added

### ✅ Local Testing Completed
- [ ] Backend server starts without errors
- [ ] Frontend builds without errors
- [ ] Voice dropdown shows 4 options
- [ ] Voice selection persists after refresh
- [ ] English voices sound natural (Neural2)
- [ ] Filipino voices sound native
- [ ] Console logs show correct voice changes
- [ ] localStorage contains correct keys

### ✅ Documentation Created
- [ ] `VOICE_FIX_SUMMARY.md` - Complete summary
- [ ] `GOOGLE_CLOUD_VOICE_SETUP_GUIDE.md` - Setup guide
- [ ] `VOICE_QUICK_REFERENCE.md` - Quick reference
- [ ] `frontend/VOICE_TESTING_INSTRUCTIONS.md` - Testing steps
- [ ] `test_google_cloud_voices.py` - Test script
- [ ] `frontend/test-tts-voices.html` - Browser test page
- [ ] `DEPLOYMENT_CHECKLIST_VOICE_FIX.md` - This file

## Deployment Steps

### Step 1: Commit Changes
```bash
# Check what files changed
git status

# Add all changes
git add backend/storybook/tts_service.py
git add frontend/src/hooks/useTextToSpeech.ts
git add frontend/src/components/common/TTSControls.tsx
git add *.md
git add test_google_cloud_voices.py
git add frontend/test-tts-voices.html

# Commit with descriptive message
git commit -m "Fix: Upgrade to Neural2 voices and add voice persistence

- Upgraded US English voices to Neural2 (more natural)
- Added localStorage persistence for voice selection
- Enhanced voice labels and descriptions
- Added comprehensive logging and validation
- Created testing tools and documentation"

# Push to main branch
git push origin main
```

### Step 2: Monitor Render Deployment

#### Backend Deployment
- [ ] Go to Render dashboard → Backend service
- [ ] Wait for "Deploy succeeded" message
- [ ] Check deploy logs for errors
- [ ] Look for: `✅ Google Cloud TTS client initialized successfully`
- [ ] Verify no import errors or syntax errors

#### Frontend Deployment
- [ ] Go to Render dashboard → Frontend service
- [ ] Wait for "Deploy succeeded" message
- [ ] Check build logs for errors
- [ ] Verify build completes successfully

### Step 3: Post-Deployment Testing

#### Test 1: Backend API
```bash
# Test TTS endpoint (use your Render URL)
curl -X POST https://your-backend.onrender.com/api/tts/synthesize/ \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello world","voice_id":"female_english","language":"en","rate":1.0,"pitch":0.0,"volume":0.0}'

# Should return audio/mpeg data (binary)
# Status code should be 200
```

#### Test 2: Voice Status Endpoint
```bash
curl https://your-backend.onrender.com/api/tts/status/

# Should return:
# {
#   "available": true,
#   "service": "google-cloud-tts",
#   "voices": [...]
# }
```

#### Test 3: Frontend Voice Selection
1. [ ] Open app in browser
2. [ ] Open DevTools console (F12)
3. [ ] Go to Story Reader
4. [ ] Open TTS settings
5. [ ] Select "Female (US English)"
6. [ ] Console should show: `🎤 Voice changed to: female_english`
7. [ ] Refresh page
8. [ ] Voice should still be "Female (US English)"

#### Test 4: Voice Playback
1. [ ] Select "Female (US English)"
2. [ ] Play a story
3. [ ] Voice should sound natural and warm
4. [ ] Backend logs should show:
   ```
   Voice: en-US-Neural2-F (Female (US English - Natural))
   ```

#### Test 5: All Voices
Test each voice:
- [ ] 👩 Female (US English) - Natural, warm
- [ ] 👨 Male (US English) - Natural, clear
- [ ] 👩 Female (Filipino Tagalog) - Native speaker
- [ ] 👨 Male (Filipino Tagalog) - Native speaker

### Step 4: Verify localStorage Persistence
```javascript
// In browser console:
localStorage.getItem('tts_cloudVoiceId')  // Should return selected voice
localStorage.getItem('tts_useCloudTTS')   // Should return 'true'

// Test persistence:
localStorage.setItem('tts_cloudVoiceId', 'male_english');
location.reload();
// After reload, should still show Male English selected
```

### Step 5: Check Backend Logs
In Render dashboard → Backend service → Logs:

Look for successful requests:
```
🎤 TTS request: 234 chars, voice_id: female_english, fallback_lang: en
🎤 Selected voice: en-US-Neural2-F (Female (US English - Natural))
🎙️ Synthesizing speech:
   - Voice: en-US-Neural2-F (Female (US English - Natural))
   - Description: Natural and expressive female voice
✅ Speech synthesis successful: 45678 bytes
```

Look for warning signs (should NOT see):
```
⚠️ Expected Neural2 voice for English, but got: en-US-Wavenet-F
❌ Failed to initialize Google Cloud TTS client
ImportError: cannot import name 'texttospeech'
```

## Rollback Plan

### If Deployment Fails

#### Option 1: Revert Commit
```bash
git revert HEAD
git push origin main
```

#### Option 2: Deploy Previous Commit
```bash
git reset --hard HEAD~1
git push origin main --force
```

#### Option 3: Manual Rollback in Render
1. Go to Render dashboard
2. Click service → Deploys
3. Find previous successful deploy
4. Click "Redeploy"

## Known Issues & Solutions

### Issue: "TTS service not available"
**Solution**: Check Google Cloud credentials in Render environment variables
```
GOOGLE_APPLICATION_CREDENTIALS should be set
GOOGLE_CLOUD_PROJECT_ID should be set
```

### Issue: Voice still sounds robotic
**Solution**: 
1. Check backend logs - should show Neural2 not Wavenet
2. Clear browser cache
3. Force refresh (Ctrl+Shift+R)
4. Restart backend service

### Issue: Voice selection not persisting
**Solution**:
1. Check browser localStorage is enabled
2. Check console for save logs
3. Try different browser
4. Clear localStorage and test again

### Issue: Filipino voices not working
**Solution**:
1. Verify language code is 'fil' not 'tl'
2. Check backend logs for language code
3. Verify Google Cloud supports fil-PH in your project region

## User Communication

### After Successful Deployment

Post to users:
```
🎉 Voice Quality Update!

We've upgraded our text-to-speech system with better voices:

✨ What's New:
• More natural-sounding US English voices
• Optimized Filipino/Tagalog voices
• Your voice preference now saves automatically
• Clearer voice labels and descriptions

🎤 4 Voices Available:
• 👩 Female (US English) - Warm and expressive
• 👨 Male (US English) - Clear and engaging
• 👩 Female (Filipino Tagalog) - Native speaker
• 👨 Male (Filipino Tagalog) - Native speaker

📍 How to Change:
1. Open any story
2. Click ⚙️ on TTS controls
3. Select "Cloud Voice"
4. Pick your favorite voice!

Enjoy the improved storytelling experience! 📚
```

## Success Metrics

After 24 hours, check:
- [ ] No increase in TTS-related errors
- [ ] User feedback is positive
- [ ] Backend logs show Neural2 voices being used
- [ ] localStorage persistence is working for users
- [ ] No complaints about voice quality
- [ ] No increase in fallback to device TTS

## Monitoring

### Week 1 Post-Deployment
- [ ] Day 1: Check logs every 2 hours
- [ ] Day 2-3: Check logs twice daily
- [ ] Day 4-7: Check logs daily
- [ ] Review user feedback
- [ ] Monitor Google Cloud TTS usage/costs

### Metrics to Track
- Total TTS requests
- Voice distribution (which voices are popular)
- Error rate
- Fallback rate (cloud → device)
- Google Cloud character usage
- User satisfaction

## Final Checklist

Before marking as complete:
- [ ] All code changes deployed successfully
- [ ] Backend service is healthy
- [ ] Frontend builds correctly
- [ ] Voice selection works
- [ ] Voice persistence works
- [ ] Voice quality is improved
- [ ] All 4 voices tested
- [ ] Documentation is accessible
- [ ] Team is notified
- [ ] Users are informed
- [ ] Monitoring is in place

## Completion

Deployment completed by: ___________________
Date: ___________________
Sign-off: ___________________

Notes:
_________________________________________________
_________________________________________________
_________________________________________________
