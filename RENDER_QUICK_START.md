# 🚀 Render.com Deployment - Quick Start

## Step 1: Create Render Account

1. Go to: **https://render.com**
2. Click **"Get Started for Free"**
3. Sign in with GitHub
4. Authorize Render to access your repositories

✅ **Done? Let's continue!**

---

## Step 2: Deploy Your Backend

### Option A: Blueprint (Automatic - Recommended)

1. In Render dashboard, click **"New +"** (top right)
2. Select **"Blueprint"**
3. Click **"Connect a repository"**
4. Find your repository (e.g., `pixel-tales`)
5. Click **"Connect"**
6. Render detects `render.yaml` automatically
7. Click **"Apply"** at the bottom
8. Wait for deployment to start...

### Option B: Manual Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `pixeltales-backend`
   - **Region**: Oregon (Free)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Environment**: Python 3
   - **Build Command**: `./build.sh`
   - **Start Command**: `daphne -b 0.0.0.0 -p $PORT storybookapi.asgi:application`
   - **Plan**: Free
4. Click **"Create Web Service"**

---

## Step 3: Add Environment Variables

Go to your service → **Environment** tab → Add these:

```
DEBUG=False
SECRET_KEY=<will be auto-generated>
ALLOWED_HOSTS=<your-app-name>.onrender.com
GOOGLE_AI_API_KEY=your-gemini-api-key-here  # Backend only - see SECURITY_SETUP.md
DATABASE_URL=sqlite:///data/db.sqlite3
RENDER=True
FROM_EMAIL=noreply@pixeltales.com
JWT_ACCESS_TOKEN_LIFETIME_DAYS=30
JWT_REFRESH_TOKEN_LIFETIME_DAYS=365
```

**Optional (if you have SendGrid):**
```
SENDGRID_API_KEY=<your-sendgrid-key>
```

Click **"Save Changes"**

---

## Step 4: Add Persistent Disk (CRITICAL!)

⚠️ **Without this, your database will reset on every deployment!**

1. Scroll down to **"Disks"** section
2. Click **"Add Disk"**
3. Configure:
   - **Name**: `pixeltales-data`
   - **Mount Path**: `/opt/render/project/src/data`
   - **Size**: 1 GB
4. Click **"Save"**

---

## Step 5: Wait for Deployment

1. Go to **"Logs"** tab
2. Watch the build progress:
   ```
   Installing dependencies...
   Running migrations...
   Collecting static files...
   Build completed!
   Starting server...
   ```
3. Wait for status: "Building" → "Live" (green dot)
4. Your URL: `https://<your-app-name>.onrender.com`

**First deployment takes 5-10 minutes**

---

## Step 6: Test Your Backend

### Quick Test:
Visit: `https://<your-app-name>.onrender.com/api/`

Should see API response!

### Full Test:
```bash
python backend/test_deployment.py https://<your-app-name>.onrender.com
```

### Admin Panel:
Visit: `https://<your-app-name>.onrender.com/admin/`

---

## Step 7: Create Admin User

1. In Render dashboard → **Shell** tab
2. Run:
   ```bash
   python manage.py createsuperuser
   ```
3. Enter username, email, password
4. Login at `/admin/`

---

## Step 8: Update Frontend

Edit `frontend/.env`:
```env
VITE_API_BASE_URL=https://<your-app-name>.onrender.com/api
```

Replace `<your-app-name>` with your actual Render URL!

---

## 🎉 Deployment Complete!

Your backend is live at: `https://<your-app-name>.onrender.com`

### Next Steps:
1. ✅ Backend deployed
2. ✅ Frontend .env updated
3. 📱 **Build APK** → See `APK_BUILD_GUIDE.md`
4. 🎮 **Test on phone!**

---

## 🆘 Troubleshooting

### Build Failed?
- Check Logs tab for error details
- Common issue: Make sure `build.sh` is executable (we already did this!)

### Database Not Persisting?
- Check Disk is mounted in Settings → Disks
- Path should be: `/opt/render/project/src/data`

### 502 Bad Gateway?
- Wait a few minutes for initial startup
- Check Logs for errors
- Try Manual Deploy → Clear build cache & deploy

### Cold Starts (Slow First Request)?
- Normal on free tier!
- Server sleeps after 15 min inactivity
- First request takes 30-60 seconds to wake up
- Subsequent requests are fast

---

## 📝 Important Notes

**Free Tier Includes:**
- ✅ 750 hours/month compute
- ✅ 1 GB persistent disk
- ✅ Automatic HTTPS/SSL
- ✅ Auto-deploy from GitHub
- ⚠️ Spins down after 15 min inactivity

**When to Upgrade ($7/mo):**
- Always-on (no cold starts)
- Better performance
- More compute hours

---

## 🎯 Your URLs to Save

After deployment, save these:

```
Backend API: https://<your-app-name>.onrender.com/api/
Admin Panel: https://<your-app-name>.onrender.com/admin/
```

Update in:
- ✅ `frontend/.env`
- ✅ Your notes/documentation

---

**Total Time**: ~20 minutes
**Cost**: $0 (Free tier)
**Status**: Ready for mobile testing! 🎉
