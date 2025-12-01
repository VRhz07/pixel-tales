# 🔐 Admin Credentials Not Working - Troubleshooting Guide

## The Issue

Your admin dashboard deploys successfully, but login credentials that work locally don't work on the deployed version.

---

## 🎯 Root Cause

The deployed admin is connecting to the **wrong backend** or using the **wrong database**.

---

## 🔍 Check 1: Verify Backend API URL

### In Render Dashboard:

1. **Go to your admin static site** (`pixeltales-admin`)
2. **Click "Environment"** (left sidebar)
3. **Check `VITE_API_URL`** - What does it say?

**It should be:**
```
https://pixeltales-backend.onrender.com/api
```
(Or whatever your actual backend service name is)

**If it says:**
```
https://your-backend-app.onrender.com/api  ❌ WRONG (placeholder)
```

**Then you need to update it!**

---

## 🔧 Fix 1: Update API URL in Render

### Step 1: Find Your Backend URL

1. Go to Render Dashboard
2. Click on your **backend service** (the Python/Django one)
3. Look at the top - copy the URL (e.g., `https://pixeltales-backend.onrender.com`)

### Step 2: Update Admin Environment Variable

1. Go back to your **admin static site**
2. Click **"Environment"**
3. Find `VITE_API_URL`
4. Click **"Edit"** or the pencil icon
5. Update to: `https://YOUR-ACTUAL-BACKEND.onrender.com/api`
6. Click **"Save Changes"**

### Step 3: Redeploy

After updating the environment variable:
1. Click **"Manual Deploy"** → **"Clear build cache & deploy"**
2. Wait 2-3 minutes for rebuild
3. Test login again

---

## 🔍 Check 2: Verify Admin User Exists on Render Database

Your local admin credentials work locally because they're in your **local database**.

But the deployed admin connects to your **Render PostgreSQL database**.

### Test if Admin User Exists:

1. **Go to your backend service** on Render
2. **Click "Shell"** (to open terminal)
3. **Run this command:**

```bash
python manage.py shell
```

Then in the Python shell:

```python
from django.contrib.auth.models import User

# Check if admin exists
admin_users = User.objects.filter(is_superuser=True)
print(f"Found {admin_users.count()} admin users:")
for user in admin_users:
    print(f"  - {user.username} ({user.email})")
```

---

## 🔧 Fix 2: Create Admin User on Render Database

If no admin user exists on Render, create one:

### Method A: Using Render Shell

1. **Go to backend service** on Render
2. **Click "Shell"**
3. **Run:**

```bash
python manage.py createsuperuser
```

Follow the prompts:
```
Username: admin
Email: admin@yourdomain.com
Password: [enter secure password]
Password (again): [confirm password]
```

### Method B: Using the `create_admin.py` Script

If you have the script in your repo:

```bash
python create_admin.py
```

And follow the prompts.

---

## 🔍 Check 3: Test Backend API Connection

### Test from Browser Console:

1. **Open your admin page** on Render
2. **Press F12** to open DevTools
3. **Go to "Console" tab**
4. **Run this:**

```javascript
fetch(import.meta.env.VITE_API_URL + '/admin/auth/login/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@test.com', password: 'test' })
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

**Expected responses:**

✅ **If backend is reachable:**
```json
{ "error": "Invalid credentials" }
```
(This is good - backend is responding!)

❌ **If backend is unreachable:**
```
Failed to fetch
CORS error
Network error
```
(This means API URL is wrong or CORS issue)

---

## 🔧 Fix 3: CORS Issue

If you see CORS errors in the browser console, the backend isn't allowing your admin domain.

### Verify in `backend/storybookapi/settings.py`:

```python
CORS_ALLOWED_ORIGINS = [
    # ... other origins ...
    'https://pixeltales-admin.onrender.com',  # ← Must include your admin URL
]

CSRF_TRUSTED_ORIGINS = [
    # ... other origins ...
    'https://pixeltales-admin.onrender.com',  # ← Must include your admin URL
]
```

If missing, add it and redeploy backend.

---

## 📋 Complete Troubleshooting Checklist

- [ ] **Check `VITE_API_URL` in Render** - Is it pointing to correct backend?
- [ ] **Update API URL if needed** - Use actual backend URL
- [ ] **Redeploy admin** after updating env variable
- [ ] **Check if admin user exists** on Render database
- [ ] **Create admin user** on Render if needed
- [ ] **Test API connection** from browser console
- [ ] **Check CORS settings** in backend
- [ ] **Verify backend is running** (not sleeping on free tier)
- [ ] **Clear browser cache** and try again

---

## 🎯 Most Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Login fails silently | Wrong API URL | Update `VITE_API_URL` in Render |
| "Invalid credentials" | Admin user doesn't exist on Render DB | Create superuser on Render |
| CORS error in console | Admin domain not in CORS settings | Add admin URL to backend settings |
| Network error | Backend is sleeping (free tier) | Wake up backend by visiting it |
| "Not Found" error | Wrong API endpoint | Check `/api/admin/auth/login/` exists |

---

## ✅ Expected Flow

**Correct Setup:**
```
Admin Page (Render)
  ↓ Login attempt
  ↓ POST to: https://pixeltales-backend.onrender.com/api/admin/auth/login/
  ↓ Backend validates credentials
  ↓ Checks: Render PostgreSQL database
  ↓ Returns: JWT token
  ↓ Admin dashboard loads
```

**Your Current Setup (Likely):**
```
Admin Page (Render)
  ↓ Login attempt
  ↓ POST to: https://your-backend-app.onrender.com/api/...  ❌ Wrong URL!
  ↓ Request fails
  ↓ Login doesn't work
```

---

## 🚀 Quick Fix Steps

1. **Get your backend URL** from Render dashboard
2. **Update `VITE_API_URL`** in admin site environment
3. **Redeploy admin**
4. **Create admin user** on Render database (if needed)
5. **Test login** with new credentials

---

**Need help?** Let me know:
1. What's your backend URL?
2. What does `VITE_API_URL` currently say in Render?
3. Any errors in browser console when you try to login?
