# 🏠 Localhost Development Guide

## ✅ Setup Complete!

Your Pixel Tales app is now configured for **localhost development mode**. All API calls will go to `http://localhost:8000` instead of DigitalOcean.

---

## 🚀 Quick Start

### Option 1: Use the Automated Script (Recommended)

**Windows:**
```bash
start-localhost-dev.bat
```

**Mac/Linux:**
```bash
chmod +x start-localhost-dev.sh
./start-localhost-dev.sh
```

This will automatically:
- ✅ Set up Python virtual environment
- ✅ Install backend dependencies
- ✅ Run database migrations
- ✅ Start backend server (localhost:8000)
- ✅ Install frontend dependencies
- ✅ Start frontend dev server (localhost:3000)

---

### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
python -m venv venv                    # Create virtual env (first time only)
venv\Scripts\activate                  # Windows
# source venv/bin/activate             # Mac/Linux
pip install -r requirements.txt        # Install dependencies
python manage.py migrate               # Run migrations
python manage.py runserver 8000        # Start server
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install                            # First time only
npm run dev                            # Start dev server
```

---

## 🌐 Access Your App

Once both servers are running:

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000/api
- **Backend Admin:** http://localhost:8000/admin

---

## 🔧 Configuration Files

### Frontend Configuration
- **`.env`** - Currently active config (set to localhost)
- **`.env.local`** - Localhost development config
- **`.env.production`** - DigitalOcean production config

### Backend Configuration
- **`backend/.env`** - Backend environment variables
  - `DEBUG=True` - Enables debug mode
  - `ALLOWED_HOSTS=*` - Allows all hosts in development
  - Database, API keys, etc.

---

## 🔄 Switching Between Modes

### Switch to Localhost (Current Mode) ✅
```bash
cd frontend
copy .env.local .env        # Windows
# cp .env.local .env        # Mac/Linux
```

### Switch to DigitalOcean Production
```bash
cd frontend
copy .env.production .env   # Windows
# cp .env.production .env   # Mac/Linux
```

Then restart the frontend dev server.

---

## 🐛 Troubleshooting

### Backend Issues

**Problem:** "ModuleNotFoundError"
```bash
cd backend
venv\Scripts\activate
pip install -r requirements.txt
```

**Problem:** "no such table" errors
```bash
cd backend
python manage.py migrate
```

**Problem:** "Port 8000 already in use"
```bash
# Windows: Find and kill the process
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:8000 | xargs kill -9
```

### Frontend Issues

**Problem:** "Cannot connect to backend"
- ✅ Make sure backend is running at http://localhost:8000
- ✅ Check `frontend/.env` has `VITE_API_BASE_URL=http://localhost:8000/api`
- ✅ Try clearing browser cache (Ctrl+Shift+Del)

**Problem:** "Module not found" errors
```bash
cd frontend
npm install
```

**Problem:** "Port 3000 already in use"
```bash
# The frontend will automatically use port 3001, 3002, etc.
# Or kill the process:
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### CORS Issues

If you see CORS errors in browser console:
1. ✅ Backend is already configured to allow `localhost:3000` and `localhost:3001`
2. ✅ Make sure both servers are running
3. ✅ Try clearing browser cache
4. ✅ Check browser console for the actual error message

---

## 📝 Backend Database

### Using SQLite (Default)
The backend uses SQLite by default (`backend/db.sqlite3`). This file contains all your data.

**Backup your database:**
```bash
copy backend\db.sqlite3 backend\db.sqlite3.backup
```

**Reset database (⚠️ DELETES ALL DATA):**
```bash
cd backend
del db.sqlite3
python manage.py migrate
python manage.py createsuperuser  # Create admin account
```

---

## 🔑 API Keys

The backend needs these API keys (already configured in `backend/.env`):

| Service | Purpose | Status |
|---------|---------|--------|
| **Google AI (Gemini)** | Story generation | ✅ Configured |
| **Replicate** | Image generation (FLUX) | ✅ Configured |
| **Pollinations** | Alternative image generation | ✅ Configured |
| **OCR.space** | Handwriting recognition | ✅ Configured |
| **SendGrid** | Email verification | ✅ Configured |
| **Google Cloud TTS** | Text-to-speech (premium voices) | ⚠️ Optional |

All keys are already configured in your `backend/.env` file.

---

## 🎯 Benefits of Localhost Development

### ✅ Advantages
- **Fast Development** - No network latency
- **Easy Debugging** - See backend logs in real-time
- **Offline Work** - No internet required
- **Free Testing** - No cloud costs while developing
- **Hot Reload** - Both frontend and backend auto-reload on changes

### ⚠️ Limitations
- **Mobile Testing** - Can't test on physical mobile devices easily
  - Use Android emulator instead
  - Or use your PC's local IP (e.g., `http://192.168.1.x:8000/api`)
- **Production Features** - Some features might behave differently in production

---

## 📱 Mobile Development (Optional)

To test on mobile devices, you need to use your PC's local IP instead of localhost:

1. **Find your PC's IP address:**
   ```bash
   # Windows
   ipconfig
   # Look for "IPv4 Address" (e.g., 192.168.1.100)
   
   # Mac/Linux
   ifconfig
   # Look for "inet" address
   ```

2. **Update frontend/.env:**
   ```env
   VITE_API_BASE_URL=http://192.168.1.100:8000/api
   ```

3. **Ensure mobile and PC are on same WiFi network**

4. **Build and install APK** (see `build-mobile.bat`)

---

## 🔄 Returning to Development

**Next Time You Want to Code:**

1. Open 2 terminals
2. Terminal 1: `cd backend && venv\Scripts\activate && python manage.py runserver`
3. Terminal 2: `cd frontend && npm run dev`
4. Open http://localhost:3000

Or just run: `start-localhost-dev.bat`

---

## 📚 Related Documentation

- **Backend API:** `backend/README.md`
- **Frontend Setup:** `frontend/README.md`
- **Mobile Build:** `MOBILE_APK_SETUP_GUIDE.md`
- **DigitalOcean Deploy:** `backend/DIGITALOCEAN_DEPLOYMENT_GUIDE.md`

---

## ✅ Current Status

- ✅ Frontend configured for localhost (`http://localhost:8000/api`)
- ✅ Backend configured for local development (`DEBUG=True`)
- ✅ All API keys present in `backend/.env`
- ✅ Friend search issue fixed (see `backend/FRIEND_SEARCH_FIX_SUMMARY.md`)
- ✅ Quick start scripts created

**You're ready to develop! 🎉**

---

## 🆘 Need Help?

If you encounter any issues:

1. Check this guide's troubleshooting section
2. Check browser console for errors (F12)
3. Check backend terminal for error messages
4. Make sure both servers are running
5. Try restarting both servers

---

**Happy Coding! 🚀**
