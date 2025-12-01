# Profile Page Improvements

## Summary of Changes

This document outlines the improvements made to the child profile page statistics.

---

## 1. Fixed "Days Active" Calculation

### Problem
The "Days Active" statistic was hardcoded to calculate from January 1, 2024, showing 700+ days for all accounts regardless of when they were created.

### Solution
Updated the calculation to use the actual user's account creation date from `user.created_at`.

**Backend:** The `created_at` field is already returned by the `jwt_user_profile` endpoint in `backend/storybook/jwt_auth.py`.

**Frontend Changes:**
- File: `frontend/src/components/pages/ProfilePage.tsx`
- Changed from: `Math.floor((new Date().getTime() - new Date('2024-01-01').getTime()) / (1000 * 60 * 60 * 24))`
- Changed to: 
```typescript
user?.created_at 
  ? Math.floor((new Date().getTime() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))
  : 0
```

### Result
- Newly created accounts now show 0-1 days active
- Days active accurately reflects the account's actual age

---

## 2. Replaced "Characters Made" with "Collaborations"

### Problem
The profile showed "Characters Made" count, which wasn't a meaningful metric for tracking child engagement.

### Solution
Replaced it with "Collaborations" count, which tracks collaborative story activities where the child participated and saved stories (published or drafts).

### Backend Changes

**File:** `backend/storybook/views.py`
- Added collaboration count calculation in `achievement_progress` endpoint:
```python
# Collaboration count - count stories where user is a co-author (has saved collaborative stories)
collaboration_count = Story.objects.filter(
    is_collaborative=True,
    authors=user
).count()
```
- Added `collaboration_count` to the `user_stats` response

### Frontend Changes

**File:** `frontend/src/components/pages/ProfilePage.tsx`

1. **Updated UserStats interface:**
```typescript
interface UserStats {
  // ... other fields
  collaboration_count: number;
}
```

2. **Updated displayStats:**
```typescript
const displayStats = {
  storiesCreated: storyStats.totalStories,
  collaborationCount: userStats?.collaboration_count || 0, // Changed from charactersCreated
  totalLikes: userStats?.likes_received || 0,
  daysActive: // ... days active calculation
};
```

3. **Updated XP calculation:**
```typescript
// Collaboration worth 50 XP (increased from 25 for characters)
const totalXP = (displayStats.storiesCreated * 100) + (displayStats.collaborationCount * 50) + (displayStats.totalLikes * 5);
```

4. **Updated UI display:**
- Changed icon from `UserIcon` to `UserGroupIcon` (more appropriate for collaborations)
- Changed label from "Characters Made" to "Collaborations"

### How Collaborations are Counted

A collaboration is counted when:
1. The story has `is_collaborative=True` flag
2. The user is listed in the story's `authors` field (ManyToManyField)
3. This counts both published and draft collaborative stories

This means:
- Only saved collaborative work is counted (not just joining a session)
- The child must be an active participant (in the authors list)
- Both published stories and drafts in the library are included

---

## Impact

### For Children
- **More accurate "Days Active"**: Shows genuine account age instead of arbitrary dates
- **Better engagement metric**: "Collaborations" encourages teamwork and social interaction
- **Higher XP value**: Collaborations worth 50 XP vs characters' 25 XP, rewarding collaborative work

### For Parents
- Can see how long the account has actually been active
- Can track collaborative story activities with friends
- Better insight into social engagement

---

## Testing Recommendations

1. **Test Days Active:**
   - Create a new account and verify it shows 0 days active
   - Check existing accounts show correct days since creation

2. **Test Collaborations:**
   - Start a collaborative session
   - Save a collaborative story (as draft or published)
   - Verify the collaboration count increments
   - Check that joining a session without saving doesn't count

3. **Test XP Calculation:**
   - Verify XP updates correctly with collaboration activities
   - Check level progression with collaborative work

---

## Files Modified

### Backend
- `backend/storybook/views.py` - Added collaboration_count calculation

### Frontend
- `frontend/src/components/pages/ProfilePage.tsx` - Updated stats display and calculations

---

## Notes

- The `characters_created` field is still tracked in the backend for achievements
- Collaboration achievements can use the `collaboration_count` metric
- The `Story` model's `authors` field properly tracks all collaborative participants
