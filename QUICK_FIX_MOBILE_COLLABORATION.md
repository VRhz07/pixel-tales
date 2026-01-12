# Quick Fix: Mobile Collaboration Not Working

## 🚨 The Problem
Mobile APK collaboration doesn't work with DigitalOcean backend because `InMemoryChannelLayer` only works for single-process servers. DigitalOcean uses multiple processes, so users connect to different processes and can't see each other.

## ✅ The Solution: Add Redis

### Step 1: Add Redis to DigitalOcean
1. Open your DigitalOcean App dashboard
2. Click "Create" → "Database" 
3. Select "Redis"
4. Note the `REDIS_URL` environment variable

### Step 2: Update Backend Code

**File: `backend/storybookapi/settings.py`**

Replace lines 309-318 with:

```python
# Channels Configuration
import os

REDIS_URL = os.getenv('REDIS_URL')

if REDIS_URL and not DEBUG:
    # Production: Use Redis for multi-process WebSocket support
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels_redis.core.RedisChannelLayer',
            'CONFIG': {
                "hosts": [REDIS_URL],
                "capacity": 300,
                "expiry": 60,
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
    print("⚠️ Using InMemory Channels (Development only)")
```

### Step 3: Add Redis Dependency

**File: `backend/requirements.txt`**

Add this line:
```
channels-redis>=4.0.0
```

### Step 4: Deploy
```bash
cd backend
git add requirements.txt storybookapi/settings.py
git commit -m "Fix mobile collaboration with Redis"
git push origin main
```

## 📱 How to Debug (View APK Logs)

### Quick Method: Chrome DevTools
1. Enable USB Debugging on Android:
   - Settings → About Phone → Tap "Build Number" 7 times
   - Settings → Developer Options → Enable "USB Debugging"

2. Connect phone via USB

3. Open Chrome → `chrome://inspect/#devices`

4. Click "Inspect" on your app

5. Check Console for errors:
   ```
   ❌ WebSocket connection failed
   ❌ Failed to force-fetch participants
   ```

## 🧪 Test After Fix
1. Open APK on two devices
2. Start collaboration
3. Draw on one device
4. **Should see drawing on other device instantly**

## 📄 Full Details
See `MOBILE_COLLABORATION_DIAGNOSIS.md` for complete technical analysis.
