# 🔧 Fix: "Too Many Redirects" Error on Render

## Problem

When visiting your Render URL, you see:
```
This page isn't working
pixeltales-backend.onrender.com redirected you too many times.
ERR_TOO_MANY_REDIRECTS
```

## Cause

This happens when:
1. ❌ `ALLOWED_HOSTS` doesn't include your Render domain
2. ❌ SSL redirect is enabled but Render already handles HTTPS
3. ❌ `DEBUG=False` with incorrect ALLOWED_HOSTS

## Solution

### Fix 1: Update ALLOWED_HOSTS Environment Variable

**In Render Dashboard:**

1. Go to your service
2. Click **"Environment"** tab
3. Find `ALLOWED_HOSTS` variable
4. Update to:

```
ALLOWED_HOSTS=pixeltales-backend.onrender.com
```

**Replace `pixeltales-backend` with YOUR actual service name!**

**Alternative (allow all - for testing):**
```
ALLOWED_HOSTS=*
```

### Fix 2: Disable SSL Redirect (Render handles this)

The issue is in our settings.py - SSL redirect conflicts with Render's proxy.

**We need to update the code:**

In `backend/storybookapi/settings.py`, the security settings should NOT force SSL redirect on Render.

**Current code has:**
```python
if not DEBUG:
    SECURE_SSL_REDIRECT = True  # This causes the loop!
```

**Should be:**
```python
if not DEBUG and not RENDER:
    SECURE_SSL_REDIRECT = True
```

### Fix 3: Verify RENDER Environment Variable

**In Render Dashboard → Environment:**

Make sure you have:
```
RENDER=True
```

This tells Django it's running on Render and not to force SSL redirect.

---

## Quick Fix Steps

### Step 1: Check Your Environment Variables

In Render Dashboard → Environment, verify these are set:

```
DEBUG=False
RENDER=True
ALLOWED_HOSTS=your-app-name.onrender.com
```

### Step 2: Update Settings.py (I'll do this for you)

The code needs to be fixed to prevent SSL redirect on Render.

### Step 3: Push Updated Code

After I fix the code:
```bash
git add backend/storybookapi/settings.py
git commit -m "Fix SSL redirect loop on Render"
git push origin main
```

Render will auto-deploy the fix.

---

## Verification

After fixing, you should be able to visit:
```
https://pixeltales-backend.onrender.com/
```

And see Django's default page or API response (not redirect loop).

---

## What You Should See

**Root URL (/):**
```
https://pixeltales-backend.onrender.com/
```
- Should show Django debug page or 404 (normal)

**API URL (/api/):**
```
https://pixeltales-backend.onrender.com/api/
```
- Should show JSON response from your API

**Admin URL (/admin/):**
```
https://pixeltales-backend.onrender.com/admin/
```
- Should show Django admin login page

---

## Temporary Workaround

While waiting for fix, you can test if backend is running:

**Check Render Logs:**
1. Go to Render dashboard
2. Click "Logs" tab
3. Look for "Starting server..." or "Listening on..."

**Check specific endpoint:**
Try the API endpoint directly:
```
https://pixeltales-backend.onrender.com/api/auth/register/
```

If you see "Method not allowed" (405), backend is running but root URL has redirect issue.

---

## Prevention

The fix ensures:
- ✅ Render handles HTTPS/SSL (we don't force it)
- ✅ ALLOWED_HOSTS includes your domain
- ✅ RENDER=True disables conflicting security settings
- ✅ No redirect loops

---

Let me fix the code now!
