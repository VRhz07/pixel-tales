# 🔍 Word Search Games Troubleshooting Guide

## Issue: Word Search Games Not Generated on Render

### Why This Happens
The `build.sh` script runs during deployment and should:
1. Delete old 12x12 word search games
2. Generate new 8x8 child-friendly word searches
3. But if there's an error, it continues silently

---

## ✅ What Was Fixed

### 1. Updated `build.sh`
- Removed silent error catching (`|| echo "Warning..."`)
- Added verification step to show game counts after generation
- Now shows exact numbers of games created

### 2. Changes Made:
```bash
# Before: Errors were silently caught
python manage.py generate_all_games --regenerate || echo "Warning..."

# After: Errors will show up clearly
python manage.py generate_all_games --regenerate

# Added: Verification step
echo "Verifying game generation..."
python manage.py shell -c "from storybook.models import StoryGame; ..."
```

---

## 🚀 Solution 1: Deploy with Updated build.sh

### Steps:
1. **Commit the updated `build.sh`**:
   ```bash
   git add backend/build.sh
   git commit -m "Fix: Improve word search game generation in build.sh"
   git push
   ```

2. **Render will auto-deploy** and run the new build script

3. **Check Render logs** for output:
   ```
   Generating educational games for published stories...
   ✅ [Story Name]: Created 3 games (quiz, fill_blanks, word_search)
   
   Verifying game generation...
   Word Search Games: 15
   Quiz Games: 15
   Fill Blanks Games: 15
   ```

---

## 🛠️ Solution 2: Manual Regeneration Script

If the build script didn't work, use the manual script:

### On Render (via Shell):
1. Go to **Render Dashboard** → Your Backend Service
2. Click **Shell** tab
3. Run:
   ```bash
   python regenerate_word_searches.py
   ```

### Locally (then sync):
1. Run locally:
   ```bash
   cd backend
   python regenerate_word_searches.py
   ```
2. This will regenerate all word searches in your local DB
3. Then deploy to Render

---

## 🔍 Verify Games Exist

### Method 1: Render Shell
```bash
# In Render Shell tab
python manage.py shell

# Then in Python shell:
from storybook.models import StoryGame
ws_count = StoryGame.objects.filter(game_type='word_search').count()
print(f"Word Search Games: {ws_count}")

# Check a sample game
sample = StoryGame.objects.filter(game_type='word_search').first()
if sample:
    print(f"Sample: {sample.story.title}")
    print(f"Questions: {sample.questions.count()}")
```

### Method 2: Django Admin
1. Go to your admin panel: `https://your-backend.onrender.com/admin/`
2. Login
3. Navigate to **Story Games**
4. Filter by **Game Type: Word Search**
5. Should see games listed

### Method 3: API Check
```bash
# Check games for a specific story
curl https://your-backend.onrender.com/api/games/story/1/
```

---

## 📋 Common Issues & Solutions

### Issue 1: "No published stories found"
**Cause**: No stories are marked as published
**Solution**: 
- Publish at least one story from the admin panel
- Then run: `python regenerate_word_searches.py`

### Issue 2: "Content too short"
**Cause**: Story has less than 100 characters of text
**Solution**: 
- Stories need at least 5 pages with meaningful text
- Add more content to the story

### Issue 3: "Failed to generate word search"
**Cause**: Not enough unique words (3-6 letters) in the story
**Solution**: 
- Story needs diverse vocabulary
- Check story content has varied words, not just repetitive text

### Issue 4: Games generated but not showing in frontend
**Cause**: Frontend caching or API issue
**Solution**:
- Clear browser cache
- Check API endpoint: `/api/games/story/<story_id>/`
- Verify story ID is correct

---

## 🎯 Expected Results

### After Successful Generation:
- **Word Search Games**: One per published story
- **Grid Size**: 8x8 (child-friendly)
- **Words**: 3-5 words from the story
- **Directions**: Horizontal and vertical only (no diagonals)
- **Word Length**: 3-6 letters

### Sample Game Structure:
```json
{
  "game_type": "word_search",
  "story": 1,
  "difficulty": "medium",
  "questions": [
    {
      "question_text": "Find all the hidden words from the story in the grid",
      "question_type": "word_search",
      "correct_answer": "CAT,DOG,BIRD,FISH,FROG",
      "options": ["CATDOGZX", "BIRDYQWE", ...],  // 8x8 grid
      "context": "Words to find: CAT, DOG, BIRD, FISH, FROG",
      "hint": "Words can be horizontal or vertical"
    }
  ]
}
```

---

## 🔧 Manual Database Check

### Check if games exist in database:
```bash
# Render Shell
python manage.py dbshell

# Then in SQL:
SELECT game_type, COUNT(*) 
FROM storybook_storygame 
GROUP BY game_type;

# Should show:
# game_type     | count
# --------------+-------
# quiz          |    15
# fill_blanks   |    15
# word_search   |    15
```

---

## 📝 Build Script Flow

Understanding what happens during deployment:

1. ✅ Install dependencies
2. ✅ Run migrations
3. ✅ Create superuser
4. ✅ Populate achievements
5. ⚠️ **Delete old word searches** (`update_word_searches --force`)
6. ⚠️ **Generate new games** (`generate_all_games --regenerate`)
   - Creates quiz games
   - Creates fill-in-the-blank games
   - **Creates word search games**
7. ✅ Verify game counts (NEW!)

---

## 🚨 If Nothing Works

### Last Resort: Force Regeneration via API

Create a temporary admin endpoint:

1. Add to `backend/storybook/admin_views.py`:
```python
@require_http_methods(["POST"])
def regenerate_games(request):
    """Admin endpoint to force regenerate all games"""
    if not request.user.is_staff:
        return JsonResponse({'error': 'Admin only'}, status=403)
    
    from .game_service import GameGenerationService
    from .models import Story, StoryGame
    
    # Delete all games
    StoryGame.objects.all().delete()
    
    # Regenerate
    stories = Story.objects.filter(is_published=True)
    for story in stories:
        GameGenerationService.generate_games_for_story(story)
    
    return JsonResponse({'success': True, 'regenerated': stories.count()})
```

2. Add to `urls.py`:
```python
path('admin/regenerate-games/', regenerate_games, name='regenerate_games'),
```

3. Call from browser or curl:
```bash
curl -X POST https://your-backend.onrender.com/api/admin/regenerate-games/ \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## 📚 Files Modified

- ✅ `backend/build.sh` - Improved error handling and verification
- ✅ `backend/regenerate_word_searches.py` - Manual regeneration script (NEW)
- ✅ `backend/WORD_SEARCH_TROUBLESHOOTING.md` - This guide (NEW)

---

## ✅ Quick Checklist

After deploying, verify:
- [ ] Build logs show "Generating educational games..."
- [ ] Build logs show "Word Search Games: X" (X > 0)
- [ ] Can access admin panel and see word search games
- [ ] Frontend shows games when clicking "Play Games" on a story
- [ ] Games have 8x8 grid (not 12x12)
- [ ] Words are 3-6 letters (child-friendly)

---

## 🆘 Still Having Issues?

Check these common mistakes:

1. **No published stories**: Mark stories as published in admin
2. **Stories too short**: Need 5+ pages with text
3. **Build script not running**: Check Render deployment logs
4. **Database not updated**: Migrations might have failed
5. **Frontend cache**: Clear browser cache and hard refresh

---

**Summary**: The `build.sh` now properly generates word search games during deployment. If they're still missing, use the `regenerate_word_searches.py` script to manually create them. 🎮
