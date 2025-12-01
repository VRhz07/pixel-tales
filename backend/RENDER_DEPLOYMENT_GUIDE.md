# Render Deployment Guide - Sync Database Changes & Profanity Words

This guide covers deploying the latest changes (XP system, collaborations, profanity words) to Render.

---

## 📋 What We're Deploying

1. ✅ New database migration (XP system)
2. ✅ Profanity words from local database
3. ✅ All backend code changes

---

## Part 1: Prepare Local Database Export

### Step 1: Export Profanity Words from Local Database

```bash
cd backend
python export_profanity_words.py
```

This creates `profanity_words_export.json` with all your profanity words.

**Expected Output:**
```
📤 Exporting profanity words from local database...

✅ Export complete!
   File: profanity_words_export.json
   Total words: 55

📊 Breakdown by language:
   English: 27 words
   Tagalog: 28 words

📊 Breakdown by severity:
   Mild: 0 words
   Moderate: 55 words
   Severe: 0 words
```

---

## Part 2: Deploy to Render

### Step 2: Push Code to Git

```bash
# Make sure you're in the root directory
git add .
git commit -m "Add XP system, collaborations, and profanity words sync"
git push origin main
```

### Step 3: Deploy on Render

Render will automatically deploy when you push to main branch.

**Monitor the deploy:**
1. Go to https://render.com
2. Open your backend service
3. Click on "Logs" tab
4. Watch for deployment progress

**Wait for:**
- ✅ Build successful
- ✅ Migrations applied
- ✅ Service started

---

## Part 3: Run Migrations on Render

### Step 4: Run Migrations via Render Shell

**Option A: Via Render Dashboard**
1. Go to your backend service on Render
2. Click "Shell" tab
3. Run migration command:
```bash
python manage.py migrate
```

**Option B: Via Render CLI (if installed)**
```bash
render shell <your-service-name>
python manage.py migrate
```

**Expected Output:**
```
Running migrations:
  Applying storybook.0022_userprofile_experience_level... OK
```

---

## Part 4: Import Profanity Words to Render

### Step 5: Upload Export File to Render

**Method 1: Copy-Paste via Shell (Recommended)**

1. Open `profanity_words_export.json` in your text editor
2. Copy the entire content
3. Go to Render Shell for your backend service
4. Create the file:
```bash
cat > profanity_words_export.json << 'EOF'
# Paste your JSON content here
EOF
```

**Method 2: Upload via SCP (if you have SSH access)**
```bash
scp profanity_words_export.json user@your-render-service:/path/
```

**Method 3: Add to Git and Deploy**
```bash
# Add export file to git
git add backend/profanity_words_export.json
git commit -m "Add profanity words export"
git push origin main
```

### Step 6: Run Import Script on Render

In Render Shell:
```bash
cd /opt/render/project/src/backend
python import_profanity_words.py
```

**Expected Output:**
```
📥 Importing profanity words from profanity_words_export.json...

📋 Found 55 words in export file
   Exported at: 2024-XX-XX...

  ✅ Added: fuck
  ✅ Added: shit
  ... (continues for all words)

✅ Import complete!
   Added: 55 words
   Updated: 0 words
   Skipped: 0 words
   Total in database: 55 words
```

---

## Part 5: Verify Deployment

### Step 7: Test the API Endpoints

**Test 1: Check Migrations**
```bash
curl https://your-app.onrender.com/api/auth/profile/
```

Should include new fields:
```json
{
  "experience_points": 0,
  "level": 1,
  "xp_for_next_level": 500,
  ...
}
```

**Test 2: Check Profanity Words**
```bash
curl https://your-app.onrender.com/api/profanity/active/
```

Should return list of profanity words.

**Test 3: Create Story and Check XP**
1. Create a story via API or frontend
2. Check user profile
3. Verify XP increased by 100

**Test 4: Check Collaborations**
```bash
curl https://your-app.onrender.com/api/achievements/progress/
```

Should include `collaboration_count` in user_stats.

---

## Part 6: Backfill XP for Existing Users (Optional)

If you want to award XP to existing users based on their current activity:

### Step 8: Run Backfill Script on Render

In Render Shell:
```bash
python manage.py shell
```

Then in the Python shell:
```python
from django.contrib.auth.models import User
from storybook.models import Story

# Backfill XP for all users
for user in User.objects.all():
    profile = user.profile
    
    # Count user's activity
    story_count = Story.objects.filter(author=user).count()
    published_count = Story.objects.filter(author=user, is_published=True).count()
    collab_count = Story.objects.filter(is_collaborative=True, authors=user).count()
    
    # Calculate XP to award
    xp_to_award = (story_count * 100) + (published_count * 50) + (collab_count * 50)
    
    if xp_to_award > 0:
        profile.add_experience(xp_to_award)
        print(f"✅ {user.username}: +{xp_to_award} XP (Level {profile.level})")

exit()
```

---

## Quick Reference: All Commands

### On Local Machine:
```bash
# 1. Export profanity words
cd backend
python export_profanity_words.py

# 2. Push to Git
git add .
git commit -m "Sync database changes and profanity words"
git push origin main
```

### On Render (via Shell):
```bash
# 1. Run migrations
python manage.py migrate

# 2. Import profanity words (after uploading JSON file)
python import_profanity_words.py

# 3. (Optional) Backfill XP
python manage.py shell
# Then run the backfill script above
```

---

## Troubleshooting

### Issue: Migration Already Applied
If you see "No migrations to apply":
```bash
python manage.py showmigrations
```
Check if `0022_userprofile_experience_level` is marked [X].

### Issue: Import File Not Found
Make sure `profanity_words_export.json` is in the same directory:
```bash
ls -la profanity_words_export.json
```

### Issue: Permission Denied
Make sure you're in the correct directory:
```bash
cd /opt/render/project/src/backend
```

### Issue: XP Not Showing in API
1. Check migration was applied
2. Restart Render service
3. Clear any API caches

### Issue: Profanity Words Not Working
1. Verify import completed successfully
2. Check words are active: `ProfanityWord.objects.filter(is_active=True).count()`
3. Test API endpoint: `/api/profanity/active/`

---

## Alternative: One-Command Sync Script

Create `backend/sync_to_render.sh`:

```bash
#!/bin/bash
echo "🚀 Syncing to Render..."

# Export profanity words
echo "📤 Exporting profanity words..."
python export_profanity_words.py

# Add to git
echo "📦 Adding to git..."
git add .
git add profanity_words_export.json

# Commit
echo "💾 Committing..."
git commit -m "Sync: XP system, collaborations, profanity words"

# Push
echo "🔄 Pushing to Render..."
git push origin main

echo "✅ Code pushed! Now run these commands in Render Shell:"
echo ""
echo "  python manage.py migrate"
echo "  python import_profanity_words.py"
echo ""
echo "Done! 🎉"
```

Make it executable:
```bash
chmod +x sync_to_render.sh
```

Run it:
```bash
./sync_to_render.sh
```

---

## Verification Checklist

After deployment, verify:

- [ ] Render build completed successfully
- [ ] Migration 0022 applied
- [ ] XP fields appear in user profile API
- [ ] Profanity words imported (check count)
- [ ] Create story awards 100 XP
- [ ] Publish story awards 50 XP
- [ ] XP doesn't decrease when deleting content
- [ ] Collaborations count shows in profile
- [ ] Days active calculation is correct
- [ ] Frontend displays XP and level correctly

---

## Post-Deployment Testing

### Test Scenario 1: New User Journey
1. Create new account
2. Check Days Active = 0
3. Create a story → Check XP = 100
4. Publish story → Check XP = 150
5. Delete story → Check XP still = 150 ✅

### Test Scenario 2: Profanity Filter
1. Try to create story with profanity word
2. Should be blocked/filtered
3. Check admin profanity management works

### Test Scenario 3: Collaboration
1. Start collaborative session
2. Save collaborative story
3. Check collaboration count increased
4. Check XP awarded

---

## Important Notes

1. **Backup First**: Always backup Render database before major migrations
2. **Test Locally**: Test all changes locally before deploying
3. **Monitor Logs**: Watch Render logs during deployment
4. **Gradual Rollout**: Consider deploying during low-traffic hours
5. **Rollback Plan**: Know how to rollback if issues occur

---

## Need Help?

If you encounter issues:
1. Check Render logs for errors
2. Verify migration files are in git
3. Ensure environment variables are set
4. Test endpoints one by one
5. Check database connections

---

## Summary

✅ **Local Steps:**
1. Export profanity words
2. Commit and push to git

✅ **Render Steps:**
1. Wait for auto-deploy
2. Run migrations
3. Import profanity words
4. (Optional) Backfill XP

✅ **Verify:**
- XP system working
- Profanity words active
- Collaborations tracking
- Days active correct

---

Good luck with the deployment! 🚀
