# 📱 Mobile Development Mode Guide

## How to Test Your APK with Laptop Backend

This guide shows you how to build an APK and connect it to your laptop's backend for development testing.

---

## 🎯 Quick Start

### Step 1: Start Backend for Mobile Access
Run this script to start your backend:
```bash
start-backend-for-mobile.bat
```

This will:
- ✅ Find your laptop's IP address
- ✅ Start backend on `0.0.0.0:8000` (accessible from network)
- ✅ Show you the IP to use in your mobile app

### Step 2: Build APK
Build your APK normally:
```bash
build-mobile.bat
```

### Step 3: Connect APK to Laptop
1. **Install APK** on your phone
2. **Open the app**
3. **Tap the logo 5 times** (activates developer mode)
4. **Select "Custom URL"** preset
5. **Enter your laptop's IP**: `http://192.168.x.x:8000` (shown in terminal)
6. **Click "Test Connection"** - should show "Connected successfully"
7. **Click "Save & Apply"**
8. **Restart the app**

---

## 📋 Detailed Instructions

### Prerequisites
- ✅ Phone and laptop on **same WiFi network**
- ✅ Backend running with `start-backend-for-mobile.bat`
- ✅ APK installed on phone

### Finding Your Laptop's IP

**Windows:**
```bash
ipconfig
# Look for "IPv4 Address" under your WiFi adapter
# Example: 192.168.1.100, 192.168.56.1, etc.
```

**Mac/Linux:**
```bash
ifconfig  # or ip addr
# Look for "inet" address
```

### Backend Configuration

The backend is already configured to accept connections from any device (see `backend/storybookapi/settings.py`):
```python
if DEBUG:
    ALLOWED_HOSTS = ['*']  # ✅ Already configured
    CORS_ALLOW_ALL_ORIGINS = True  # ✅ Already configured
```

---

## 🔧 Using Developer Mode in APK

### Activating Developer Mode
1. Open your app
2. Tap the **Pixel Tales logo** in the settings/home page **5 times**
3. Developer Mode modal appears

### Available Presets
| Preset | URL | Use Case |
|--------|-----|----------|
| **Production Server** | `https://pixel-tales-yu7cx.ondigitalocean.app/api` | Live production |
| **Localhost (ADB)** | `http://localhost:8000/api` | USB debugging (requires ADB setup) |
| **Localhost (Emulator)** | `http://10.0.2.2:8000/api` | Android emulator only |
| **Custom URL** | _Your IP_ | WiFi connection to laptop |

### Connecting to Your Laptop

1. **Select "Custom URL"** preset
2. **Enter:** `http://YOUR_LAPTOP_IP:8000`
   - Example: `http://192.168.1.100:8000`
   - Example: `http://192.168.56.1:8000`
   - **Note:** Don't add `/api` - it's added automatically
3. **Click "Test Connection"**
   - ✅ Success: "Connected successfully (XXms)"
   - ❌ Failure: Check troubleshooting below
4. **Click "Save & Apply"**
5. **Restart the app** for changes to take effect

---

## 🐛 Troubleshooting

### "Cannot reach server" Error

**Problem:** APK can't connect to laptop backend

**Solutions:**

1. **Check Same WiFi Network**
   ```
   ✅ Phone WiFi: MyNetwork-5G
   ✅ Laptop WiFi: MyNetwork-5G
   ❌ Phone WiFi: MyNetwork-5G
   ❌ Laptop WiFi: Ethernet/Different network
   ```

2. **Check Backend is Running**
   ```bash
   # Backend should be running with:
   python manage.py runserver 0.0.0.0:8000
   
   # NOT just:
   python manage.py runserver  # ❌ This only works for localhost
   ```

3. **Test Backend from Phone Browser**
   - Open Chrome on your phone
   - Go to: `http://YOUR_LAPTOP_IP:8000/api/`
   - You should see Django REST framework page
   - If this doesn't work, the APK won't work either

4. **Check Windows Firewall**
   ```bash
   # Option 1: Temporarily disable firewall
   Control Panel → Windows Firewall → Turn off (testing only!)
   
   # Option 2: Add firewall rule
   Windows Firewall → Advanced Settings → Inbound Rules
   → New Rule → Port → TCP 8000 → Allow
   ```

5. **Check IP Address is Correct**
   ```bash
   # Run this to verify:
   ipconfig
   
   # Common IP ranges:
   192.168.1.x   (home routers)
   192.168.0.x   (some routers)
   192.168.56.x  (virtual networks)
   10.0.0.x      (some networks)
   ```

### "Connection Timeout" Error

**Cause:** Firewall blocking port 8000

**Fix:**
1. Check Windows Firewall settings
2. Try disabling firewall temporarily for testing
3. Add exception for port 8000

### "Server Error (500)" Response

**Cause:** Backend has an error, but connection works!

**Fix:**
1. Check backend terminal for error messages
2. This usually means connection is working
3. Fix the backend error shown in terminal

---

## 🔌 Alternative: USB Connection (ADB)

If WiFi doesn't work, use USB debugging:

### Setup
1. **Enable USB Debugging** on phone (Developer Options)
2. **Connect phone via USB**
3. **Run:** `setup-usb-testing.bat`
4. **In Developer Mode:** Select "Localhost (ADB)" preset
5. **Save & Restart**

### How It Works
ADB creates a tunnel:
```
Phone localhost:8000 → USB → Laptop localhost:8000
```

This works even without WiFi! 🎉

---

## 📝 Development Workflow

### Typical Dev Session

1. **Start backend for mobile:**
   ```bash
   start-backend-for-mobile.bat
   ```

2. **Note the IP shown** (e.g., `192.168.56.1`)

3. **Make code changes** in your IDE

4. **Build APK** (if needed):
   ```bash
   build-mobile.bat
   ```

5. **Install on phone** (if new build)

6. **In app:** Developer Mode → Custom URL → Your IP

7. **Test features** - changes reflect immediately (no rebuild needed for backend changes!)

### Quick Tips

- **Backend changes:** Just save file, no rebuild needed ✅
- **Frontend changes:** Need to rebuild APK ❌
- **Database changes:** Run migrations on laptop
- **API changes:** Restart backend server

---

## 🌐 Network Requirements

### What You Need
- ✅ Phone and laptop on **same WiFi**
- ✅ WiFi router that **allows device-to-device communication**
- ✅ Firewall allows **port 8000**

### What Can Go Wrong
- ❌ Corporate/School WiFi (usually blocks device-to-device)
- ❌ Public WiFi (blocks device-to-device)
- ❌ Guest WiFi networks (isolated)
- ❌ VPN active on laptop (changes routing)

### If WiFi Doesn't Work
- ✅ Use USB/ADB method (always works!)
- ✅ Use Android Emulator on laptop
- ✅ Test on DigitalOcean production

---

## 🔄 Switching Back to Production

When done testing:

1. **Open Developer Mode** (tap logo 5x)
2. **Select "Production Server"** preset
3. **Save & Restart**

Or:

1. **Click "Reset to Production"** button
2. **Restart app**

---

## 📊 Checking Connection Status

### In Developer Mode Modal
- ✅ **Green checkmark:** Connected successfully
- ❌ **Red X:** Connection failed
- ⏳ **Loading:** Testing connection

### Current URL Display
Shows active API endpoint at top of modal

### Custom Badge
Appears when using custom URL (not production)

---

## 🎯 Common Use Cases

### Use Case 1: Quick Feature Testing
```
Goal: Test new feature without deploying
Steps:
1. start-backend-for-mobile.bat
2. Build APK once
3. Connect to laptop IP
4. Test feature
5. Make changes on laptop
6. Test again (no rebuild!)
```

### Use Case 2: Database Testing
```
Goal: Test with local database
Steps:
1. Create test data on laptop backend
2. Connect APK to laptop
3. Test app with real data
4. No need to populate DigitalOcean DB
```

### Use Case 3: Offline Development
```
Goal: Work without internet
Steps:
1. Start local backend
2. Connect APK via WiFi/USB
3. Develop completely offline
4. Deploy to DigitalOcean later
```

---

## ✅ Checklist

Before starting mobile development:

- [ ] Backend running with `start-backend-for-mobile.bat`
- [ ] Phone and laptop on same WiFi
- [ ] Laptop IP address noted (shown in terminal)
- [ ] APK built and installed
- [ ] Developer mode activated (tap logo 5x)
- [ ] Custom URL entered and tested
- [ ] Connection successful
- [ ] Firewall not blocking (if needed)

---

## 🆘 Still Having Issues?

### Quick Diagnostic

1. **Can you ping laptop from phone?**
   - Use "Ping" app on phone
   - Ping your laptop IP
   - Should get response

2. **Can phone browser access backend?**
   - Open Chrome on phone
   - Visit: `http://YOUR_IP:8000/api/`
   - Should see Django page

3. **Is backend actually listening on 0.0.0.0?**
   ```bash
   # Check terminal output:
   Starting development server at http://0.0.0.0:8000/  ✅ Correct
   Starting development server at http://127.0.0.1:8000/  ❌ Wrong
   ```

If all above work but APK doesn't:
- Try clearing app data
- Reinstall APK
- Check Developer Mode saved correctly

---

## 📚 Related Files

- **Backend Start Script:** `start-backend-for-mobile.bat`
- **APK Build Script:** `build-mobile.bat`
- **USB Setup:** `setup-usb-testing.bat`
- **Developer Mode UI:** `frontend/src/components/settings/DeveloperModeModal.tsx`
- **API Config Service:** `frontend/src/services/apiConfig.service.ts`

---

## 🎉 Success!

Once connected, you'll see:
- ✅ "Connected successfully (XXms)" message
- ✅ Green checkmark in test result
- ✅ Custom URL saved
- ✅ App works with your local backend

**Happy mobile development! 📱🚀**
