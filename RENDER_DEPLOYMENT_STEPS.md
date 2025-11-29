# 🚀 Render.com Deployment - Step by Step

## What We're Doing
We're deploying your Django backend to Render.com (free hosting) so your mobile app can connect to a live server instead of localhost.

---

## 📋 Before You Start

### 1. Get Your API Keys Ready
You'll need these during deployment:
- ✅ **Google AI API Key** (Gemini): `your-gemini-api-key-here` (⚠️ Old key exposed - regenerate!)
- ✅ **SendGrid API Key**: Get from https://sendgrid.com (optional for now)

### 2. Push Your Code to GitHub
```bash
# In your project root
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

**Important:** Make sure `backend/build.sh` is committed!

---

## 🎯 Deployment Steps

### Step 1: Create Render Account (2 minutes)

1. Go to **https://render.com**
2. Click **"Get Started for Free"**
3. Choose **"Sign in with GitHub"**
4. Authorize Render to access your repositories

---

### Step 2: Create New Web Service (3 minutes)

1. In Render Dashboard, click **"New +"** button (top right)
2. Select **"Blueprint"**
3. Choose **"Connect a repository"**
4. Find your project repository
5. Click **"Connect"**
6. Render will detect `render.yaml` automatically
7. Click **"Apply"** at the bottom

**Alternative (Manual Setup):**
If Blueprint doesn't work:
1. Click **"New +"** → **"Web Service"**
2. Connect your repository
3. Fill in these settings:
   - **Name**: `pixeltales-backend` (or any name you want)
   - **Region**: Oregon (US West)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Environment**: Python 3
   - **Build Command**: `./build.sh`
   - **Start Command**: `daphne -b 0.0.0.0 -p $PORT storybookapi.asgi:application`
   - **Plan**: Free

---

### Step 3: Add Environment Variables (2 minutes)

After creating the service:
1. Go to **"Environment"** tab (left sidebar)
2. Click **"Add Environment Variable"**
3. Add these one by one:

| Key | Value | Notes |
|-----|-------|-------|
| `DEBUG` | `False` | Production mode |
| `SECRET_KEY` | (auto-generated) | Render creates this |
| `ALLOWED_HOSTS` | `your-app-name.onrender.com` | Replace with your actual URL |
| `GOOGLE_AI_API_KEY` | `your-gemini-api-key-here` | Your Gemini key (backend only!) |
| `DATABASE_URL` | `sqlite:///data/db.sqlite3` | SQLite in persistent disk |
| `RENDER` | `True` | Tells Django it's on Render |
| `FROM_EMAIL` | `noreply@pixeltales.com` | Any email you want |
| `JWT_ACCESS_TOKEN_LIFETIME_DAYS` | `30` | Token lifetime |
| `JWT_REFRESH_TOKEN_LIFETIME_DAYS` | `365` | Refresh token lifetime |

**Optional (if you have SendGrid):**
| Key | Value |
|-----|-------|
| `SENDGRID_API_KEY` | Your SendGrid API key |

4. Click **"Save Changes"**

---

### Step 4: Add Persistent Disk (CRITICAL! 2 minutes)

**Why?** Your SQLite database needs permanent storage, or it will reset on every deployment!

1. Scroll down to **"Disks"** section
2. Click **"Add Disk"**
3. Fill in:
   - **Name**: `pixeltales-data`
   - **Mount Path**: `/opt/render/project/src/data`
   - **Size**: 1 GB (free tier includes this)
4. Click **"Save"**

---

### Step 5: Deploy! (5-10 minutes)

1. Render will automatically start building
2. Click **"Logs"** tab to watch progress
3. You'll see:
   ```
   Installing dependencies...
   Running migrations...
   Collecting static files...
   Build completed!
   Starting server...
   ```
4. Wait for status to change from "Building" → "Live" (green dot)
5. Your URL will be: `https://your-app-name.onrender.com`

**Common Build Errors:**
- `Permission denied: build.sh` → Need to make it executable (see troubleshooting)
- `Module not found` → Check requirements.txt is complete
- `Database error` → Check DATABASE_URL is set correctly

---

### Step 6: Create Admin User (2 minutes)

1. In your service dashboard, click **"Shell"** tab
2. A terminal will open
3. Run this command:
   ```bash
   python manage.py createsuperuser
   ```
4. Enter:
   - Username: `admin` (or whatever you want)
   - Email: `admin@pixeltales.com`
   - Password: (choose a strong password)
   - Confirm password

5. You can now access admin panel at: `https://your-app-name.onrender.com/admin`

---

### Step 7: Test Your Backend (2 minutes)

**Option A: Use the test script**
```bash
# On your local machine
python backend/test_deployment.py https://your-app-name.onrender.com
```

**Option B: Manual test**
1. Visit: `https://your-app-name.onrender.com/api/`
2. You should see the API response
3. Visit: `https://your-app-name.onrender.com/admin/`
4. You should see the Django admin login

**Option C: Test with curl**
```bash
# Test API root
curl https://your-app-name.onrender.com/api/

# Test registration
curl https://your-app-name.onrender.com/api/auth/register/ \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"TestPass123!","account_type":"child"}'
```

---

### Step 8: Update Frontend Configuration (1 minute)

1. Open `frontend/.env`
2. Change this line:
   ```env
   VITE_API_BASE_URL=http://localhost:8000/api
   ```
   To:
   ```env
   VITE_API_BASE_URL=https://your-app-name.onrender.com/api
   ```
   (Replace `your-app-name` with your actual Render URL)

3. Save the file

---

### Step 9: Test Frontend Connection (2 minutes)

```bash
# Start frontend locally
cd frontend
npm run dev
```

1. Open http://localhost:3100
2. Try to register a new account
3. Try to login
4. Create a test story
5. Everything should work with the production backend!

---

## 🎉 Deployment Complete!

Your backend is now live at: `https://your-app-name.onrender.com`

### Next Steps:

1. **Build your APK** → See `CAPACITOR_SETUP.md`
2. **Test on phone** → Install APK and test all features
3. **Share with friends** → Get feedback!

---

## 📝 Important Notes

### Free Tier Limitations:
- ⚠️ **Spins down after 15 minutes of inactivity**
  - First request after sleep takes 30-60 seconds
  - This is normal for free tier
  - Paid tier ($7/mo) removes this

- ✅ **What's Included:**
  - 750 hours/month free compute
  - 1 GB persistent disk
  - Automatic SSL (HTTPS)
  - Unlimited bandwidth
  - Auto-deploy from GitHub

### Database:
- ✅ SQLite is perfect for testing and MVP
- ✅ Can handle 100,000+ users easily
- ⚠️ Single writer (fine for most mobile apps)
- 💡 Migrate to PostgreSQL when you hit 10k+ active users

---

## 🔧 Troubleshooting

### Build Fails: "Permission denied: build.sh"

**Fix on Windows:**
```bash
# In Git Bash or WSL
cd backend
chmod +x build.sh
git add build.sh
git commit -m "Make build.sh executable"
git push origin main
```

**Fix with Git:**
```bash
git update-index --chmod=+x backend/build.sh
git commit -m "Make build.sh executable"
git push origin main
```

### Database Not Persisting

1. Check disk is mounted: Shell → `ls -la /opt/render/project/src/data`
2. Should show `db.sqlite3` file
3. If missing, check Disks section in settings

### CORS Errors in Frontend

1. Check `ALLOWED_HOSTS` includes your Render URL
2. Check `RENDER=True` is set in environment variables
3. Check frontend `.env` has correct API URL

### Slow First Request (Cold Start)

- **This is normal on free tier!**
- Server spins down after 15 min inactivity
- First request wakes it up (30-60 seconds)
- Subsequent requests are fast
- **Solution:** Upgrade to paid tier ($7/mo) for always-on

### 502 Bad Gateway

1. Check build completed successfully in Logs
2. Check start command is correct
3. Wait a few minutes for initial startup
4. Restart service: Manual Deploy → "Clear build cache & deploy"

---

## 🎯 Your Deployment URLs

After deployment, save these:

- **Backend API**: `https://your-app-name.onrender.com/api/`
- **Admin Panel**: `https://your-app-name.onrender.com/admin/`
- **Health Check**: `https://your-app-name.onrender.com/api/`

Update these in:
- ✅ `frontend/.env` → `VITE_API_BASE_URL`
- ✅ Your documentation
- ✅ Mobile app configuration

---

## 📞 Need Help?

- **Render Docs**: https://render.com/docs
- **Django Deployment**: https://docs.djangoproject.com/en/4.2/howto/deployment/
- **Check Logs**: Render Dashboard → Your Service → Logs
- **Check Status**: Render Dashboard → Status page

---

**Total Time**: ~20-30 minutes
**Cost**: $0 (Free tier)
**SSL**: Included (automatic HTTPS)
**Uptime**: 99.99% (but with cold starts on free tier)

🎉 **You're ready to build your APK!**
