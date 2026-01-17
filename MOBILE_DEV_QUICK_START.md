# 📱 Mobile Development - Quick Start

## 🚀 3-Step Setup

### Step 1: Start Backend for Mobile
```bash
start-backend-for-mobile.bat
```
**Note the IP address shown** (e.g., `192.168.56.1`)

### Step 2: Build & Install APK
```bash
build-mobile.bat
```
Install the APK on your phone

### Step 3: Connect APK to Laptop
1. Open app on phone
2. **Tap logo 5 times** → Developer Mode opens
3. Select **"Custom URL"**
4. Enter: `http://YOUR_LAPTOP_IP:8000` (from Step 1)
5. Click **"Test Connection"** → Should show ✅ Connected
6. Click **"Save & Apply"**
7. **Restart app**

---

## ✅ You're Done!

Your APK is now connected to your laptop's backend.

### Benefits
- ✅ Test features without deploying to DigitalOcean
- ✅ Make backend changes and test instantly
- ✅ Work offline (no internet needed)
- ✅ Use local database for testing

---

## 🔄 Daily Workflow

### Every Time You Start Developing:
1. `start-backend-for-mobile.bat`
2. Note the IP (might change if on different WiFi)
3. If IP changed: Update in app's Developer Mode

### Making Changes:
- **Backend changes**: Just save → Test (no rebuild!)
- **Frontend changes**: Rebuild APK → Reinstall

---

## 🐛 Quick Troubleshooting

### Can't Connect?
1. Phone and laptop on **same WiFi**?
2. Backend running with `0.0.0.0:8000`?
3. Try in phone browser: `http://YOUR_IP:8000/api/`
4. Windows Firewall blocking? Turn off temporarily

### Connection Timeout?
- Check Windows Firewall settings
- Make sure backend is running
- Verify IP address is correct

### Use USB Instead (Always Works!)
```bash
setup-usb-testing.bat
```
Then select "Localhost (ADB)" in Developer Mode

---

## 📚 Full Documentation

See `MOBILE_DEV_MODE_GUIDE.md` for complete details.

---

## 🎯 Current Configuration

**Your Laptop IP:** Run `ipconfig` to find current IP
**Backend Port:** `8000`
**Developer Mode:** Tap logo 5 times
**Custom URL Format:** `http://YOUR_IP:8000` (without /api)

---

**Happy Testing! 🎉**
