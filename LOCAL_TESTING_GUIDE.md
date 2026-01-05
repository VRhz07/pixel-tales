# 📱 Local APK Testing Guide

Test your Pixel Tales APK with your local backend - no rebuilding needed when your network changes!

## 🎯 How It Works

We use **ADB port forwarding** to make your laptop's `localhost:8000` accessible from your phone as `localhost:8000`. This means:

- ✅ Build APK **once**
- ✅ Works on **any network** (WiFi, mobile data, no internet)
- ✅ No IP address configuration needed
- ✅ Phone accesses your local backend via USB

---

## 📋 Prerequisites

1. **Android SDK Platform Tools** installed (includes ADB)
   - Download: https://developer.android.com/tools/releases/platform-tools
   - Or install via Android Studio

2. **USB Debugging enabled** on your phone:
   - Settings → About Phone → Tap "Build Number" 7 times
   - Settings → Developer Options → Enable "USB Debugging"

3. **Phone connected via USB cable**

---

## 🚀 Quick Start

### Step 1: Build the APK (One Time Only!)

```bash
# Make sure you're in the project root
npm run build

# Sync to Android
npx cap sync android

# Build debug APK
cd android
gradlew assembleDebug
```

The APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

### Step 2: Install APK on Your Phone

Transfer and install the APK on your phone.

### Step 3: Set Up Port Forwarding

**Every time you connect your phone**, run:

```bash
test-local.bat
```

This script will:
- ✅ Check ADB connection
- ✅ Verify device is connected
- ✅ Set up port forwarding (phone's localhost:8000 → laptop's localhost:8000)
- ✅ Remind you to start the backend

### Step 4: Start Backend

In a **separate terminal**:

```bash
cd backend
python manage.py runserver
```

### Step 5: Test!

Open the app on your phone. It will connect to your local backend at `http://localhost:8000/api`

---

## 🔄 Daily Workflow

Every time you want to test:

1. **Connect phone via USB**
2. **Run `test-local.bat`** (sets up port forwarding)
3. **Start backend** (`python manage.py runserver`)
4. **Open app on phone** and test!

---

## 🐛 Troubleshooting

### "ADB not found"
- Install Android SDK Platform Tools
- Add ADB to your system PATH
- Restart terminal/command prompt

### "No device connected"
- Check USB cable is working (try file transfer)
- Enable USB Debugging in Developer Options
- Try running `adb devices` to see if device is recognized
- On phone, accept "Allow USB Debugging" prompt

### "Unauthorized device"
- Check your phone screen for authorization prompt
- Click "Always allow from this computer"
- Run `test-local.bat` again

### App can't connect to backend
- Make sure backend is running (`python manage.py runserver`)
- Check port forwarding is active: Run `test-local.bat` again
- Verify backend is accessible: Open `http://localhost:8000/api` in browser on laptop

### Connection lost after phone sleep
- Port forwarding stays active even when phone sleeps
- If issues occur, just run `test-local.bat` again

---

## ⚙️ Configuration Files

### Frontend Configuration
**File:** `frontend/.env.local`
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

This tells the APK to connect to localhost via ADB port forwarding.

### Backend Configuration
**File:** `backend/.env`
```env
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,*
FRONTEND_URL=http://localhost:3000
```

When `DEBUG=True`, Django automatically allows CORS from all origins.

---

## 🔒 Security Notes

- ⚠️ This setup is for **local development only**
- Never deploy with `DEBUG=True` or `ALLOWED_HOSTS=*`
- Port forwarding only works while USB is connected (secure by design)

---

## 📊 Comparison with Other Methods

| Method | Rebuild on IP Change? | Requires USB? | Works Offline? |
|--------|----------------------|---------------|----------------|
| **ADB Port Forwarding** ✅ | No | Yes | Yes |
| Hardcode IP in APK | Yes | No | No (WiFi needed) |
| Dev Mode URL Input | No | No | No (WiFi needed) |
| Test on Production | No | No | No (Internet needed) |

---

## 💡 Pro Tips

1. **Keep `test-local.bat` running** - It shows you the setup status
2. **Use a good USB cable** - Cheap cables can cause connection issues
3. **Enable "Stay Awake"** in Developer Options - Phone won't sleep while charging
4. **Check backend terminal** - See all API requests in real-time
5. **Use Chrome Remote Debugging** - Debug web view: `chrome://inspect`

---

## 🎉 Benefits

- ✅ Test instantly after code changes (just restart backend)
- ✅ Debug with Chrome DevTools
- ✅ Works without WiFi
- ✅ No IP address management
- ✅ No APK rebuilding
- ✅ Same workflow regardless of location

---

## 🆘 Need Help?

If you encounter issues:
1. Check the troubleshooting section above
2. Run `adb devices` to verify connection
3. Check if backend is accessible: `curl http://localhost:8000/api`
4. Restart ADB server: `adb kill-server` then `adb start-server`

Happy testing! 🚀
