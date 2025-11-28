# ✅ Quick Fix Checklist - Redirect Loop

## What Happened
Your backend is deployed but shows "Too many redirects" error.

## Root Cause
Django was forcing HTTPS redirect, but Render already handles HTTPS via proxy, causing a redirect loop.

## The Fix (Already Applied)
✅ Updated `backend/storybookapi/settings.py`
✅ Disabled SSL redirect when running on Render
✅ Render's proxy handles HTTPS automatically

---

## Steps to Deploy the Fix

### 1. Push to GitHub
```bash
git add backend/storybookapi/settings.py
git commit -m "Fix SSL redirect loop on Render"
git push origin main
```

### 2. Wait for Render to Deploy
- Render detects the push automatically
- Builds and deploys (3-5 minutes)
- Watch "Logs" tab in Render dashboard

### 3. Test Your Backend
Visit: `https://pixeltales-backend.onrender.com/api/`

**You should see:**
- ✅ JSON response (API working)
- ❌ NOT "too many redirects" error

---

## Additional Check: Environment Variables

While waiting, verify these in Render Dashboard → Environment:

**Required:**
```
DEBUG=False
RENDER=True
ALLOWED_HOSTS=pixeltales-backend.onrender.com
```

**If RENDER is not set:**
1. Add it: `RENDER=True`
2. Save
3. Service will restart

---

## After Fix is Deployed

### Test These URLs:

**1. API Root:**
```
https://pixeltales-backend.onrender.com/api/
```
Expected: JSON response

**2. Admin Panel:**
```
https://pixeltales-backend.onrender.com/admin/
```
Expected: Django admin login page

**3. Registration Endpoint:**
```
https://pixeltales-backend.onrender.com/api/auth/register/
```
Expected: "Method not allowed" or form (means it's working)

---

## Next Steps After Backend is Working

1. ✅ Backend deployed and accessible
2. 💾 Add persistent disk (for database)
3. 👤 Create admin user
4. 🧪 Test API endpoints
5. 📱 Update frontend and build APK

---

## If Still Not Working

### Check Render Logs
Look for:
- ✅ "Starting server..."
- ✅ "Listening on 0.0.0.0:10000"
- ❌ Any error messages

### Check Environment Variables
Ensure these are set:
- `DEBUG=False`
- `RENDER=True`
- `ALLOWED_HOSTS=your-actual-url.onrender.com`

### Manual Deploy
If auto-deploy doesn't trigger:
1. Render Dashboard
2. Click "Manual Deploy"
3. Click "Clear build cache & deploy"

---

## Success Indicators

✅ No redirect loop error
✅ Can access `/api/` endpoint
✅ Can access `/admin/` panel
✅ Logs show "Starting server"
✅ Status is "Live" (green)

---

**Estimated Time:** 5 minutes (3 min build + 2 min testing)
