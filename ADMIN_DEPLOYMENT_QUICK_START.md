# 🚀 Admin Dashboard Quick Start Guide

## TL;DR - Deploy Admin in 10 Minutes

Your admin dashboard is currently embedded in the frontend. When you build the APK for mobile, admins can't access it. This guide shows you how to deploy it as a **separate web app** that connects to your existing Render database.

---

## ⚡ Quick Deploy Steps

### 1️⃣ Test Admin Build Locally (2 minutes)

```bash
cd frontend

# Install dependencies (if not already done)
npm install

# Test admin build
npm run build:admin

# Preview the admin build
npm run preview:admin
```

Open browser to `http://localhost:4173/admin` - You should see the admin login page.

---

### 2️⃣ Deploy to Render (5 minutes)

#### Option A: Using Render Dashboard (Easiest)

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → Select **"Static Site"**
3. Connect your GitHub repository
4. Fill in these settings:

   ```
   Name: pixeltales-admin
   Branch: main
   Build Command: cd frontend && npm install && npm run build:admin
   Publish Directory: frontend/dist-admin
   ```

5. Click **"Advanced"** → Add these:

   **Environment Variables:**
   ```
   Key: VITE_API_URL
   Value: https://your-backend-app.onrender.com/api
   ```

   **Rewrite Rules:**
   ```
   Source: /*
   Destination: /index.html
   ```

6. Click **"Create Static Site"**

Wait 2-3 minutes for deployment. You'll get a URL like:
`https://pixeltales-admin.onrender.com`

---

### 3️⃣ Update Backend CORS (3 minutes)

Open `backend/storybookapi/settings.py` and add your admin URL:

```python
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'https://your-main-app.onrender.com',
    'https://pixeltales-admin.onrender.com',  # ← Add this line
    'capacitor://localhost',
    'ionic://localhost',
    'http://localhost',
]

CSRF_TRUSTED_ORIGINS = [
    'http://localhost:5173',
    'https://your-main-app.onrender.com',
    'https://pixeltales-admin.onrender.com',  # ← Add this line
]
```

Commit and push:

```bash
git add backend/storybookapi/settings.py
git commit -m "Add admin dashboard CORS"
git push origin main
```

Wait for backend to redeploy (auto-deploys on Render).

---

### 4️⃣ Access Your Admin Dashboard

1. Visit: `https://pixeltales-admin.onrender.com/admin`
2. Login with your admin credentials
3. ✅ Done! Your admin dashboard is now accessible from any browser!

---

## 📋 What You Get

| Before | After |
|--------|-------|
| ❌ Admin locked in APK | ✅ Admin accessible via browser |
| ❌ Can't manage users on mobile | ✅ Full admin features from desktop |
| ❌ One deployment for everything | ✅ Separate admin & mobile apps |

---

## 🎯 Your Infrastructure

```
Mobile APK (Children)  ──┐
                         ├──→ Backend API (Render) ──→ PostgreSQL
Admin Web (Browser)   ──┘
```

Both connect to the **same database** on Render!

---

## 🔐 Security Notes

- Admin dashboard is **separate from mobile app**
- Uses **same authentication** system (admin JWT tokens)
- Connects to **same database**
- Admin credentials created with `python manage.py createsuperuser`

---

## 🛠️ Available Commands

```bash
# Development
npm run dev:admin          # Run admin dev server on port 5174
npm run build:admin        # Build admin for production
npm run preview:admin      # Preview admin build locally

# Regular app (for mobile)
npm run dev                # Run main app dev server
npm run build              # Build main app
npm run build:mobile       # Build and sync to Android
```

---

## 🐛 Troubleshooting

### Admin login fails with CORS error

**Solution:** Make sure you added the admin URL to `CORS_ALLOWED_ORIGINS` in backend settings.

### Environment variables not working

**Solution:** In Render dashboard:
1. Go to your admin static site
2. Environment → Add `VITE_API_URL`
3. Click "Save Changes"
4. Manually trigger redeploy

### 404 error on page refresh

**Solution:** Add rewrite rule in Render:
- Source: `/*`
- Destination: `/index.html`

---

## 📞 Need More Details?

See the full guide: [ADMIN_WEB_DEPLOYMENT_GUIDE.md](./ADMIN_WEB_DEPLOYMENT_GUIDE.md)

---

## ✅ Checklist

- [ ] Test admin build locally (`npm run build:admin`)
- [ ] Deploy to Render as Static Site
- [ ] Add `VITE_API_URL` environment variable
- [ ] Update backend CORS settings
- [ ] Redeploy backend
- [ ] Test admin login from deployed URL
- [ ] Share URL with authorized admins only

---

**Time to Complete:** ~10 minutes  
**Cost:** FREE (Render static sites are free)  
**Difficulty:** Easy
