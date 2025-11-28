# 🔧 Render.com Repository Not Visible - Solutions

## Common Causes & Solutions

### Solution 1: Grant Render Access to Your Repository

#### Step-by-Step:

1. **In Render Dashboard:**
   - Look for "Connect a repository" or "GitHub" button
   - You should see a link that says **"Configure GitHub App"** or similar
   - Click it

2. **In GitHub Settings:**
   - This opens GitHub → Settings → Applications → Render
   - Under **"Repository access"**, you'll see:
     - ⚪ All repositories
     - ⚪ Only select repositories
   
3. **Grant Access:**
   - If "Only select repositories" is selected:
     - Click **"Select repositories"** dropdown
     - Find and check your `pixel-tales` repository
   - Or choose **"All repositories"** (easier)
   
4. **Save:**
   - Click **"Save"** at the bottom
   - Go back to Render dashboard
   - Refresh the page
   - Your repository should now appear!

---

### Solution 2: Direct GitHub App Configuration

If you can't find the link in Render:

1. **Go directly to GitHub:**
   - Visit: https://github.com/settings/installations
   
2. **Find Render:**
   - Look for "Render" in the list of installed apps
   - Click **"Configure"** next to Render
   
3. **Update Repository Access:**
   - Scroll to **"Repository access"**
   - Select your repository
   - Click **"Save"**
   
4. **Return to Render:**
   - Go back to Render dashboard
   - Refresh the page (Ctrl+F5)
   - Try creating Blueprint again

---

### Solution 3: Use Manual Web Service Instead

If Blueprint still doesn't work, use Manual Web Service (works the same way):

1. **In Render Dashboard:**
   - Click **"New +"** → **"Web Service"**
   
2. **Connect Repository:**
   - Click **"Connect a repository"**
   - You should see your repository now
   - If not, click **"Configure account"** to grant access
   
3. **Manual Configuration:**
   Fill in these settings:
   
   | Field | Value |
   |-------|-------|
   | **Name** | `pixeltales-backend` |
   | **Region** | Oregon (Free) |
   | **Branch** | `main` |
   | **Root Directory** | `backend` |
   | **Environment** | Python 3 |
   | **Build Command** | `./build.sh` |
   | **Start Command** | `daphne -b 0.0.0.0 -p $PORT storybookapi.asgi:application` |
   | **Plan** | Free |
   
4. **Click "Create Web Service"**

Then follow the same steps for Environment Variables and Disk!

---

### Solution 4: Check Repository Visibility

Make sure your repository isn't private without Render access:

1. **Go to your GitHub repository**
2. Click **Settings** tab
3. Check if it's **Private** or **Public**
4. If Private:
   - Make sure Render has access (Solution 1 or 2 above)
   - Or temporarily make it Public for testing

---

### Solution 5: Reinstall Render GitHub App

If nothing works:

1. **Remove Render from GitHub:**
   - Go to: https://github.com/settings/installations
   - Find Render
   - Click "Configure"
   - Scroll down and click **"Uninstall"**
   
2. **Reconnect in Render:**
   - Go to Render dashboard
   - Try to connect repository again
   - Render will ask to install GitHub app again
   - This time, grant access to all repositories or select your repo
   
3. **Complete installation**
4. **Try Blueprint again**

---

## Visual Guide

### What You Should See:

**In Render (Connect Repository):**
```
Connect a repository
┌─────────────────────────────────┐
│ 🔍 Search repositories...       │
├─────────────────────────────────┤
│ ✓ pixel-tales                   │  ← Should appear here
│   main branch                   │
│                                 │
│ ✓ other-repo                    │
└─────────────────────────────────┘

Can't find your repo? → Configure GitHub App
```

**In GitHub (Repository Access):**
```
Repository access
  ⚪ All repositories
  ⚪ Only select repositories  ← Select this
     ┌────────────────────┐
     │ ✓ pixel-tales      │  ← Check your repo
     │ ☐ other-repo       │
     └────────────────────┘
     
[Save] button at bottom
```

---

## Still Not Working?

### Alternative: Deploy Without Blueprint

You can deploy without Blueprint feature - it's just as good!

1. Use **"Web Service"** instead of Blueprint
2. Manually enter configuration (see Solution 3 above)
3. Add Environment Variables manually
4. Add Disk manually
5. Deploy works exactly the same way!

**Blueprint is just a shortcut that reads `render.yaml`**

---

## Quick Checklist

Before trying again:

- [ ] Repository is pushed to GitHub
- [ ] Repository contains `backend/render.yaml`
- [ ] Render GitHub App is installed
- [ ] Render has access to your repository
- [ ] You refreshed Render dashboard page
- [ ] You're signed in with the correct GitHub account

---

## Contact Points

If still stuck:

1. **Render Support:** https://render.com/support
2. **Render Docs:** https://render.com/docs/deploy-django
3. **Alternative:** Use Manual Web Service (Solution 3)

---

## Summary

**Most Common Fix:**
Go to https://github.com/settings/installations → Configure Render → Grant repository access → Refresh Render

**Easiest Alternative:**
Use "Web Service" instead of "Blueprint" - works perfectly!
