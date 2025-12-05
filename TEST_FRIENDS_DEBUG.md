# 🐛 Friend List Debug Test

## Problem
User reports seeing their own name 3 times in the friend list instead of their friends' names.

## Changes Made

### 1. Backend - Added avatar_emoji to FriendshipSerializer
**File**: `backend/storybook/serializers.py`

Added `avatar_emoji` field to both `get_sender()` and `get_receiver()` methods so the frontend can display friend avatars.

### 2. Frontend - Enhanced Debug Logging
**File**: `frontend/src/services/social.service.ts`

Added extensive console logging to debug the friend selection logic:
- Shows the raw API response
- Shows current user ID and type
- For each friendship:
  - Shows sender and receiver objects
  - Shows ID comparisons
  - Shows which friend was selected
  - Shows the final name being used

## How to Test

1. **Restart your backend server** (to load the serializer changes)
2. **Refresh your frontend** (hard refresh: Ctrl+Shift+R or Cmd+Shift+R)
3. **Open browser console** (F12)
4. **Go to the Social page**
5. **Look at the console logs**

The logs will show:
```
🔍 Friends API response: { ... }
👤 Current user ID: 123 Type: number

📋 Processing friendship: { ... }
   Sender: { id: 123, username: "user1", ... }
   Receiver: { id: 456, username: "friend1", ... }
   🔢 Sender ID: 123 (type: number)
   🔢 Receiver ID: 456 (type: number)
   🔢 Current User ID: 123 (type: number)
   ❓ Is sender current user? true
   ❓ Is receiver current user? false
   ✅ Selected friend: { id: 456, username: "friend1", ... }
   ✅ Friend name from profile: "Friend Name"
   ✅ Friend username: "friend1"
```

## Expected Behavior

If working correctly:
- **Current User ID** should match YOUR account ID
- For each friendship, **one** of the users should be you (sender or receiver)
- The **other user** should be selected as the friend
- The **friend's name** from their profile should be displayed

## Possible Issues to Look For

### Issue 1: Wrong User Selected
If you see:
```
❓ Is sender current user? false
❓ Is receiver current user? false
```
OR
```
❓ Is sender current user? true
❓ Is receiver current user? true
```

**Problem**: The current user ID doesn't match either sender or receiver.

**Solution**: Check localStorage auth data:
```javascript
// Run in console
const auth = JSON.parse(localStorage.getItem('auth-storage'));
console.log('Stored user ID:', auth?.state?.user?.id);
```

### Issue 2: Avatar Emoji Missing
If `avatar_emoji` is undefined or null in the logs:

**Problem**: User profiles don't have avatar_emoji set.

**Solution**: Check database or set default avatars for test users.

### Issue 3: Display Name Missing
If `display_name` is showing as "Unknown":

**Problem**: User profiles don't have display_name set.

**Solution**: Check if profiles exist and have display names.

## Next Steps

**After you run the test**, please share:
1. The console logs (copy/paste or screenshot)
2. What you see in the friend list
3. What you expect to see

This will help us identify the exact issue!
