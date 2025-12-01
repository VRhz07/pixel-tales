# XP System - Quick Start Guide

## 🎯 Problem Solved

**Before:** XP decreased when users deleted stories (calculated on-the-fly)  
**After:** XP is persistent and **never decreases** ✅

---

## 🚀 Quick Setup

### 1. Run Migration
```bash
cd backend
python manage.py migrate
```

### 2. Test It Out
1. Create a story → +100 XP
2. Publish the story → +50 XP
3. Delete the story → XP stays the same! 🎉

---

## 💰 XP Rewards

| Action | XP |
|--------|-----|
| Create Story | 100 |
| Publish Story | 50 |
| Collaboration | 50 |
| Your Story Gets Liked | 5 |
| Your Story Gets Comment | 10 |
| Add Friend | 20 |
| Create Character | 25 |
| Read Story | 5 |
| Earn Achievement | 30 |

---

## 📊 Level System

- **500 XP = 1 Level**
- Level 1: 0-499 XP
- Level 2: 500-999 XP
- Level 3: 1000-1499 XP
- etc.

---

## 🔧 How to Award XP (Backend)

```python
from storybook.xp_service import award_xp

# Award XP for an action
xp_result = award_xp(user, 'story_created')

# Custom XP amount
xp_result = award_xp(user, 'special_bonus', amount=500)
```

---

## 🎨 Frontend Access

```typescript
const { user } = useAuthStore();

// Access XP data
user.level              // Current level
user.experience_points  // Total XP
user.xp_progress       // XP in current level
user.xp_progress_percentage  // % to next level
```

---

## ✅ Key Features

- ✅ **XP Never Decreases** - Permanent progress
- ✅ **Level Up Notifications** - Celebrate achievements
- ✅ **Visual Progress Bars** - See your growth
- ✅ **Diverse Rewards** - Multiple ways to earn XP

---

## 📁 Files Changed

**Backend:**
- `models.py` - Added XP fields
- `xp_service.py` - XP management (new)
- `views.py` - Award XP on actions
- `jwt_auth.py` - Return XP in API
- Migration - Add DB fields

**Frontend:**
- `api.types.ts` - Updated User type
- `ProfilePage.tsx` - Use persistent XP

---

## 🎮 Try It Out!

1. Login to your account
2. Check your current level in Profile
3. Create and publish a story
4. Watch your XP and level increase!
5. Delete the story
6. Notice XP stays the same! 🎉

---

For detailed documentation, see `PERSISTENT_XP_SYSTEM.md`
