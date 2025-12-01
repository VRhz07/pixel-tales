# Persistent XP System Implementation

## Overview

This document describes the implementation of a persistent experience points (XP) system that **never decreases**. This solves the issue where deleting stories would reduce user levels and XP.

---

## Problem Statement

**Before:**
- XP was calculated on-the-fly based on current stats (stories × 100 + collaborations × 50 + likes × 5)
- When users deleted stories, their XP and level would decrease
- This was demotivating and didn't follow gamification best practices

**After:**
- XP is stored persistently in the database
- XP is awarded for actions and **never decreases**
- Levels are calculated based on total XP earned
- Deleting content doesn't affect XP or level

---

## Database Changes

### New Fields in UserProfile Model

```python
# Gamification fields
experience_points = models.PositiveIntegerField(default=0)  # Total XP earned (never decreases)
level = models.PositiveIntegerField(default=1)  # Current level based on XP
```

### Migration
- File: `backend/storybook/migrations/0022_userprofile_experience_level.py`
- Adds `experience_points` and `level` fields to UserProfile model

---

## XP Rewards System

### XP Values for Actions

| Action | XP Reward | Description |
|--------|-----------|-------------|
| `story_created` | 100 XP | Creating a new story (draft or published) |
| `story_published` | 50 XP | Publishing a story to the library |
| `collaboration_completed` | 50 XP | Completing a collaborative story |
| `story_liked` | 5 XP | When your story receives a like |
| `story_commented` | 10 XP | When your story receives a comment |
| `friend_added` | 20 XP | Adding a new friend |
| `character_created` | 25 XP | Creating a character |
| `story_read` | 5 XP | Reading a story |
| `achievement_earned` | 30 XP | Earning an achievement |

### Level Progression

- **500 XP per level**
- Level = (Total XP ÷ 500) + 1
- Level 1: 0-499 XP
- Level 2: 500-999 XP
- Level 3: 1000-1499 XP
- And so on...

---

## Backend Implementation

### XP Service (`backend/storybook/xp_service.py`)

The XP service provides methods to award XP and manage levels:

```python
from storybook.xp_service import award_xp

# Award XP for an action
xp_result = award_xp(user, 'story_created')

# Result includes:
# {
#     'xp_gained': 100,
#     'total_xp': 650,
#     'level': 2,
#     'leveled_up': True
# }
```

### UserProfile Methods

```python
# Add XP to user
profile.add_experience(100)

# Get XP info
profile.experience_points  # Total XP
profile.level  # Current level
profile.xp_for_next_level  # XP needed for next level (500)
profile.xp_progress_in_current_level  # XP progress in current level
profile.xp_progress_percentage  # Percentage to next level
```

### API Endpoints Updated

**Story Creation:**
```python
POST /stories/
Response includes: xp_earned object
```

**Story Publishing:**
```python
POST /stories/{id}/publish/
Response includes: xp_earned object
```

**Story Liking:**
```python
POST /stories/{id}/like/
Awards XP to story author (not the liker)
```

**User Profile:**
```json
GET /auth/profile/
{
  "experience_points": 650,
  "level": 2,
  "xp_for_next_level": 1000,
  "xp_progress": 150,
  "xp_progress_percentage": 30.0
}
```

---

## Frontend Implementation

### Updated User Type

```typescript
interface User {
  // ... other fields
  experience_points?: number;
  level?: number;
  xp_for_next_level?: number;
  xp_progress?: number;
  xp_progress_percentage?: number;
}
```

### ProfilePage Changes

**Before:**
```typescript
// Calculated on-the-fly
const totalXP = (stories * 100) + (collaborations * 50) + (likes * 5);
const level = Math.floor(totalXP / 500) + 1;
```

**After:**
```typescript
// Uses persistent data from backend
const userLevel = {
  level: user?.level || 1,
  currentXP: user?.experience_points || 0,
  nextLevelXP: user?.xp_for_next_level || 500,
  currentLevelProgress: user?.xp_progress || 0,
  progressPercent: user?.xp_progress_percentage || 0
};
```

---

## Key Features

### 1. XP Never Decreases
- Once earned, XP is permanent
- Deleting stories, unliking, etc. doesn't deduct XP
- Encourages experimentation without fear of losing progress

### 2. Level Up Notifications
- Users receive a notification when they level up
- Notification type: `achievement_earned`
- Contains level information

### 3. XP Transparency
- Users can see their total XP
- Progress bar shows XP to next level
- Clear indication of current level

### 4. Action-Based Rewards
- XP is awarded immediately for actions
- Different actions have different XP values
- Encourages diverse engagement

---

## Usage Examples

### Backend - Award XP in Views

```python
from .xp_service import award_xp

# Award XP for story creation
xp_result = award_xp(request.user, 'story_created')

# Award custom XP amount
xp_result = award_xp(request.user, 'special_event', amount=250)

# Award XP without notification
xp_result = award_xp(user, 'story_liked', create_notification=False)
```

### Backend - Check User XP

```python
from .xp_service import XPService

# Get complete XP info
xp_info = XPService.get_user_xp_info(user)
# Returns: {
#   'total_xp': 650,
#   'level': 2,
#   'current_level_xp': 150,
#   'next_level_xp': 1000,
#   'progress_percentage': 30.0
# }
```

### Frontend - Display XP

```typescript
// In ProfilePage or any component with user data
const { user } = useAuthStore();

console.log(`Level: ${user.level}`);
console.log(`XP: ${user.experience_points}`);
console.log(`Progress: ${user.xp_progress_percentage}%`);
```

---

## Migration Steps

### 1. Run Database Migration
```bash
cd backend
python manage.py migrate
```

This will add the `experience_points` and `level` fields to all existing UserProfile records with default values (0 XP, Level 1).

### 2. Optional: Backfill XP for Existing Users
If you want to grant existing users XP based on their current activity:

```python
# In Django shell or management command
from django.contrib.auth.models import User
from storybook.models import Story

for user in User.objects.all():
    profile = user.profile
    
    # Award XP based on existing stories
    story_count = Story.objects.filter(author=user).count()
    published_count = Story.objects.filter(author=user, is_published=True).count()
    
    xp_to_award = (story_count * 100) + (published_count * 50)
    profile.add_experience(xp_to_award)
```

### 3. Frontend Update
The frontend automatically uses the new XP system once the backend returns the XP fields.

---

## Testing Checklist

- [ ] Create a new story → User gains 100 XP
- [ ] Publish a story → User gains additional 50 XP
- [ ] Receive a like → Story author gains 5 XP
- [ ] Delete a story → XP doesn't decrease
- [ ] Level up → Receive notification
- [ ] Profile page shows correct XP and level
- [ ] Progress bar reflects XP to next level
- [ ] XP persists across sessions

---

## Future Enhancements

### Potential Features
1. **XP Multipliers**: Bonus XP during special events
2. **Daily Quests**: Complete tasks for bonus XP
3. **Streak Bonuses**: Consecutive day activity rewards
4. **XP Shop**: Spend XP on cosmetic items or features
5. **Leaderboards**: Compare XP/levels with friends
6. **Achievement XP**: Specific XP rewards per achievement
7. **Collaboration Bonuses**: Extra XP for working with friends

### XP Balance Adjustments
Monitor and adjust XP values based on:
- User progression rates
- Feature usage patterns
- Level distribution across user base
- Time investment per action

---

## Important Notes

### XP Design Philosophy
1. **Positive Reinforcement**: Reward actions, never punish
2. **Progressive Disclosure**: Unlock features as users level up
3. **Social Validation**: Share level achievements
4. **Meaningful Progress**: Levels should feel earned but achievable

### Best Practices
- Award XP immediately after action completion
- Provide clear feedback when XP is earned
- Show progress visually (progress bars, animations)
- Celebrate level ups with notifications
- Make XP gains transparent and predictable

### Security Considerations
- XP can only be awarded through server-side code
- Frontend cannot directly modify XP values
- XP service validates all XP awards
- Level calculations are deterministic

---

## Files Modified/Created

### Backend
- ✅ `backend/storybook/models.py` - Added XP fields and methods
- ✅ `backend/storybook/xp_service.py` - XP service (new file)
- ✅ `backend/storybook/migrations/0022_userprofile_experience_level.py` - Migration
- ✅ `backend/storybook/jwt_auth.py` - Return XP in auth responses
- ✅ `backend/storybook/views.py` - Award XP for actions

### Frontend
- ✅ `frontend/src/types/api.types.ts` - Updated User interface
- ✅ `frontend/src/components/pages/ProfilePage.tsx` - Use persistent XP

### Documentation
- ✅ `docu/PERSISTENT_XP_SYSTEM.md` - This document
- ✅ `docu/PROFILE_PAGE_IMPROVEMENTS.md` - Previous improvements

---

## Summary

The persistent XP system provides a motivating gamification layer that:
- ✅ Never decreases (positive reinforcement)
- ✅ Rewards diverse engagement
- ✅ Provides clear progression
- ✅ Persists across sessions
- ✅ Integrates seamlessly with existing features

Users can now create, experiment, and engage without fear of losing progress!
