# Quick Sync Checklist - Deploy to Render

## ⚡ Fast Track (Use Script)

```bash
cd backend
chmod +x sync_to_render.sh
./sync_to_render.sh
```

Then follow the instructions printed by the script.

---

## 📝 Manual Steps (If Script Doesn't Work)

### On Your Local Machine:

#### 1. Export Profanity Words
```bash
cd backend
python export_profanity_words.py
```
✅ Creates `profanity_words_export.json`

#### 2. Commit and Push
```bash
cd ..
git add .
git commit -m "Sync: XP system, collaborations, and profanity words"
git push origin main
```
✅ Triggers Render deployment

---

### On Render (Wait for Deploy to Finish First):

#### 3. Open Render Shell
- Go to https://dashboard.render.com
- Select your backend service
- Click "Shell" tab

#### 4. Run Migration
```bash
python manage.py migrate
```
✅ Expected: `Applying storybook.0022_userprofile_experience_level... OK`

#### 5. Import Profanity Words
```bash
python import_profanity_words.py
```
✅ Expected: `Added: 55 words` (or similar)

#### 6. Verify Everything Works
Test in browser or API:
```bash
# Check XP in user profile
curl https://your-app.onrender.com/api/auth/profile/

# Check profanity words
curl https://your-app.onrender.com/api/profanity/active/
```

---

## ✅ What Gets Synced

- ✅ XP system (experience_points, level fields)
- ✅ Collaborations tracking
- ✅ Days Active fix
- ✅ Profanity words from local database
- ✅ All code changes

---

## 🔍 Verify Success

### Test 1: Create Account
- Days Active should be 0 (not 700+)

### Test 2: Create Story
- Should gain 100 XP
- Level should update if crossing 500 XP threshold

### Test 3: Delete Story
- XP should NOT decrease (stays the same)

### Test 4: Check Profanity
- Try typing a profanity word
- Should be filtered

### Test 5: Collaboration
- Create collaborative story
- "Collaborations" count should increase

---

## ⚠️ Common Issues

### Issue: "No migrations to apply"
✅ Migration already ran - skip this step

### Issue: "File not found: profanity_words_export.json"
✅ Make sure file is in git:
```bash
git add backend/profanity_words_export.json
git commit -m "Add profanity export"
git push origin main
```

### Issue: XP not showing
✅ Clear browser cache and refresh

---

## 🎯 Quick Status Check

After deployment, check these:
- [ ] Render build succeeded
- [ ] Migration ran successfully
- [ ] Profanity words imported
- [ ] XP shows in profile API
- [ ] Frontend displays level and XP
- [ ] Collaborations show in profile
- [ ] Days active is correct

---

## 📞 Need Help?

Check these in order:
1. Render deployment logs
2. Render runtime logs
3. Browser console for frontend errors
4. Test API endpoints directly

---

That's it! The deployment should take about 5-10 minutes total.
