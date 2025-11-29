# 📱 Ensuring APK Connects to Backend Server

## Overview

For your APK to connect to the deployed backend, you need to:
1. ✅ Update frontend `.env` with production API URL
2. ✅ Build frontend with production settings
3. ✅ Sync to Capacitor
4. ✅ Build APK
5. ✅ Test connection

---

## Step-by-Step Connection Setup

### Step 1: Get Your Backend URL (After Successful Build)

Once Render deployment succeeds, you'll see:
```
✅ Live at: https://your-app-name.onrender.com
```

**Example:**
```
https://pixeltales-backend.onrender.com
```

**Save this URL!** You'll need it.

---

### Step 2: Update Frontend Environment Variables

Edit `frontend/.env`:

**BEFORE (localhost - won't work on phone):**
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

**AFTER (production - works on phone):**
```env
VITE_API_BASE_URL=https://your-app-name.onrender.com/api
```

**Complete Example:**
```env
# Backend API URL (CHANGE THIS!)
VITE_API_BASE_URL=https://pixeltales-backend.onrender.com/api

# Other settings (keep these)
VITE_GEMINI_API_KEY=your-gemini-api-key-here
VITE_OCR_SPACE_API_KEY=your-ocr-api-key-here

# ⚠️ WARNING: These frontend keys are NO LONGER USED!
# API keys are now securely stored on the backend.
# See SECURITY_SETUP.md for details.
VITE_APP_NAME=Pixel Tales
VITE_APP_VERSION=1.0.0
```

**⚠️ Important:**
- Must use `https://` (not `http://`)
- Must end with `/api` (with the slash)
- No trailing slash after `/api`

---

### Step 3: Test API Connection in Browser First

Before building APK, test if the API works:

**Open your browser and visit:**
```
https://your-app-name.onrender.com/api/
```

You should see:
```json
{
  "message": "API is working",
  "status": "ok"
}
```

**If you see this, your backend is working!** ✅

---

### Step 4: Test Frontend Locally with Production Backend

```bash
cd frontend
npm run dev
```

Open http://localhost:3100 and:
- ✅ Try to register a new account
- ✅ Try to login
- ✅ Try to create a story

**If these work, your frontend can connect to production backend!** ✅

---

### Step 5: Build Frontend for Production

```bash
cd frontend
npm run build
```

This creates `frontend/dist` folder with your production app.

**Verify the build:**
- Check `frontend/dist` folder exists
- Should contain `index.html` and assets

---

### Step 6: Sync to Capacitor

```bash
# From project root (not frontend folder)
cd ..
npx cap sync android
```

This copies your built frontend (with production API URL) to Android project.

**What this does:**
- Copies `frontend/dist` → `android/app/src/main/assets/public`
- Updates Capacitor plugins
- Prepares Android project for build

---

### Step 7: Build APK

```bash
# Option A: Android Studio
npx cap open android
# Then: Build → Build Bundle(s) / APK(s) → Build APK(s)

# Option B: Command line
cd android
./gradlew assembleDebug
```

APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

---

### Step 8: Test APK Connection

#### Test 1: Install on Phone
```bash
# Via USB
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Or copy APK to phone and install manually
```

#### Test 2: Check Connection
1. Open app on phone
2. Make sure phone has internet (WiFi or mobile data)
3. Try to register/login
4. Check if it works!

#### Test 3: Check Logs (If Issues)
```bash
# Connect phone via USB
adb logcat | grep -i "http\|api\|error"
```

Look for:
- ✅ API requests going to correct URL
- ❌ Connection errors
- ❌ 404 or 500 errors

---

## 🔍 Verification Checklist

Before building APK:

- [ ] Backend deployed successfully on Render
- [ ] Backend URL is accessible in browser
- [ ] `frontend/.env` updated with production URL
- [ ] URL format: `https://your-app.onrender.com/api`
- [ ] Tested frontend locally with production backend
- [ ] Frontend build completed (`npm run build`)
- [ ] Capacitor sync completed (`npx cap sync android`)

After building APK:

- [ ] APK installed on phone
- [ ] Phone has internet connection
- [ ] App can register/login
- [ ] App can create/view stories
- [ ] Images load properly
- [ ] No connection errors

---

## 🆘 Troubleshooting Connection Issues

### Issue 1: "Network Error" or "Cannot Connect"

**Causes:**
- Wrong API URL in `.env`
- Missing `https://`
- Backend is not running
- Phone has no internet

**Solutions:**
1. Check `frontend/.env` has correct URL
2. Verify backend is "Live" in Render dashboard
3. Test backend URL in phone browser first
4. Check phone internet connection
5. Rebuild app after fixing `.env`

---

### Issue 2: "404 Not Found"

**Causes:**
- Wrong endpoint URL
- Missing `/api` in URL
- Backend route not configured

**Solutions:**
1. Make sure URL ends with `/api`
2. Test in browser: `https://your-app.onrender.com/api/`
3. Check backend ALLOWED_HOSTS includes your domain
4. Check backend logs in Render

---

### Issue 3: "CORS Error"

**Causes:**
- Backend CORS not configured
- Wrong ALLOWED_HOSTS setting

**Solutions:**
1. Check backend environment variable `RENDER=True`
2. Check `ALLOWED_HOSTS` includes your domain
3. Backend settings.py has `CORS_ALLOW_ALL_ORIGINS = True` when RENDER=True
4. Restart backend service in Render

---

### Issue 4: "SSL Certificate Error"

**Causes:**
- Using `http://` instead of `https://`
- Old Android version

**Solutions:**
1. Always use `https://` for production
2. Never use `http://` on Render URLs
3. Update `.env` and rebuild

---

### Issue 5: App Works on WiFi but Not Mobile Data

**Causes:**
- Mobile data restricted for app
- Firewall blocking

**Solutions:**
1. Check phone settings → App permissions → Network
2. Allow mobile data for app
3. Disable VPN if active
4. Try different network

---

## 🧪 Testing Script

Use this to verify connection:

**On Phone Browser (before installing APK):**
1. Open Chrome/Browser on phone
2. Visit: `https://your-app-name.onrender.com/api/`
3. Should see JSON response
4. If this works, APK will work too!

**On Computer (test API endpoints):**
```bash
# Test API root
curl https://your-app-name.onrender.com/api/

# Test registration
curl https://your-app-name.onrender.com/api/auth/register/ \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"Test123!","account_type":"child"}'

# Should return success with token
```

---

## 📋 Quick Reference: Build Process

```bash
# 1. Update .env
# Edit frontend/.env with production URL

# 2. Build frontend
cd frontend
npm run build

# 3. Sync to Android
cd ..
npx cap sync android

# 4. Build APK
npx cap open android
# Android Studio → Build → Build APK

# 5. Install and test
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 🎯 Expected Behavior

**Development (localhost):**
```
Frontend: http://localhost:3100
Backend:  http://localhost:8000
APK:      ❌ Cannot connect (localhost not accessible on phone)
```

**Production (Render):**
```
Frontend: Built into APK
Backend:  https://your-app.onrender.com
APK:      ✅ Connects via internet
```

---

## 💡 Pro Tips

1. **Always test backend URL in browser first**
   - If browser can't access it, APK can't either

2. **Test frontend locally with production backend**
   - Catches connection issues before building APK

3. **Check logs on phone**
   - `adb logcat` shows exact errors

4. **Rebuild after changing .env**
   - Changes don't apply until you rebuild

5. **Keep .env.example updated**
   - Document the correct format for others

---

## 📱 Production Checklist

Before distributing APK:

- [ ] Backend is deployed and running
- [ ] Backend URL is using HTTPS
- [ ] Frontend .env has production URL
- [ ] Tested on multiple devices
- [ ] Tested on WiFi and mobile data
- [ ] All features work (auth, stories, images)
- [ ] No console errors in logs
- [ ] App doesn't crash on startup

---

## 🎉 Success Indicators

Your APK is correctly connected when:

✅ App opens without errors
✅ Can register new users
✅ Can login with credentials
✅ Can create and save stories
✅ Can upload and view images
✅ Can see other users' content
✅ Works on both WiFi and mobile data
✅ No "connection failed" errors

---

**Your Connection Flow:**

```
Phone (APK) 
    ↓
    Internet (WiFi/Mobile Data)
    ↓
    Render.com (Your Backend)
    ↓
    SQLite Database
    ↓
    Response back to Phone
```

All requests go through the internet to your Render backend!
