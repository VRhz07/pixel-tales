# 🐙 GitHub Setup Guide

## Option 1: Create New Repository on GitHub (Recommended)

### Step 1: Create Repository on GitHub
1. Go to https://github.com
2. Click the **"+"** icon (top right) → **"New repository"**
3. Fill in details:
   - **Repository name**: `pixel-tales` (or any name you prefer)
   - **Description**: "AI-powered storytelling app for children"
   - **Visibility**: Private (recommended) or Public
   - **DO NOT** check "Initialize with README" (we already have one)
   - **DO NOT** add .gitignore or license
4. Click **"Create repository"**

### Step 2: Copy the Repository URL
After creating, GitHub will show you a page with setup instructions.
Copy your repository URL (should look like):
```
https://github.com/YOUR-USERNAME/pixel-tales.git
```

### Step 3: Add Remote and Push
```bash
# Add GitHub as remote
git remote add origin https://github.com/YOUR-USERNAME/pixel-tales.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## Option 2: Use Existing Repository

If you already have a repository:

```bash
# Add your repository as remote
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## Troubleshooting

### Authentication Required

If you see an authentication error, you have two options:

#### Option A: Use Personal Access Token (Recommended)
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name: "Pixel Tales Deployment"
4. Select scopes: `repo` (full control of private repositories)
5. Click "Generate token"
6. **Copy the token** (you won't see it again!)
7. Use token as password when pushing:
   ```bash
   Username: your-github-username
   Password: ghp_yourPersonalAccessToken
   ```

#### Option B: Use SSH
1. Generate SSH key:
   ```bash
   ssh-keygen -t ed25519 -C "your-email@example.com"
   ```
2. Add to GitHub: Settings → SSH and GPG keys → New SSH key
3. Use SSH URL instead:
   ```bash
   git remote set-url origin git@github.com:YOUR-USERNAME/pixel-tales.git
   git push -u origin main
   ```

---

### Push Rejected

If push is rejected:
```bash
# Force push (only for initial setup)
git push -u origin main --force

# Or pull first then push
git pull origin main --rebase
git push -u origin main
```

---

### Large Files Error

If you get "file too large" error:
```bash
# Check which files are large
git ls-files | xargs ls -lh | sort -k5 -hr | head -20

# Common culprits:
# - db.sqlite3 (should be in .gitignore) ✓
# - node_modules (should be in .gitignore) ✓
# - venv (should be in .gitignore) ✓
```

These are already in `.gitignore`, so you shouldn't have this issue!

---

## After Pushing Successfully

Your code is now on GitHub! ✅

You should see:
- ✅ All your files on GitHub
- ✅ README.md displaying on main page
- ✅ Complete history in commits

### Next Steps:
1. ✅ **Deploy to Render.com** → See `RENDER_DEPLOYMENT_STEPS.md`
2. 🔄 From now on, to push updates:
   ```bash
   git add .
   git commit -m "Your commit message"
   git push
   ```

---

## Useful Git Commands

```bash
# Check status
git status

# View commit history
git log --oneline

# Create new branch
git checkout -b feature-name

# Switch branches
git checkout main

# Pull latest changes
git pull

# Push changes
git push

# View remotes
git remote -v
```

---

## GitHub Repository Settings for Render

After pushing, Render.com will need access to your repository:

1. Make sure repository is accessible
2. If private, authorize Render.com when connecting
3. Render will auto-deploy on every push to main branch

---

**Repository URL Pattern:**
```
https://github.com/YOUR-USERNAME/pixel-tales
```

**Clone URL Pattern:**
```
https://github.com/YOUR-USERNAME/pixel-tales.git
```

Save these - you'll need them for Render.com deployment!
