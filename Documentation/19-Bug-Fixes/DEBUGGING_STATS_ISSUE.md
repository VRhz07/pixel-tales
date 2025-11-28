# Debugging Stats Display Issue

## Problem
Stats (likes, comments, views) show as 0 initially and only update when clicked. After refreshing, they show 0 again.

## Steps to Debug

### 1. Check Browser Console
Open the story reader page and check the browser console (F12) for these log messages:

1. **Story Detail Response:**
   ```
   📦 Story detail response: {...}
   📖 Extracted story data: {...}
   📊 Story interaction counts: { likes_count: X, comments_count: Y, views: Z, is_liked_by_user: boolean }
   ```
   
2. **Initial Stats from API:**
   ```
   📊 Initial stats from API: { likes_count: X, comments_count: Y, views: Z, is_liked_by_user: boolean }
   ```

3. **Stats Fetch Attempt:**
   ```
   🔄 Fetching interaction stats for story: [id]
   ✅ Fetched interaction stats: {...}
   OR
   ❌ Failed to fetch interaction stats: [error]
   ```

### 2. What to Look For

**If you see `likes_count: undefined` or `null`:**
- The backend serializer isn't returning the counts
- Check if the Story model has the `likes` relationship properly defined
- Verify the serializer methods are being called

**If you see `likes_count: 0` but you know there are likes:**
- The database might not have any Like records
- Check if likes are being saved to the database when you click the like button
- Verify the relationship between Story and Like models

**If you see the correct counts in console but 0 on screen:**
- There's a state update issue in React
- Check if the state is being reset somewhere

### 3. Quick Fixes to Try

#### Option A: Restart Backend Server
The new `/stats/` endpoint requires a server restart:
```bash
cd backend
python manage.py runserver
```

#### Option B: Verify Database Has Likes/Comments
Check if the database actually has likes and comments for the story:
```python
# In Django shell
python manage.py shell

from storybook.models import Story, Like, Comment

story = Story.objects.get(id=YOUR_STORY_ID)
print(f"Likes: {story.likes.count()}")
print(f"Comments: {story.comments.count()}")
print(f"Views: {story.views}")
```

#### Option C: Test the Stats Endpoint Directly
Test if the stats endpoint works:
```bash
# Replace YOUR_STORY_ID with actual story ID
curl http://localhost:8000/api/stories/YOUR_STORY_ID/stats/
```

Expected response:
```json
{
  "success": true,
  "likes_count": 2,
  "comments_count": 1,
  "views": 10,
  "downloads_count": 0,
  "is_liked_by_user": false
}
```

### 4. Common Issues and Solutions

#### Issue 1: Stats endpoint returns 404
**Solution:** The backend server needs to be restarted to pick up the new URL route.

#### Issue 2: Serializer returns null for counts
**Cause:** The `get_likes_count()` method might be failing
**Solution:** Check if the Story model has a `likes` related name:
```python
# In models.py
class Like(models.Model):
    story = models.ForeignKey(Story, on_delete=models.CASCADE, related_name='likes')
    # ...
```

#### Issue 3: Stats show 0 even though database has records
**Cause:** The serializer context might not be passed correctly
**Solution:** Verify the view passes `context={'request': request}` to the serializer

#### Issue 4: Stats reset to 0 on page refresh
**Cause:** The initial API response doesn't include the counts
**Solution:** Check the StorySerializer fields list includes the count fields

### 5. Temporary Workaround

If the stats endpoint isn't working yet, the story detail API should still return the counts. The issue might be that the counts are being reset somewhere. 

Check if this line in StoryReaderPage.tsx is working:
```typescript
setLikeCount(apiStory.likes_count || 0);
```

If `apiStory.likes_count` is undefined, it will default to 0.

### 6. Testing Checklist

- [ ] Backend server is running
- [ ] Story has likes/comments in database
- [ ] Browser console shows correct counts in API response
- [ ] Stats endpoint returns 200 (not 404)
- [ ] No JavaScript errors in console
- [ ] React state is being updated (check React DevTools)

### 7. Expected Behavior After Fix

1. **On page load:** Stats display immediately with correct counts
2. **After clicking like:** Count increments immediately
3. **After page refresh:** Stats still show correct counts
4. **After another user likes:** Stats update within 10 seconds (auto-refresh)

## Next Steps

1. Open the story reader page
2. Open browser console (F12)
3. Look for the log messages listed above
4. Share the console output if the issue persists

The detailed logging will help identify exactly where the problem is occurring.
