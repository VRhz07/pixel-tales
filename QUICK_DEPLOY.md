# 🚀 Quick Deploy Guide (5 Minutes)

## Prerequisites
✅ GitHub account
✅ Render.com account
✅ Code pushed to GitHub

## Step 1: Deploy Backend (2 minutes)

1. Go to https://render.com
2. Click "New +" → "Blueprint"
3. Connect your GitHub repo
4. Click "Apply"
5. Wait for deployment (5-10 min)

## Step 2: Configure (1 minute)

In Render dashboard, add environment variables:
```
DEBUG=False
ALLOWED_HOSTS=<your-app>.onrender.com
GOOGLE_AI_API_KEY=<your-key>
DATABASE_URL=sqlite:///data/db.sqlite3
RENDER=True
```

Add Disk:
- Mount Path: `/opt/render/project/src/data`
- Size: 1 GB

## Step 3: Update Frontend (1 minute)

Edit `frontend/.env`:
```env
VITE_API_BASE_URL=https://<your-app>.onrender.com/api
```

## Step 4: Build APK (1 minute)

```bash
cd frontend
npm run build
cd ..
npx cap sync android
npx cap open android
# Build → Generate APK
```

## Done! 🎉

Your API: `https://<your-app>.onrender.com/api`
Your APK: `android/app/build/outputs/apk/debug/app-debug.apk`

---

See `DEPLOYMENT_CHECKLIST.md` for detailed steps.
See `backend/DEPLOYMENT_GUIDE.md` for troubleshooting.
