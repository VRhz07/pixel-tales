# 🔧 Troubleshooting Local Backend Connection

Having trouble connecting your phone to your local backend? Let's fix it step by step!

---

## 📋 Quick Diagnostic Checklist

Run this diagnostic script first:
```bash
test-backend-connection.bat
```

This will automatically check:
- ✅ Your laptop's IP address
- ✅ If backend is running
- ✅ If backend is accessible from network
- ✅ Firewall configuration

---

## 🔍 Common Issues & Solutions

### Issue 1: Backend Not Running with Correct Host ❌

**Problem:** Backend running on `127.0.0.1` instead of `0.0.0.0`

**How to Check:**
```bash
# Wrong (only localhost access):
python manage.py runserver

# Correct (network access):
python manage.py runserver 0.0.0.0:8000
```

**Fix:**
Always use `0.0.0.0:8000` when running the backend!

---

### Issue 2: Wrong URL Format in Developer Mode ❌

**Common Mistakes:**

```
❌ 192.168.1.100:8000          (missing http://)
❌ http://192.168.1.100        (missing port)
❌ http://192.168.1.100:8000/api  (don't add /api, app does it automatically)
❌ https://192.168.1.100:8000  (use http not https for local)
```

**Correct Format:**
```
✅ http://192.168.1.100:8000
```

The app automatically adds `/api` at the end!

---

### Issue 3: Firewall Blocking Port 8000 🔥

**Windows Firewall Fix:**

1. **Quick test - Temporarily disable firewall:**
   - Windows Security → Firewall → Turn off (just to test)
   - Try connecting from phone
   - If it works, firewall is the issue

2. **Permanent fix - Add firewall rule:**
   ```bash
   # Run as Administrator:
   netsh advfirewall firewall add rule name="Django Dev Server" dir=in action=allow protocol=TCP localport=8000
   ```

3. **Or use GUI:**
   - Windows Defender Firewall → Advanced Settings
   - Inbound Rules → New Rule
   - Port → TCP → 8000 → Allow
   - Name: "Django Dev Server"

---

### Issue 4: Phone and Laptop on Different Networks 📶

**Check:**
- Both on same WiFi network?
- Not using WiFi and mobile data separately?
- Not on guest network with AP isolation?

**Test:**
From your phone's browser, visit: `http://YOUR_IP:8000/admin/health/`

If it doesn't load, they're not on the same network!

---

### Issue 5: Wrong IP Address 🔢

**Get your CORRECT IP:**

**Windows:**
```bash
ipconfig
```
Look for **IPv4 Address** under your active WiFi adapter

**Common mistakes:**
- Using VPN IP instead of local WiFi IP
- Using Ethernet IP when on WiFi
- Using old IP (IP addresses can change!)

**Your IP should look like:**
- `192.168.x.x` (most home networks)
- `10.0.x.x` (some networks)
- `172.16.x.x` to `172.31.x.x` (corporate networks)

---

### Issue 6: App Not Restarting Properly 📱

**After changing API URL, you MUST:**

1. **Close app completely** (swipe away from recent apps)
2. **Wait 2 seconds**
3. **Reopen app**

Just pressing home button is NOT enough!

---

### Issue 7: Backend ALLOWED_HOSTS Issue ⚙️

**Check your `backend/.env`:**
```env
ALLOWED_HOSTS=localhost,127.0.0.1,*
```

The `*` allows all IPs. This should already be set!

**Verify it's working:**
```bash
cd backend
python manage.py runserver 0.0.0.0:8000
```

You should see:
```
Starting development server at http://0.0.0.0:8000/
```

NOT:
```
Starting development server at http://127.0.0.1:8000/
```

---

### Issue 8: CORS Errors (Check Browser Console) 🌐

**Your backend already has:**
```python
if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
```

So CORS should work! But verify:

**Check backend/.env has:**
```env
DEBUG=True
```

**Restart backend after any .env changes!**

---

### Issue 9: Port Already in Use 🚪

**Check if something else is using port 8000:**

```bash
# Windows:
netstat -ano | findstr :8000

# If something is found, kill it:
taskkill /PID <PID_NUMBER> /F
```

---

### Issue 10: Cache/Old URL Still Being Used 💾

**The app caches the API URL. To clear:**

1. **Method A - Use Reset button:**
   - Open Developer Mode
   - Click "Reset to Production"
   - Enter your local URL again
   - Save & restart

2. **Method B - Clear app data:**
   - Android Settings → Apps → Pixel Tales
   - Storage → Clear Data
   - Reopen app, configure Developer Mode again

---

## 🧪 Step-by-Step Test Procedure

Follow these steps IN ORDER:

### Step 1: Start Backend Correctly
```bash
cd backend
python manage.py runserver 0.0.0.0:8000
```

**Verify:** You see `Starting development server at http://0.0.0.0:8000/`

---

### Step 2: Get Your IP Address
```bash
ipconfig
```

**Copy the IPv4 Address** (e.g., `192.168.1.100`)

---

### Step 3: Test from Your Laptop Browser

Open: `http://YOUR_IP:8000/admin/health/`

**Should see:** Some response (even an error page is fine - it means server is reachable)

**If timeout:** Backend not accessible on network - check firewall!

---

### Step 4: Test from Phone Browser

**On your phone's browser**, visit: `http://YOUR_IP:8000/admin/health/`

**Should see:** Same response as laptop

**If timeout:** 
- Check both devices on same WiFi
- Check firewall settings
- Try disabling firewall temporarily

---

### Step 5: Configure Developer Mode

1. Open Pixel Tales app
2. Tap logo 5 times on login page
3. Enter: `http://YOUR_IP:8000` (exact format!)
4. Click "Test Connection"
5. **Should see:** "Connected successfully"

**If not:**
- Recheck URL format (no typos!)
- Verify backend still running
- Try from phone browser again first

---

### Step 6: Save and Restart

1. Click "Save & Apply"
2. **Completely close app** (swipe away from recents)
3. Wait 2-3 seconds
4. Reopen app
5. Try to login!

---

## 🎯 Quick Fixes Summary

**If you can't connect, try these in order:**

1. ✅ **Restart backend with:** `python manage.py runserver 0.0.0.0:8000`
2. ✅ **Run diagnostic script:** `test-backend-connection.bat`
3. ✅ **Check URL format:** `http://192.168.1.100:8000` (use YOUR IP)
4. ✅ **Test in phone browser first:** `http://YOUR_IP:8000/admin/health/`
5. ✅ **Disable firewall temporarily** to test
6. ✅ **Verify same WiFi network**
7. ✅ **Completely restart the app** after saving

---

## 📱 What Should You See?

### In Developer Mode Test:
```
✅ Connected successfully (123ms)
```

### In Backend Terminal (when app connects):
```
[05/Jan/2025 16:30:21] "GET /api/auth/verify/ HTTP/1.1" 200 1234
[05/Jan/2025 16:30:22] "POST /api/auth/login/ HTTP/1.1" 200 567
```

---

## 🆘 Still Not Working?

**Provide these details for further help:**

1. **Backend startup message:**
   ```
   Starting development server at http://???/
   ```

2. **Your IP address:**
   ```
   IPv4 Address: ???
   ```

3. **Phone browser test:**
   - Did `http://YOUR_IP:8000/admin/health/` work? Yes/No

4. **Developer Mode test result:**
   - What message did you see?

5. **Backend terminal output:**
   - Any errors or requests showing up?

6. **Firewall status:**
   - Enabled/Disabled/Rule created?

---

## 💡 Pro Tips

1. **Keep backend terminal visible** - You'll see incoming requests in real-time
2. **Use phone browser to test first** - Faster than testing in app
3. **IP addresses can change** - Recheck with `ipconfig` if it stops working
4. **Some routers have AP isolation** - Prevents devices from talking to each other
5. **Corporate/School WiFi** - May block device-to-device communication

---

## ✅ Success Indicators

You'll know it's working when:

- ✅ Developer Mode shows "Connected successfully"
- ✅ Backend terminal shows incoming API requests
- ✅ Login page accepts credentials
- ✅ You can see your stories/data

---

**Good luck! Run the diagnostic script and let me know what it finds!** 🚀
