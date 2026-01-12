# Mobile APK Collaboration Not Working - Diagnosis & Fix

## Problem Summary
✅ Collaboration works: Localhost (browser-to-browser)  
❌ Collaboration broken: Mobile APK with DigitalOcean backend  
**Symptom**: Users' actions are not visible to each other on mobile

---

## 🔍 Root Causes Identified

### Issue #1: InMemoryChannelLayer (CRITICAL)
**Location**: `backend/storybookapi/settings.py` lines 310-318

```python
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',  # ❌ PROBLEM
        'CONFIG': {
            'capacity': 50,
            'expiry': 30,
        },
    },
}
```

**Why this breaks mobile collaboration:**
- `InMemoryChannelLayer` stores messages in **process memory** only
- DigitalOcean likely runs **multiple worker processes** or restarts frequently
- When User A and User B connect to **different worker processes**, they can't see each other's messages
- Messages sent by User A (in Process 1) never reach User B (in Process 2)

**This works on localhost because:**
- Local development uses a **single process**
- All connections go through the same in-memory storage

**Fix Required**: Use Redis for production (shared across all processes)

---

### Issue #2: Missing WebSocket URL in Environment Files
**Location**: `frontend/.env.production` and `frontend/.env.mobile`

**Current `.env.production`:**
```env
VITE_API_BASE_URL=https://pixel-tales-yu7cx.ondigitalocean.app/api
# ❌ Missing: VITE_WS_URL or VITE_WS_BASE_URL
```

**What happens:**
The collaboration service (line 119-124) tries to construct WebSocket URL from API URL:
```typescript
const apiUrl = apiConfigService.getApiUrl();
const wsProtocol = apiUrl.startsWith('https') ? 'wss' : 'ws';
const wsHost = apiUrl.replace('http://', '').replace('https://', '').replace('/api', '');
const wsUrl = `${wsProtocol}://${wsHost}/ws/collaborate/${sessionId}/?token=${token}`;
```

**Result:**
- API URL: `https://pixel-tales-yu7cx.ondigitalocean.app/api`
- Constructed WS URL: `wss://pixel-tales-yu7cx.ondigitalocean.app/ws/collaborate/{sessionId}/`
- This **might work**, but it's not explicit and harder to debug

---

### Issue #3: Backend Not Configured for Redis (DigitalOcean)
DigitalOcean doesn't provide Redis by default. You need to:
1. Add a Redis service to your DigitalOcean app
2. Set `REDIS_URL` environment variable
3. Update `CHANNEL_LAYERS` to use Redis

---

## 🔧 Solutions

### Solution 1: Add Redis to DigitalOcean (Recommended for Production)

#### Step 1: Add Redis to DigitalOcean App
1. Go to your DigitalOcean App dashboard
2. Add a **Database** component
3. Select **Redis**
4. DigitalOcean will provide a `REDIS_URL` environment variable

#### Step 2: Update Backend Settings
**File**: `backend/storybookapi/settings.py`

Find the `CHANNEL_LAYERS` section (lines 310-318) and replace with:

```python
# Channels Configuration
# Use Redis for production (multi-process support)
# Use InMemory for local development
import os

REDIS_URL = os.getenv('REDIS_URL')

if REDIS_URL and not DEBUG:
    # Production: Use Redis for multi-process WebSocket support
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels_redis.core.RedisChannelLayer',
            'CONFIG': {
                "hosts": [REDIS_URL],
                "capacity": 300,  # Messages per channel
                "expiry": 60,  # Message expiry in seconds
            },
        },
    }
    print("✅ Using Redis for Channels (Production)")
else:
    # Local development: Use InMemory
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels.layers.InMemoryChannelLayer',
            'CONFIG': {
                'capacity': 50,
                'expiry': 30,
            },
        },
    }
    print("⚠️ Using InMemory Channels (Development only - not for production)")
```

#### Step 3: Add Redis Dependency
**File**: `backend/requirements.txt`

Add this line:
```
channels-redis>=4.0.0
```

#### Step 4: Deploy to DigitalOcean
```bash
cd backend
git add requirements.txt storybookapi/settings.py
git commit -m "Add Redis support for WebSocket collaboration"
git push origin main
```

DigitalOcean will automatically redeploy.

---

### Solution 2: Quick Fix - Single Worker (Temporary)

If you can't add Redis immediately, ensure DigitalOcean runs only **one worker process**.

**In DigitalOcean App Settings:**
1. Go to your app → Settings → Components
2. Edit your Python service
3. Set **Instance Count** to `1`
4. Set **Run Command** to: `daphne -b 0.0.0.0 -p 8080 storybookapi.asgi:application`

⚠️ **This is NOT recommended for production** because:
- Single worker = no high availability
- Server restart = all users disconnected
- Limited concurrent users

---

## 📱 How to View APK Logs (Debug the Issue)

### Method 1: Chrome DevTools (Easiest)

1. **Enable USB Debugging** on your Android device:
   ```
   Settings → About Phone → Tap "Build Number" 7 times
   Settings → Developer Options → Enable "USB Debugging"
   ```

2. **Connect via USB** and open Chrome on your computer

3. **Navigate to**: `chrome://inspect/#devices`

4. **Find your app** and click **"Inspect"**

5. **Check Console** for errors:
   ```javascript
   // Look for these errors:
   ❌ WebSocket connection failed
   ❌ Failed to force-fetch participants
   ❌ WebSocket closed with code 1006
   ```

### Method 2: Android Logcat (ADB)

```bash
# Connect device and view logs
adb devices
adb logcat | grep -i "websocket"
adb logcat | grep -i "collaboration"
```

### What to Look For in Logs:

**Good (Working) Logs:**
```
🔗 Connected to collaboration session
✅ Force-fetched participants: 2
📡 Sending presence update
👥 Received canvas update from other user
```

**Bad (Broken) Logs:**
```
❌ WebSocket connection failed
❌ WebSocket closed: 1006
Failed to force-fetch participants
No participants found
```

---

## 🧪 Testing After Fix

### Test Scenario 1: Two Mobile Devices
1. User A: Open APK on Device 1, start collaboration session
2. User B: Open APK on Device 2, accept invite
3. **Expected**: Both see each other in lobby
4. User A: Start session, draw on canvas
5. **Expected**: User B sees User A's drawing in real-time
6. User B: Draw something
7. **Expected**: User A sees User B's drawing

### Test Scenario 2: Mobile + Browser
1. User A: Open APK on mobile
2. User B: Open browser on laptop
3. Both join same collaboration session
4. **Expected**: They can see each other's actions

### Test Scenario 3: Check Console Logs
```javascript
// In Chrome DevTools (inspect mobile app)
console.log('WebSocket connected:', collaborationService.isConnected());
console.log('Participants:', participants);
```

---

## 📋 Quick Fix Checklist

### For DigitalOcean Production:
- [ ] Add Redis database to DigitalOcean app
- [ ] Get `REDIS_URL` from DigitalOcean environment
- [ ] Update `backend/storybookapi/settings.py` to use Redis
- [ ] Add `channels-redis>=4.0.0` to `requirements.txt`
- [ ] Deploy to DigitalOcean
- [ ] Test collaboration with two mobile devices

### Alternative (Quick but not recommended):
- [ ] Set DigitalOcean to single worker process
- [ ] Ensure `daphne` is used instead of `gunicorn`
- [ ] Test collaboration

---

## 🎯 Expected Behavior After Fix

**Before (Broken):**
```
User A (Mobile) → Process 1 → InMemory Channel Layer
User B (Mobile) → Process 2 → InMemory Channel Layer (different instance!)
❌ Messages don't cross processes
```

**After (Fixed with Redis):**
```
User A (Mobile) → Process 1 → Redis ←→ All Processes
User B (Mobile) → Process 2 → Redis ←→ All Processes
✅ All messages go through shared Redis
```

---

## 🔗 Related Files

### Backend:
- `backend/storybookapi/settings.py` - Channel layers configuration
- `backend/requirements.txt` - Add channels-redis
- `backend/storybookapi/asgi.py` - ASGI application

### Frontend:
- `frontend/src/services/collaborationService.ts` - WebSocket connection logic
- `frontend/.env.production` - Production environment variables
- `frontend/src/pages/ManualStoryCreationPage.tsx` - Collaboration UI

---

## 🆘 Still Not Working?

If collaboration still doesn't work after adding Redis:

1. **Check Redis is actually being used:**
   ```bash
   # In DigitalOcean console logs, look for:
   ✅ Using Redis for Channels (Production)
   ```

2. **Verify WebSocket connection:**
   - Use Chrome DevTools to inspect mobile app
   - Check Network tab for WebSocket connection
   - Look for `ws/collaborate/` connections
   - Check if connection shows "101 Switching Protocols"

3. **Check backend logs:**
   - Look for WebSocket connection messages
   - Check for Redis connection errors
   - Verify channels consumer is receiving messages

4. **Share the logs** with me and I can help debug further!

---

## Summary

**The main issue**: `InMemoryChannelLayer` doesn't work in multi-process environments like DigitalOcean.

**The solution**: Add Redis to share WebSocket messages across all processes.

**Quick test**: Use Chrome DevTools (`chrome://inspect`) to view mobile app logs and check for WebSocket errors.
