# 🚀 Admin Dashboard Render Deployment (Updated 2024)

## Current Render Interface Guide

This guide reflects Render's current interface (as of 2024).

---

## 📋 Step-by-Step Deployment

### Step 1: Create Static Site

1. **Go to Render Dashboard**: https://dashboard.render.com/

2. **Click "New +" → "Static Site"**

3. **Connect Your Repository**:
   - If first time: Click "Connect GitHub" or "Connect GitLab"
   - If already connected: Select your repository from the list
   - Choose: `PixelTales` (or your repo name)

### Step 2: Configure Basic Settings

Fill in these fields:

```
Name: pixeltales-admin
Branch: main (or your production branch)
Root Directory: (leave blank)
Build Command: cd frontend && npm install && npm run build:admin
Publish Directory: frontend/dist-admin
```

### Step 3: Configure Environment Variables

1. **Click "Advanced"** button (before creating)
2. **Under "Environment Variables"** section, click "Add Environment Variable"
3. Add:
   ```
   Key: VITE_API_URL
   Value: https://your-backend-name.onrender.com/api
   ```
   
   Replace `your-backend-name` with your actual backend service name on Render.

### Step 4: Handle SPA Routing (Rewrite Rules)

**Since there's no "Redirects/Rewrites" section in the UI anymore, we'll use a `_redirects` file instead.**

Create this file in your project:

**File: `frontend/public/_redirects`**

```
/* /index.html 200
```

This tells Render to serve `index.html` for all routes (Single Page Application behavior).

Let me create this file for you now.

### Step 5: Create the Site

1. **Click "Create Static Site"**
2. **Wait for deployment** (3-5 minutes)
3. **Watch the build logs** - you'll see:
   - Cloning repository
   - Installing dependencies
   - Running build command
   - Deploying to CDN

### Step 6: Get Your Admin URL

After deployment completes:
- Your admin URL will be: `https://pixeltales-admin.onrender.com`
- Or similar based on the name you chose

### Step 7: Update Backend CORS

**Edit `backend/storybookapi/settings.py`:**

```python
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'https://your-main-app.onrender.com',
    'https://pixeltales-admin.onrender.com',  # ← Add this (use your actual URL)
    'capacitor://localhost',
    'ionic://localhost',
    'http://localhost',
]

CSRF_TRUSTED_ORIGINS = [
    'http://localhost:5173',
    'https://your-main-app.onrender.com',
    'https://pixeltales-admin.onrender.com',  # ← Add this (use your actual URL)
]
```

**Commit and push:**

```bash
git add backend/storybookapi/settings.py
git commit -m "Add admin dashboard to CORS"
git push origin main
```

### Step 8: Test Your Admin Dashboard

1. **Visit**: `https://pixeltales-admin.onrender.com/admin`
2. **Login** with your admin credentials
3. **Verify** all features work

---

## 🔄 Alternative: Using render.yaml (Blueprint)

If you prefer infrastructure-as-code, you can use a `render.yaml` file:

**File: `render.yaml` (in project root)**

```yaml
services:
  # Your existing backend service
  - type: web
    name: pixeltales-backend
    env: python
    # ... your existing backend config ...

  # New admin static site
  - type: web
    name: pixeltales-admin
    env: static
    buildCommand: cd frontend && npm install && npm run build:admin
    staticPublishPath: ./frontend/dist-admin
    envVars:
      - key: VITE_API_URL
        value: https://pixeltales-backend.onrender.com/api
    headers:
      - path: /*
        name: X-Frame-Options
        value: DENY
      - path: /*
        name: X-Content-Type-Options
        value: nosniff
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
```

Then:
1. Push the `render.yaml` to your repo
2. In Render dashboard: **New → Blueprint**
3. Select your repository
4. Render will deploy both services automatically

---

## 📝 Files You Need to Create

### 1. Redirects File (Required for SPA routing)

**File: `frontend/public/_redirects`**

```
/* /index.html 200
```

This is the modern way to handle SPA routing on Render static sites.

### 2. Headers File (Optional but recommended for security)

**File: `frontend/public/_headers`**

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  X-XSS-Protection: 1; mode=block
```

---

## 🎯 Complete Deployment Checklist

- [ ] Create `frontend/public/_redirects` file (for SPA routing)
- [ ] Create `frontend/public/_headers` file (optional, for security)
- [ ] Commit and push all changes to GitHub
- [ ] Go to Render Dashboard
- [ ] Create new Static Site
- [ ] Configure build settings
- [ ] Add `VITE_API_URL` environment variable
- [ ] Click "Create Static Site"
- [ ] Wait for build to complete (3-5 minutes)
- [ ] Copy the deployed URL
- [ ] Update backend CORS settings
- [ ] Push backend changes
- [ ] Test admin login at deployed URL
- [ ] ✅ Done!

---

## 🔍 Render's Current Build Settings Location

In the new Render interface:

| Setting | Location |
|---------|----------|
| **Build Command** | Main form when creating site |
| **Publish Directory** | Main form when creating site |
| **Environment Variables** | Click "Advanced" → "Environment Variables" |
| **Auto Deploy** | Click "Advanced" → "Auto-Deploy" (enable/disable) |
| **Secret Files** | Click "Advanced" → "Secret Files" (for .env files) |
| **Build Filters** | Click "Advanced" → "Build Filters" (paths to watch) |
| **Redirects/Rewrites** | Use `_redirects` file in public directory |
| **Custom Headers** | Use `_headers` file in public directory |

---

## 🆘 Troubleshooting

### Issue: 404 errors when refreshing pages

**Solution**: Make sure `frontend/public/_redirects` exists with:
```
/* /index.html 200
```

### Issue: Build fails with "command not found"

**Solution**: Check your build command syntax:
```
cd frontend && npm install && npm run build:admin
```
Make sure the `&&` operators are correct.

### Issue: Environment variables not loading

**Solution**: 
1. Go to your static site dashboard on Render
2. Click "Environment" in the left sidebar
3. Add `VITE_API_URL` there
4. Trigger manual redeploy

### Issue: CORS errors after deployment

**Solution**:
1. Add your admin URL to `CORS_ALLOWED_ORIGINS` in backend
2. Push the changes
3. Wait for backend to redeploy
4. Clear browser cache

---

## 💡 Pro Tips

**Tip 1: Use Render's Build Logs**
- Click on the deployment in progress
- View real-time build logs
- Helps debug build issues

**Tip 2: Manual Redeploy**
- Go to your static site dashboard
- Click "Manual Deploy" → "Clear build cache & deploy"
- Useful when builds are cached

**Tip 3: Preview Deployments**
- Enable "Auto-Deploy" for your branch
- Every push triggers automatic deployment
- Great for testing changes

**Tip 4: Custom Domain (Optional)**
- Go to "Settings" → "Custom Domain"
- Add your domain (e.g., `admin.yourdomain.com`)
- Follow DNS setup instructions

---

## 📊 What Happens During Build

```
1. Clone Repository
   ↓
2. Navigate to frontend directory (cd frontend)
   ↓
3. Install dependencies (npm install)
   ↓
4. Run build command (npm run build:admin)
   ↓
5. Copy dist-admin/ contents to CDN
   ↓
6. Apply _redirects and _headers
   ↓
7. Deploy to global CDN
   ↓
8. Assign URL: https://your-app.onrender.com
```

---

## ✅ Success Criteria

Your deployment is successful when:

1. ✅ Build completes without errors
2. ✅ Site shows "Live" status in Render dashboard
3. ✅ You can visit the URL
4. ✅ Admin login page loads
5. ✅ No 404 errors when refreshing
6. ✅ Can login with admin credentials
7. ✅ All admin features work

---

## 🎉 After Successful Deployment

Your infrastructure will look like this:

```
📱 Mobile APK                    💻 Admin Web
(pixeltales.apk)                (admin.onrender.com)
        ↓                               ↓
    End Users                      Administrators
        ↓                               ↓
        └──────────┬────────────────────┘
                   ↓
        🌐 Backend API (Render)
                   ↓
        💾 PostgreSQL Database
```

**Benefits:**
- ✅ Admin accessible from any browser
- ✅ Free static hosting
- ✅ Auto-deploy on git push
- ✅ Global CDN (fast worldwide)
- ✅ HTTPS included
- ✅ Same database as mobile app

---

**Time to Deploy:** 10-15 minutes  
**Cost:** $0 (Render static sites are free)  
**Difficulty:** Easy

---

Let me know if you need help with any step!
