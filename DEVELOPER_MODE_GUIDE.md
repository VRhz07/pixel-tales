# 🔧 Developer Mode - Wireless Local Testing Guide

Test your Pixel Tales APK wirelessly with your local backend - no rebuilding when your IP changes!

## 🎯 What Is Developer Mode?

Developer Mode is a hidden feature in your app that lets you:
- ✅ Change the API URL without rebuilding the APK
- ✅ Test with your local backend over WiFi
- ✅ Switch between production and local testing instantly
- ✅ Test API connectivity before using it

---

## 🚀 Quick Start

### Step 1: Access Developer Mode

**BEFORE logging in (on Login/Auth page):**
1. Open the app on your phone
2. You'll see the Pixel Tales logo at the top
3. **Tap the logo 5 times quickly**
4. Developer Mode menu will appear! 🎉

**OR after logging in (in Settings page):**
1. Open the app on your phone
2. Go to **Settings** (bottom navigation)
3. Scroll to the bottom where you see the Pixel Tales logo
4. **Tap the logo 5 times quickly**
5. Developer Mode menu will appear! 🎉

💡 **Tip:** Access it from the login page to configure API URL BEFORE logging in!

### Step 2: Find Your Laptop's IP Address

**On Windows:**
```powershell
ipconfig
```
Look for **IPv4 Address** (e.g., `192.168.1.100`)

**On Mac/Linux:**
```bash
ifconfig | grep "inet "
```

### Step 3: Start Your Backend

```bash
cd backend
python manage.py runserver 0.0.0.0:8000
```

⚠️ **Important:** Use `0.0.0.0:8000` to allow connections from your network!

### Step 4: Configure the App

In the Developer Mode menu:

1. **Option A - Use Quick Preset:**
   - Tap "Custom URL"
   - Enter: `http://192.168.1.100:8000` (use your actual IP)
   - Tap "Test Connection" to verify
   - Tap "Save & Apply"

2. **Option B - Use Localhost via ADB:**
   - Connect phone via USB
   - Run: `adb reverse tcp:8000 tcp:8000`
   - Select "Localhost (ADB)" preset
   - Tap "Save & Apply"

### Step 5: Restart the App

Close and reopen the app for changes to take effect.

---

## 📋 Available Presets

### 🌐 Production Server
- **URL:** `https://pixeltales-backend.onrender.com/api`
- **Use when:** Testing against live backend
- **Requires:** Internet connection

### 🔌 Localhost (ADB)
- **URL:** `http://localhost:8000/api`
- **Use when:** USB connected with ADB port forwarding
- **Requires:** USB cable, ADB setup
- **Setup:** Run `test-local.bat` first

### 📱 Localhost (Emulator)
- **URL:** `http://10.0.2.2:8000/api`
- **Use when:** Testing on Android emulator
- **Requires:** Android emulator running

### ⚡ Custom URL
- **URL:** Your choice!
- **Use when:** Testing on WiFi with local backend
- **Example:** `http://192.168.1.100:8000`

---

## 🔄 Daily Workflow

### Wireless Testing (WiFi)

1. **Find your laptop's current IP** (it may change each day)
2. **Start backend:** `python manage.py runserver 0.0.0.0:8000`
3. **Open app** → Tap logo 5 times
4. **Update URL** to your current IP
5. **Test & Save**
6. **Restart app**

### USB Testing (ADB)

1. **Connect phone via USB**
2. **Run:** `test-local.bat`
3. **Start backend:** `python manage.py runserver`
4. **Open app** → Already configured for localhost!

---

## 🧪 Testing Features

### Test Connection Button

Before saving, always test your connection:

✅ **Success:** "Connected successfully (123ms)"
- Backend is reachable
- Safe to save and use

❌ **Failed:** "Connection timeout" or "Connection failed"
- Check if backend is running
- Verify IP address is correct
- Ensure phone and laptop are on same WiFi
- Check firewall settings

### Connection Status

The Developer Mode shows:
- **Current API URL:** What the app is currently using
- **Custom Badge:** Indicates you're using a custom URL
- **Latency:** Response time in milliseconds

---

## 🐛 Troubleshooting

### "Connection timeout"
- **Cause:** Backend not running or wrong IP
- **Fix:** 
  1. Check backend is running: `python manage.py runserver 0.0.0.0:8000`
  2. Verify IP address with `ipconfig`
  3. Test in browser: `http://192.168.1.100:8000/api`

### "No route to host"
- **Cause:** Phone and laptop on different networks
- **Fix:** Connect both to the same WiFi network

### "Connection refused"
- **Cause:** Backend not listening on `0.0.0.0`
- **Fix:** Use `python manage.py runserver 0.0.0.0:8000` not just `runserver`

### Can't access Developer Mode
- **Fix:** Make sure you're tapping the logo quickly (5 taps in 3 seconds)
- **Check:** You can access it from BOTH the login page AND settings page
- **Counter animation:** You should see a number appear on the logo when tapping

### App doesn't use new URL
- **Fix:** Close the app completely and reopen (don't just minimize)
- **Alternative:** Clear app cache in Android settings

### Firewall blocking connections
- **Windows:** Allow Python through Windows Firewall
- **Mac:** System Preferences → Security → Firewall → Allow Python
- **Quick test:** Temporarily disable firewall to confirm

---

## 💡 Pro Tips

### Tip 1: Save Common IPs
Keep a note of common IPs you use:
- Home WiFi: `192.168.1.100`
- Office WiFi: `10.0.0.45`
- Coffee shop: `172.16.0.10`

### Tip 2: Use USB When Possible
ADB port forwarding is more reliable than WiFi:
- No IP changes
- Faster connection
- More stable

### Tip 3: Test Before Saving
Always click "Test Connection" before saving to avoid issues.

### Tip 4: Reset to Production
If something goes wrong, just tap "Reset to Production" button.

### Tip 5: Check Backend Logs
Keep an eye on your backend terminal to see incoming requests:
```
[05/Jan/2025 16:30:21] "GET /api/stories/ HTTP/1.1" 200 1234
```

---

## 🔒 Security Notes

- ⚠️ **Developer Mode is for testing only**
- ⚠️ Don't share APKs with Developer Mode enabled
- ⚠️ Production builds should use hardcoded production URL
- ⚠️ Your local backend is accessible to anyone on your network

---

## 📊 Comparison: WiFi vs USB (ADB)

| Feature | WiFi Testing | USB (ADB) Testing |
|---------|-------------|-------------------|
| **Rebuild on IP change?** | No | No |
| **Requires USB cable?** | No | Yes |
| **Same network required?** | Yes | No |
| **Setup complexity** | Easy | Medium |
| **Connection speed** | WiFi speed | USB speed (faster) |
| **Mobility** | Walk around with phone | Tethered to laptop |
| **Reliability** | Can disconnect | Very stable |
| **Best for** | Testing UX/UI | Debugging API calls |

---

## 🎓 Advanced Usage

### Switching Between Multiple Backends

You can quickly switch between:
- Production (live data)
- Local development (your changes)
- Staging server (team testing)

Just use Developer Mode to change the URL!

### Testing Network Error Handling

1. Set URL to working backend
2. Test your feature
3. Stop backend to simulate network issues
4. See how app handles errors
5. Restart backend to continue testing

### Remote Team Testing

If your laptop has a public IP or you set up port forwarding:
```
Your public IP: 203.0.113.5
Team member enters: http://203.0.113.5:8000
```

⚠️ **Security risk!** Only for trusted team members on secure networks.

---

## 📱 How to Build APK with Developer Mode

Developer Mode is **already included** in your standard build!

Just build normally:
```bash
npm run build
npx cap sync android
cd android
gradlew assembleDebug
```

The APK will:
- Default to production URL
- Have Developer Mode hidden (tap logo 5 times)
- Remember your custom URL even after app restart

---

## 🆘 Need More Help?

1. Check if backend is accessible in browser: `http://YOUR_IP:8000/api`
2. Check firewall settings on your laptop
3. Try USB/ADB method instead (more reliable)
4. Reset to production and verify that works first

---

## ✅ Benefits Over Other Methods

### vs. Hardcoding IP in APK
- ✅ No rebuild when IP changes
- ✅ One APK for all testing scenarios
- ✅ Can switch back to production instantly

### vs. Always Using Production
- ✅ Test your changes before pushing
- ✅ Don't pollute production data
- ✅ Faster iteration (no deployment wait)

### vs. Running Frontend in Browser
- ✅ Test actual mobile experience
- ✅ Test Capacitor plugins (camera, etc.)
- ✅ Test on real device hardware

---

**Happy Testing!** 🚀

Remember: Tap the Pixel Tales logo 5 times (on login page or in Settings) to access Developer Mode anytime!

---

## 🔑 Key Points to Remember

1. ✅ **Access from login page** - Configure API BEFORE logging in
2. ✅ **Access from settings** - Change API while logged in  
3. ✅ **Tap logo 5 times** - Works on both pages
4. ✅ **Test connection first** - Always verify before saving
5. ✅ **Restart app** - Close completely and reopen for changes to apply
