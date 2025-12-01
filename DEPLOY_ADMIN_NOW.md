# Deploy Admin Dashboard to Render - Quick Guide

## ✅ Fix Complete
The build issue has been resolved. The admin build now correctly creates `index.html`.

## Deployment Steps

### Option 1: Automatic Deployment (Recommended)
If your Render service is connected to Git:

1. **Commit the fix:**
   ```bash
   git add frontend/rename-admin-build.js
   git commit -m "Fix admin build: Convert rename script to ES module"
   git push
   ```

2. **Render will automatically:**
   - Detect the push
   - Run the build command: `cd frontend && npm install && npm run build:admin`
   - Deploy `frontend/dist-admin` with the correct `index.html`

3. **Visit:** `https://pixeltales-admin.onrender.com`

### Option 2: Manual Deployment
If auto-deploy is disabled:

1. Commit and push the fix (see above)
2. Go to Render dashboard → Your admin service
3. Click "Manual Deploy" → "Deploy latest commit"
4. Wait for build to complete

## What Was Fixed
- ✅ `rename-admin-build.js` now uses ES Module syntax (was CommonJS)
- ✅ Build process creates `index.html` (not `index.admin.html`)
- ✅ Admin dashboard will load at the correct URL

## Verify Deployment
After deployment completes:
1. Visit `https://pixeltales-admin.onrender.com`
2. You should see the **Admin Dashboard login page** (not the main app)
3. Login with your admin credentials

## Build Configuration
**File:** `admin-render.yaml`
- Build Command: `cd frontend && npm install && npm run build:admin`
- Publish Path: `./frontend/dist-admin`
- Routes: All paths redirect to `/index.html` (SPA routing)

## Troubleshooting
If you still see the main app instead of admin dashboard:
1. Check Render logs for build errors
2. Verify the build command ran successfully
3. Check that `dist-admin/index.html` was created (not `index.admin.html`)
4. Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
