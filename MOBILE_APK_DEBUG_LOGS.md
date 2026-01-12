# Mobile APK Debug Logs Guide

## Problem
Collaboration works on localhost (browser-to-browser) but NOT on mobile APK with DigitalOcean backend. Users' actions are not visible to each other.

## Possible Causes
1. **WebSocket connection failing** on mobile (CORS, SSL, or network issues)
2. **DigitalOcean WebSocket configuration** not allowing mobile connections
3. **Android network security** blocking WebSocket connections
4. **Session/authentication issues** on mobile

---

## Method 1: Chrome DevTools (Recommended - Easiest)

### Requirements
- USB cable
- Android device with USB debugging enabled
- Chrome browser on your computer

### Steps

1. **Enable USB Debugging on Android**:
   ```
   Settings → About Phone → Tap "Build Number" 7 times
   Settings → Developer Options → Enable "USB Debugging"
   ```

2. **Connect device via USB** to your computer

3. **Open Chrome on your computer** and go to:
   ```
   chrome://inspect/#devices
   ```

4. **Find your app** in the list of inspectable pages

5. **Click "Inspect"** to open DevTools

6. **Check Console tab** for:
   - WebSocket connection errors
   - Collaboration service logs
   - Presence update messages
   - Participant sync logs

### What to Look For:
```javascript
// Good signs:
"🔗 Connected to collaboration session"
"✅ Force-fetched participants: 2"
"📡 Sending presence update"

// Bad signs:
"❌ WebSocket connection failed"
"WebSocket is not connected"
"Failed to force-fetch participants"
"CORS error"
```

---

## Method 2: Android Logcat (More Detailed)

### Using Android Studio

1. **Connect device via USB**

2. **Open Android Studio** → Bottom toolbar → **Logcat**

3. **Filter by package**:
   ```
   package:com.pixeltales.app
   ```

4. **Look for**:
   - JavaScript console logs
   - Network errors
   - WebSocket connection issues
   - Capacitor plugin errors

### Using Command Line (ADB)

```bash
# Install ADB (if not already installed)
# Windows: Download Android Platform Tools

# Connect device and verify
adb devices

# View all logs
adb logcat

# Filter for your app
adb logcat | grep -i "pixeltales"

# Filter for WebSocket errors
adb logcat | grep -i "websocket"

# Filter for collaboration logs
adb logcat | grep -i "collaboration"

# Save logs to file
adb logcat > apk_logs.txt
```

---

## Method 3: Add Remote Logging to Your App

If Chrome DevTools doesn't work, add remote logging to send logs to a server.

### Add to `frontend/src/services/collaborationService.ts`:

```typescript
// Send critical logs to backend for debugging
const remoteLog = (message: string, data?: any) => {
  if (import.meta.env.VITE_ENABLE_REMOTE_LOGGING === 'true') {
    fetch(`${import.meta.env.VITE_API_URL}/api/debug-log/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, data, timestamp: new Date().toISOString() })
    }).catch(() => {}); // Silent fail
  }
  console.log(message, data);
};

// Use in critical places:
remoteLog('🔗 Attempting WebSocket connection', { sessionId, url: wsUrl });
remoteLog('📡 Sending presence update', presenceData);
```

---

## Common Issues on Mobile + DigitalOcean

### Issue 1: WebSocket URL Incorrect

**Check your `.env.mobile` or `.env.production`**:
```env
# ❌ Wrong (HTTP instead of WS)
VITE_API_URL=https://your-app.ondigitalocean.app

# ✅ Correct WebSocket URL
VITE_WS_URL=wss://your-app.ondigitalocean.app/ws/collaboration/
```

### Issue 2: CORS/WebSocket Not Configured on DigitalOcean

**Check `backend/storybookapi/settings.py`**:
```python
# Ensure WebSocket origins are allowed
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [os.environ.get('REDIS_URL', 'redis://localhost:6379')],
        },
    },
}

# Allow mobile app origin
CORS_ALLOWED_ORIGINS = [
    "https://your-app.ondigitalocean.app",
    "capacitor://localhost",  # For mobile
    "http://localhost",       # For mobile
]

# Important for WebSocket
CORS_ALLOW_CREDENTIALS = True
```

### Issue 3: Android Network Security

**Check `android/app/src/main/res/xml/network_security_config.xml`**:
```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <!-- Allow clear text traffic for development -->
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">10.0.2.2</domain>
    </domain-config>
    
    <!-- Production domains must use HTTPS/WSS -->
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">your-app.ondigitalocean.app</domain>
    </domain-config>
</network-security-config>
```

### Issue 4: Authentication Token Not Being Sent

Mobile apps might not send auth tokens properly via WebSocket.

**Check in `frontend/src/services/collaborationService.ts`**:
```typescript
connect(sessionId: string): Promise<void> {
  const token = localStorage.getItem('access_token');
  const wsUrl = `${WS_BASE_URL}/collaboration/${sessionId}/?token=${token}`;
  
  console.log('🔗 Connecting with token:', token ? 'Present' : 'Missing');
  // ...
}
```

---

## Quick Debug Checklist

Run this in Chrome DevTools Console (when inspecting mobile app):

```javascript
// 1. Check WebSocket URL
console.log('API URL:', import.meta.env.VITE_API_URL);
console.log('WS URL:', import.meta.env.VITE_WS_URL);

// 2. Check authentication
console.log('Auth token:', localStorage.getItem('access_token') ? 'Present' : 'Missing');

// 3. Check WebSocket connection
console.log('WebSocket connected:', collaborationService?.isConnected?.());

// 4. Check session
console.log('Session ID:', collaborationService?.getSessionId?.());

// 5. Check participants
console.log('Participants:', participants);

// 6. Force test WebSocket
const ws = new WebSocket('wss://your-app.ondigitalocean.app/ws/collaboration/TEST/');
ws.onopen = () => console.log('✅ WebSocket can connect');
ws.onerror = (err) => console.error('❌ WebSocket error:', err);
```

---

## Expected Behavior

### Working Collaboration (Localhost):
```
🔗 Connected to collaboration session
✅ Force-fetched participants: 2
📡 Sending presence update
👥 Setting participants: 2
🎨 Received canvas update from other user
```

### Broken Collaboration (Mobile):
```
❌ WebSocket connection failed
Failed to force-fetch participants
WebSocket is not connected
CORS policy error
```

---

## Next Steps

1. **Use Method 1 (Chrome DevTools)** - Start here, easiest
2. **Check the console logs** for WebSocket errors
3. **Verify WebSocket URL** is correct in environment files
4. **Check DigitalOcean backend** WebSocket configuration
5. **Share the error logs** so I can help identify the exact issue

---

## Need Help?

Once you get the logs, look for:
- ❌ Red error messages about WebSocket
- ⚠️ Warning messages about CORS
- 🔗 Connection status messages
- 📡 Presence update messages (or lack thereof)

Share the logs and I can help identify the exact problem!
