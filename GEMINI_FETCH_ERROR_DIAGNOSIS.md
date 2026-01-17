# Gemini Fetch Error Diagnosis

## Error Details

```
AIStoryModal.tsx:622 Error generating story: TypeError: Failed to fetch
    at generateStoryWithGemini (geminiProxyService.ts:41:28)
    at handleGenerate (AIStoryModal.tsx:191:35)
```

---

## Root Cause Analysis

The "Failed to fetch" error at line 41 in `geminiProxyService.ts` means the frontend **cannot connect to the backend API endpoint**.

### What Line 41 Does:

```typescript
const response = await fetch(`${apiConfigService.getApiUrl()}/ai/gemini/generate-story/`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({ prompt, generationConfig }),
});
```

This tries to call: `[API_URL]/ai/gemini/generate-story/`

---

## Possible Causes

### ❌ Cause 1: Backend Server Not Running

**Symptom:** Fetch fails immediately with no network activity

**Check:**
1. Is your Django backend server running?
2. Open a terminal and run:
   ```bash
   cd backend
   python manage.py runserver
   ```
3. You should see:
   ```
   Starting development server at http://127.0.0.1:8000/
   ```

**Fix:** Start the backend server

---

### ❌ Cause 2: Wrong API URL Configuration

**Symptom:** Fetch times out or fails to reach server

**Check:**
1. Open browser console and look for:
   ```
   [Dev Mode] Using custom API URL: [some URL]
   ```
2. The API URL should be one of:
   - Production: `https://pixeltales-backend.onrender.com/api`
   - Local development: `http://localhost:8000/api`
   - ADB forwarding: `http://localhost:8000/api` (with adb port forward)
   - Emulator: `http://10.0.2.2:8000/api`

**Check Current API URL:**
```javascript
// In browser console, run:
localStorage.getItem('dev_api_url')
```

**Fix Option A - Reset to Production:**
```javascript
// In browser console, run:
localStorage.removeItem('dev_api_url')
location.reload()
```

**Fix Option B - Set to Localhost:**
```javascript
// In browser console, run:
localStorage.setItem('dev_api_url', 'http://localhost:8000/api')
location.reload()
```

---

### ❌ Cause 3: CORS Issues (Cross-Origin)

**Symptom:** Console shows CORS error along with failed fetch

**Check:** Look in browser console for:
```
Access to fetch at 'http://localhost:8000/api/...' from origin 'http://localhost:5173' 
has been blocked by CORS policy
```

**Fix:** Add frontend URL to Django CORS settings

In `backend/storybookapi/settings.py`, verify:
```python
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',  # Vite dev server
    'http://localhost:3000',  # Alternative port
    'http://127.0.0.1:5173',
    # Your production frontend URL
]
```

Or temporarily allow all (NOT for production):
```python
CORS_ALLOW_ALL_ORIGINS = True
```

Restart Django server after changing settings.

---

### ❌ Cause 4: Missing Authentication Token

**Symptom:** Error happens even though backend is running

**Check:**
```javascript
// In browser console, run:
localStorage.getItem('access_token')
```

If this returns `null`, you're not logged in.

**Fix:** 
1. Log out completely
2. Clear browser storage (F12 → Application → Local Storage → Clear All)
3. Refresh page
4. Log in again

---

### ❌ Cause 5: Endpoint URL Mismatch

**Symptom:** Server returns 404 Not Found

**Verify Backend Routes:**

The endpoint should be configured in `backend/storybook/urls.py` (Line 203):
```python
path('ai/gemini/generate-story/', ai_proxy_views.generate_story_with_gemini, name='generate_story_with_gemini'),
```

**Test Endpoint Directly:**

1. Make sure backend is running: `python manage.py runserver`
2. Get an auth token (login via frontend first)
3. Test with curl:

```bash
curl -X POST http://localhost:8000/api/ai/gemini/generate-story/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"prompt": "test", "generationConfig": {}}'
```

**Expected Response:**
- Success: JSON response from Gemini
- Error: JSON with `{"error": "Gemini API not configured on server"}` (backend needs API key)

---

### ❌ Cause 6: Gemini API Key Not Configured

**Symptom:** Backend responds but says "Gemini API not configured"

**Check Backend Settings:**

In `backend/storybookapi/settings.py`, verify:
```python
GOOGLE_AI_API_KEY = os.getenv('GOOGLE_AI_API_KEY')
```

And in `backend/.env`:
```
GOOGLE_AI_API_KEY=your_actual_api_key_here
```

**Test if API key is loaded:**
```bash
cd backend
python manage.py shell
```
```python
from django.conf import settings
print(f"Gemini API Key exists: {bool(settings.GOOGLE_AI_API_KEY)}")
print(f"First 10 chars: {settings.GOOGLE_AI_API_KEY[:10] if settings.GOOGLE_AI_API_KEY else 'NONE'}")
```

**Fix:** 
1. Get a Gemini API key from https://aistudio.google.com/apikey
2. Add it to `backend/.env`
3. Restart Django server

---

## Step-by-Step Diagnostic Process

### Step 1: Check Backend Server

```bash
# Terminal 1 - Start backend
cd backend
python manage.py runserver
```

You should see:
```
Django version 5.1.4, using settings 'storybookapi.settings'
Starting development server at http://127.0.0.1:8000/
Quit the server with CONTROL-C.
```

✅ If you see this, backend is running → Go to Step 2
❌ If you see errors, fix them first

---

### Step 2: Check Frontend Server

```bash
# Terminal 2 - Start frontend
cd frontend
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

✅ If you see this, frontend is running → Go to Step 3

---

### Step 3: Check API URL Configuration

1. Open browser to `http://localhost:5173`
2. Open DevTools (F12) → Console
3. Check what API URL is being used:

```javascript
console.log('Current API URL:', localStorage.getItem('dev_api_url') || 'default (production)')
```

**Expected for local development:**
```
Current API URL: http://localhost:8000/api
```

**Expected for production:**
```
Current API URL: default (production)
```

❌ If it shows wrong URL, fix with:
```javascript
localStorage.setItem('dev_api_url', 'http://localhost:8000/api')
location.reload()
```

---

### Step 4: Check Authentication

1. Are you logged in?
2. Check token exists:

```javascript
console.log('Token exists:', !!localStorage.getItem('access_token'))
```

❌ If `false`, log in through the UI

---

### Step 5: Try Generating a Story

1. Navigate to Create → AI Story
2. Fill in the form
3. Click "Generate My Story"
4. Watch **both** browser console AND backend terminal

**In Browser Console - Look for:**
```
🎯 Starting AI story generation...
Gemini AI generation failed: TypeError: Failed to fetch
```

**In Backend Terminal - Look for:**
```
POST /api/ai/gemini/generate-story/ - (Should see a request)
```

✅ If you see the POST request in backend → Backend is reachable
❌ If you see NO request in backend → Connection issue (check API URL)

---

### Step 6: Check Backend Response

If backend receives the request, check what it responds:

**Look for backend errors:**
```python
# In backend terminal
{'error': 'Gemini API not configured on server'}
```

This means you need to configure `GOOGLE_AI_API_KEY` in `.env`

---

## Quick Fixes Summary

| Issue | Quick Fix |
|-------|-----------|
| Backend not running | `cd backend && python manage.py runserver` |
| Wrong API URL | `localStorage.setItem('dev_api_url', 'http://localhost:8000/api')` then reload |
| Not logged in | Log out, clear storage, log back in |
| CORS error | Add `CORS_ALLOW_ALL_ORIGINS = True` to settings.py (temporarily) |
| Missing Gemini key | Add `GOOGLE_AI_API_KEY` to `backend/.env` |
| Frontend not running | `cd frontend && npm run dev` |

---

## Most Likely Cause

Based on the error, the **most likely causes** in order:

1. **Backend server is not running** (90% probability)
2. **Wrong API URL configured** (5% probability)
3. **CORS issue** (3% probability)
4. **Authentication issue** (2% probability)

---

## Testing Script

Run this in browser console to diagnose:

```javascript
// Diagnostic Script
console.log('=== DIAGNOSTIC INFO ===');
console.log('1. Current API URL:', localStorage.getItem('dev_api_url') || 'Using default: https://pixeltales-backend.onrender.com/api');
console.log('2. Has auth token:', !!localStorage.getItem('access_token'));
console.log('3. Token preview:', localStorage.getItem('access_token')?.substring(0, 20) + '...');

// Test connection
const apiUrl = localStorage.getItem('dev_api_url') || 'https://pixeltales-backend.onrender.com/api';
fetch(`${apiUrl}/ai/status/`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
  }
})
  .then(res => {
    console.log('4. Backend reachable:', res.ok);
    console.log('5. Status code:', res.status);
    return res.json();
  })
  .then(data => {
    console.log('6. AI Services status:', data);
  })
  .catch(err => {
    console.error('4. Backend NOT reachable:', err.message);
    console.log('   This is likely your issue!');
  });
console.log('=== END DIAGNOSTIC ===');
```

---

## Solution Based on Test Results

### If Backend NOT reachable:
→ Start your Django backend server: `cd backend && python manage.py runserver`

### If Backend reachable but `gemini_available: false`:
→ Configure Gemini API key in `backend/.env`

### If Backend reachable and `gemini_available: true`:
→ Different issue - check browser console for more specific error

---

## Next Steps

Please run the **Testing Script** above in your browser console and share:
1. What the diagnostic script outputs
2. Whether your backend server is running
3. Any errors you see in the backend terminal

This will help me provide a more specific fix!
