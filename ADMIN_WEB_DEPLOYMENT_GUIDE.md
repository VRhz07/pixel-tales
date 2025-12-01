# 🎛️ Admin Dashboard Web Deployment Guide

## Overview

The admin dashboard is currently embedded in the frontend React app. When the app is packaged as an APK for mobile, the admin dashboard becomes inaccessible. This guide shows you how to deploy the admin dashboard as a **separate web application** that remains accessible via browser while connecting to your Render database.

## 🎯 Solution Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR INFRASTRUCTURE                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐      ┌──────────────────┐            │
│  │  Mobile APK      │      │  Admin Web App   │            │
│  │  (Child Users)   │      │  (Browser Only)  │            │
│  │                  │      │                  │            │
│  │  • Story Reading │      │  • User Mgmt     │            │
│  │  • Story Create  │      │  • Analytics     │            │
│  │  • Social        │      │  • Moderation    │            │
│  └────────┬─────────┘      └────────┬─────────┘            │
│           │                         │                       │
│           │         ┌───────────────┘                       │
│           │         │                                       │
│           └─────────┼───────────────────┐                   │
│                     ▼                   │                   │
│         ┌────────────────────────┐      │                   │
│         │   Backend API (Render) │◄─────┘                   │
│         │                        │                          │
│         │  • User Auth API       │                          │
│         │  • Admin Auth API      │                          │
│         │  • Story API           │                          │
│         │  • Admin API           │                          │
│         └───────────┬────────────┘                          │
│                     │                                       │
│                     ▼                                       │
│         ┌────────────────────────┐                          │
│         │  PostgreSQL (Render)   │                          │
│         │                        │                          │
│         │  • Users & Stories     │                          │
│         │  • Admin Users         │                          │
│         └────────────────────────┘                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 📋 Deployment Options

### Option 1: Deploy on Render (Recommended - Same Platform)
**Pros:**
- Same platform as your backend
- Free tier available
- Automatic HTTPS
- Easy subdomain setup (e.g., `admin-pixeltales.onrender.com`)

### Option 2: Deploy on Vercel
**Pros:**
- Optimized for React apps
- Fast deployment
- Free tier with good limits
- Custom domain support

### Option 3: Deploy on Netlify
**Pros:**
- Great for static sites
- Free tier
- Easy setup
- Form handling built-in

---

## 🚀 Step-by-Step Deployment (Render - Recommended)

### Step 1: Create Admin-Only Build Configuration

Create a new file in your frontend directory:

**File: `frontend/vite.config.admin.ts`**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist-admin',
    // Admin dashboard optimizations
    rollupOptions: {
      output: {
        manualChunks: {
          'admin': [
            './src/pages/AdminDashboardPage.tsx',
            './src/services/admin.service.ts',
            './src/services/adminAuth.service.ts',
          ],
        },
      },
    },
  },
  // Environment variables
  define: {
    'import.meta.env.VITE_ADMIN_ONLY': JSON.stringify('true'),
  },
});
```

### Step 2: Create Admin-Only App Entry

Create a simplified app entry for admin-only mode:

**File: `frontend/src/AdminApp.tsx`**

```typescript
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import AdminDashboardPage from './pages/AdminDashboardPage';
import { useThemeStore } from './stores/themeStore';
import { ToastProvider } from './contexts/ToastContext';
import './App.css';

function AdminApp() {
  const { initializeTheme, isDarkMode } = useThemeStore();

  useEffect(() => {
    initializeTheme();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  return (
    <ToastProvider>
      <Router>
        <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
          <Routes>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/" element={<Navigate to="/admin" replace />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </div>
      </Router>
    </ToastProvider>
  );
}

export default AdminApp;
```

### Step 3: Create Admin-Only Entry Point

**File: `frontend/index.admin.html`**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex, nofollow" />
    <title>Pixel Tales - Admin Dashboard</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.admin.tsx"></script>
  </body>
</html>
```

**File: `frontend/src/main.admin.tsx`**

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import AdminApp from './AdminApp.tsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AdminApp />
  </React.StrictMode>,
);
```

### Step 4: Add Build Scripts

Update your `frontend/package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "dev:admin": "vite --config vite.config.admin.ts",
    "build": "tsc && vite build",
    "build:admin": "tsc && vite build --config vite.config.admin.ts",
    "preview": "vite preview",
    "preview:admin": "vite preview --config vite.config.admin.ts --outDir dist-admin"
  }
}
```

### Step 5: Create Admin Deployment Files

**File: `admin-render.yaml`**

```yaml
services:
  - type: web
    name: pixeltales-admin
    env: static
    buildCommand: cd frontend && npm install && npm run build:admin
    staticPublishPath: ./frontend/dist-admin
    pullRequestPreviewsEnabled: false
    headers:
      - path: /*
        name: X-Frame-Options
        value: DENY
      - path: /*
        name: X-Content-Type-Options
        value: nosniff
      - path: /*
        name: Referrer-Policy
        value: no-referrer
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
    envVars:
      - key: VITE_API_URL
        sync: false
      - key: NODE_ENV
        value: production
```

### Step 6: Environment Variables for Admin App

Create **`frontend/.env.admin.production`**:

```bash
# Backend API URL (Your Render backend)
VITE_API_URL=https://your-backend-app.onrender.com/api

# Admin-only mode flag
VITE_ADMIN_ONLY=true

# WebSocket URL for real-time features (optional)
VITE_WS_URL=wss://your-backend-app.onrender.com/ws
```

### Step 7: Deploy to Render

#### Method A: Using Render Dashboard (GUI)

1. **Go to Render Dashboard**: https://dashboard.render.com/
2. **Click "New +"** → Select **"Static Site"**
3. **Connect Repository**: Link your GitHub repo
4. **Configure Settings**:
   - **Name**: `pixeltales-admin`
   - **Branch**: `main` (or your production branch)
   - **Build Command**: `cd frontend && npm install && npm run build:admin`
   - **Publish Directory**: `frontend/dist-admin`
5. **Add Environment Variable**:
   - Key: `VITE_API_URL`
   - Value: `https://your-backend-app.onrender.com/api`
6. **Advanced Settings** → Add Rewrite Rule:
   - Source: `/*`
   - Destination: `/index.html`
7. **Click "Create Static Site"**

#### Method B: Using Blueprint (Infrastructure as Code)

1. **Create `render.yaml` in project root** (if not exists)
2. **Add admin service** to the file (use the yaml above)
3. **Push to GitHub**
4. **In Render Dashboard**: New → Blueprint → Select your repo
5. **Render will detect and deploy** both backend and admin

### Step 8: Configure Backend CORS

Update your backend to allow the admin domain:

**File: `backend/storybookapi/settings.py`**

```python
# Add your admin domain to CORS
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'https://your-main-app.onrender.com',
    'https://your-admin-app.onrender.com',  # ← Add this
    'capacitor://localhost',
    'ionic://localhost',
    'http://localhost',
]

# Also update CSRF trusted origins
CSRF_TRUSTED_ORIGINS = [
    'http://localhost:5173',
    'https://your-main-app.onrender.com',
    'https://your-admin-app.onrender.com',  # ← Add this
]
```

**Redeploy your backend** after this change.

---

## 🔐 Security Best Practices

### 1. IP Whitelisting (Optional but Recommended)

Add IP restriction in Render:
- Go to your admin static site settings
- Under "Environment" → Add custom headers
- Use Cloudflare or similar CDN for IP whitelisting

### 2. Strong Admin Credentials

```bash
# In Render backend shell
python manage.py shell

# Create strong admin account
from django.contrib.auth.models import User
user = User.objects.create_superuser(
    username='admin_secure',
    email='admin@yourdomain.com',
    password='YourVeryStrongPassword123!@#'
)
```

### 3. Enable 2FA (Future Enhancement)

Add to your TODO:
- Implement 2FA for admin login
- Use Django packages like `django-otp`

### 4. Audit Logging

The admin system should log all actions:
```python
# All admin actions are logged in backend/storybook/admin_views.py
# Check logs in Render dashboard
```

---

## 🌐 Alternative: Deploy on Vercel

If you prefer Vercel (faster for React apps):

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Create Vercel Config

**File: `frontend/vercel.json`**

```json
{
  "buildCommand": "npm run build:admin",
  "outputDirectory": "dist-admin",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "env": {
    "VITE_API_URL": "https://your-backend-app.onrender.com/api"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" }
      ]
    }
  ]
}
```

### Step 3: Deploy

```bash
cd frontend
vercel --prod
```

Follow prompts and set environment variables when asked.

---

## 📊 Testing Your Deployment

### 1. Test Admin Login

Visit: `https://your-admin-app.onrender.com/admin`

### 2. Check API Connection

Open browser console and verify:
```javascript
// Should see API calls to your Render backend
console.log('API URL:', import.meta.env.VITE_API_URL);
```

### 3. Test Admin Features

- ✅ User management
- ✅ Dashboard stats
- ✅ Content moderation
- ✅ Analytics

---

## 🔄 Continuous Deployment

### Auto-Deploy on Git Push

Render will automatically redeploy when you push to your connected branch:

```bash
git add .
git commit -m "Update admin dashboard"
git push origin main
```

Both your backend and admin site will auto-deploy!

---

## 💡 Access URLs Summary

After deployment, you'll have:

| Service | URL | Purpose |
|---------|-----|---------|
| **Backend API** | `https://pixeltales-backend.onrender.com` | API & Database |
| **Admin Dashboard** | `https://pixeltales-admin.onrender.com` | Admin management (Web only) |
| **Mobile APK** | Native app | End users (Children) |

---

## 🎯 Benefits of This Setup

✅ **Admin accessible from any browser** (not locked in APK)  
✅ **Connects to same database** (Render PostgreSQL)  
✅ **Separate deployment** (no mobile overhead)  
✅ **Free tier friendly** (Render static site is free)  
✅ **Auto HTTPS** (Render provides SSL)  
✅ **Easy updates** (just push to git)  
✅ **Better security** (can add IP restrictions)  

---

## 🚨 Troubleshooting

### Issue: Admin can't connect to backend

**Solution**: Check CORS settings in `backend/storybookapi/settings.py`

```python
CORS_ALLOWED_ORIGINS = [
    'https://your-admin-app.onrender.com',  # Must match exactly
]
```

### Issue: 404 on page refresh

**Solution**: Ensure rewrite rules are set in `render.yaml`:

```yaml
routes:
  - type: rewrite
    source: /*
    destination: /index.html
```

### Issue: Environment variables not loading

**Solution**: In Render dashboard, verify:
- Settings → Environment → `VITE_API_URL` is set
- Redeploy after adding variables

---

## 📝 Next Steps

1. **Create the admin-only files** (AdminApp.tsx, vite.config.admin.ts)
2. **Test locally** with `npm run dev:admin`
3. **Deploy to Render** using the guide above
4. **Update CORS** in backend settings
5. **Test admin login** from deployed URL
6. **Share admin URL** with authorized administrators only

---

## 🔗 Quick Commands Reference

```bash
# Test admin build locally
cd frontend
npm run build:admin
npm run preview:admin

# Deploy to Render (via git)
git add .
git commit -m "Deploy admin dashboard"
git push origin main

# Deploy to Vercel (alternative)
cd frontend
vercel --prod
```

---

## 📚 Related Documentation

- [CREATE_ADMIN_GUIDE.md](./CREATE_ADMIN_GUIDE.md) - Creating admin users
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - General deployment
- [backend/DEPLOYMENT_GUIDE.md](./backend/DEPLOYMENT_GUIDE.md) - Backend setup

---

## ❓ FAQ

**Q: Will this cost extra?**  
A: No! Render's static site hosting is free. You're already paying for backend.

**Q: Can I use a custom domain?**  
A: Yes! Render allows custom domains even on free tier.

**Q: Is the admin data secure?**  
A: Yes, it uses the same secure API with admin-only JWT tokens.

**Q: Can I deploy both admin and user app?**  
A: Yes! You can deploy multiple frontends connecting to one backend.

---

**Created:** 2024  
**Last Updated:** 2024  
**Maintainer:** Pixel Tales Team
