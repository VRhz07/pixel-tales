# 🔄 How to Manually Trigger Render Deployment

## Quick Steps to Force Redeploy

Since auto-deploy might not be enabled or the webhook didn't trigger, here's how to manually deploy:

---

## Option 1: Manual Deploy Button (Fastest)

1. **Go to Render Dashboard**: https://dashboard.render.com/
2. **Click on your admin static site** (`pixeltales-admin`)
3. **Look for "Manual Deploy" button** (top right or in the header)
4. **Click "Deploy latest commit"** or **"Clear build cache & deploy"**
5. **Wait 2-3 minutes** for the build to complete

---

## Option 2: Enable Auto-Deploy

If you want future pushes to automatically deploy:

1. **Go to your admin static site** in Render dashboard
2. **Click "Settings"** (left sidebar)
3. **Scroll to "Build & Deploy"** section
4. **Find "Auto-Deploy"** setting
5. **Toggle it to "Yes"** or **"Enabled"**
6. **Save changes**

Now every push to your branch will automatically deploy!

---

## Option 3: Push Empty Commit (If Manual Deploy Doesn't Work)

If you can't find the manual deploy button:

```bash
git commit --allow-empty -m "Trigger Render deploy"
git push origin main
```

This creates an empty commit that triggers Render's webhook.

---

## 🔍 How to Check if Auto-Deploy is Enabled

In Render dashboard → Your static site → Settings:

Look for:
- ✅ **Auto-Deploy: Yes** - Push triggers automatic deploy
- ❌ **Auto-Deploy: No** - Must manually deploy each time

---

## ⏳ What to Look For

After triggering deploy, you should see:

1. **"In Progress"** badge on your site
2. **Build logs** appearing in real-time
3. **"Building..."** status
4. **"Deploy live"** message when complete

---

## 📋 Verify the Build Includes _redirects

In the build logs, look for:

```
✓ built in [time]
dist-admin/index.html
dist-admin/_redirects     ← Should see this!
dist-admin/_headers       ← And this!
dist-admin/assets/...
```

If you see `_redirects` in the output, the fix worked!

---

## ✅ After Deployment Completes

1. **Clear browser cache**: Ctrl + Shift + R
2. **Visit**: `https://your-admin-name.onrender.com/admin`
3. **Should now work!** No more 404 errors

---

**Time to complete:** 2-3 minutes after clicking deploy
