# Complete Fix for Stats Display Issue

## The Problem
Stats (likes, comments, views) show as 0 initially and reset to 0 on page refresh, even though the database has the correct values.

## Root Cause
The stats are being returned from the backend API correctly, but there may be timing issues or the stats endpoint isn't available yet.

## Complete Solution

### Step 1: Restart Backend Server (CRITICAL)
The new `/stats/` endpoint was added but requires a server restart:

```bash
cd backend
# Stop the current server (Ctrl+C)
python manage.py runserver
```

### Step 2: Verify Stats Endpoint Works
Test the endpoint directly:

```bash
# Replace 1 with your actual story ID
curl http://localhost:8000/api/stories/1/stats/
```

Expected response:
```json
{
  "success": true,
  "likes_count": 2,
  "comments_count": 1,
  "views": 5,
  "downloads_count": 0,
  "is_liked_by_user": false
}
```

If you get a 404 error, the server wasn't restarted properly.

### Step 3: Clear Browser Cache
Sometimes React caches old API responses:

1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

OR

1. Press Ctrl+Shift+Delete
2. Clear cached images and files
3. Refresh the page

### Step 4: Check Browser Console
Open the story reader and check console for these logs:

**What you SHOULD see:**
```
📦 Story detail response: {...}
📖 Extracted story data: {...}
📊 Story interaction counts: { likes_count: 2, comments_count: 1, views: 5, is_liked_by_user: false }
📊 Initial stats from API: { likes_count: 2, comments_count: 1, views: 5, is_liked_by_user: false }
🔄 Fetching interaction stats for story: 1
✅ Fetched interaction stats: { likes_count: 2, comments_count: 1, ... }
```

**What indicates a problem:**
```
📊 Story interaction counts: { likes_count: undefined, comments_count: undefined, ... }
```
OR
```
❌ Failed to fetch interaction stats: 404
```

### Step 5: Verify Database Has Data
Check if likes/comments actually exist in the database:

```bash
cd backend
python manage.py shell
```

```python
from storybook.models import Story, Like, Comment

# Replace 1 with your story ID
story = Story.objects.get(id=1)
print(f"Story: {story.title}")
print(f"Likes: {story.likes.count()}")
print(f"Comments: {story.comments.count()}")
print(f"Views: {story.views}")

# List all likes
for like in story.likes.all():
    print(f"  - Liked by: {like.user.username}")

# List all comments
for comment in story.comments.all():
    print(f"  - Comment by {comment.author.username}: {comment.text[:50]}")
```

If counts are 0, the database doesn't have the data. You need to create likes/comments first.

## Testing the Fix

### Test 1: Initial Load
1. Open a story that has likes/comments
2. Stats should display immediately (not 0)
3. Check console for the log messages above

### Test 2: Page Refresh
1. Refresh the page (F5)
2. Stats should still show correct counts
3. Should NOT reset to 0

### Test 3: Multi-User Update
1. Open story in Browser A (logged in as User A)
2. Open same story in Browser B (logged in as User B)
3. Like the story in Browser B
4. Within 10 seconds, Browser A should show updated count

### Test 4: Click Interaction
1. Click the like button
2. Count should increment immediately
3. Refresh page - count should persist

## If Stats Still Show 0

### Check 1: Is the Story Published?
The stats endpoint only works for published stories:

```python
story = Story.objects.get(id=1)
print(f"Is published: {story.is_published}")

# If False, publish it:
story.is_published = True
story.save()
```

### Check 2: Are You Testing with the Right Story?
Make sure you're viewing a story that actually has likes/comments. Create test data:

```python
from django.contrib.auth.models import User
from storybook.models import Story, Like, Comment

story = Story.objects.get(id=1)
user = User.objects.first()  # Or create a test user

# Add a like
Like.objects.get_or_create(story=story, user=user)

# Add a comment
Comment.objects.create(
    story=story,
    author=user,
    text="This is a test comment!"
)

print(f"Now story has {story.likes.count()} likes and {story.comments.count()} comments")
```

### Check 3: Frontend State Issue
If console shows correct counts but UI shows 0, there's a React state issue. Check React DevTools:

1. Install React DevTools browser extension
2. Open DevTools → Components tab
3. Find StoryReaderPage component
4. Check the state values for `likeCount`, `commentCount`, etc.

## Alternative: Disable Stats Endpoint Temporarily

If the stats endpoint keeps failing, you can rely solely on the story detail API. Comment out the stats fetch:

In `StoryReaderPage.tsx`, line 117-119:
```typescript
// Temporarily disable stats endpoint
// setTimeout(() => {
//   fetchInteractionStats(storyIdToUse);
// }, 500);
```

The initial counts from the story detail API should still work.

## Expected Behavior After Fix

✅ Stats display immediately when page loads
✅ Stats persist after page refresh
✅ Stats update when you like/comment
✅ Stats auto-refresh every 10 seconds
✅ No console errors

## Still Having Issues?

Share the following information:

1. **Console logs** when loading the story
2. **Backend server logs** (terminal where Django is running)
3. **Database query results** from Step 5
4. **Network tab** in DevTools showing the API requests/responses

The detailed logs will help identify the exact issue.
