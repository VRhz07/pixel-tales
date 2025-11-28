# Story Persistence Debugging Guide

## Issue Fixed
Draft and saved stories were disappearing on browser refresh due to a race condition in the store initialization.

## Changes Made

### 1. **storyStore.ts** - Enhanced Persistence
- ✅ Added detailed console logging for hydration debugging
- ✅ Added migration handler to ensure proper data structure
- ✅ Improved computed getters for stories and characters
- ✅ Added `onRehydrateStorage` callback to track when data loads from localStorage
- ✅ Added Date object conversion (dates were being stored as strings)
- ✅ Added comprehensive logging for create/update operations

### 2. **authStore.ts** - Prevented Overwriting
- ✅ Modified `checkAuth()` to only set `currentUserId` if it differs from persisted value
- ✅ This prevents the auth initialization from overwriting the story store's persisted state

### 3. **StorageDebugger Component** - NEW!
- ✅ Created visual debugging tool to inspect localStorage in real-time
- ✅ Shows story count, user ID, and raw storage data
- ✅ Allows exporting and clearing storage
- ✅ Added to ManualStoryCreationPage for easy access

## How to Test

### Step 1: Clear Browser Storage (Fresh Start)
1. Open DevTools (F12)
2. Go to **Application** tab
3. Under **Storage** → **Local Storage** → select your domain
4. Delete `story-store` and `auth-storage` keys
5. Refresh the page

### Step 2: Sign In
1. Sign in with your account (or continue without account)
2. Check the console - you should see:
   ```
   ✅ Story store hydrated successfully
   📚 Current user ID: [your-user-id]
   👥 User libraries: []
   ```

### Step 3: Create a Story
1. Navigate to **Manual Story Creation** page
2. **Click the "🔍 Debug" button** in the bottom-right corner
3. Create a new story with a title
4. Add some text to the page
5. **Open the debugger** - you should see your story appear in real-time
6. Click **Save** and fill in the details
7. Check console for save confirmation:
   ```
   ✨ Story created: [story-id] for user: [user-id]
   📚 Total stories now: 1
   💾 Story updated: [story-id] Total stories: 1
   ```

### Step 4: Verify Persistence with Debugger
1. **Keep the debugger open** and click "🔄 Refresh" button
2. You should see:
   - Stories count showing 1
   - Your story listed with title and ID
   - Raw localStorage data at the bottom
3. **Refresh the browser** (F5 or Ctrl+R)
4. Check the console - you should now see:
   ```
   ✅ Story store hydrated successfully
   📚 Current user ID: [your-user-id]
   👥 User libraries: ['[your-user-id]']
   📖 Stories for current user: 1
   📚 Story titles: [Your Story Title]
   ```
5. **Open the debugger again** - your story should still be there
6. Navigate to **Library** page - your story should be visible in "My Stories"

### Step 5: Inspect localStorage
1. Open DevTools → Application → Local Storage
2. Click on `story-store` key
3. You should see JSON data with:
   - `state.userLibraries.[your-user-id].stories` array
   - `state.currentUserId` matching your user ID

## Console Logs to Watch For

### ✅ Good Signs
- `✅ Story store hydrated successfully`
- `📖 Stories for current user: [number > 0]`
- `Story saved successfully` (when saving)

### ⚠️ Warning Signs
- `⚠️ Story store hydration returned null state`
- `No user logged in` error when creating stories
- Stories count showing 0 after refresh

## Common Issues & Solutions

### Issue: Stories still disappearing
**Solution**: Check if you're signed in with the same account. Each user has separate story libraries.

### Issue: "No user logged in" error
**Solution**: The `currentUserId` is not being set. Check that `checkAuth()` is running in App.tsx on mount.

### Issue: Stories show before refresh but not after
**Solution**: Check the browser console for hydration logs. The `onRehydrateStorage` callback should fire.

### Issue: localStorage shows old data
**Solution**: The version number changed from 1 to 2. The migration should handle this, but you can manually clear old data.

## Technical Details

### Data Structure in localStorage
```json
{
  "state": {
    "userLibraries": {
      "[user-id]": {
        "stories": [...],
        "characters": [...]
      }
    },
    "currentUserId": "[user-id]"
  },
  "version": 2
}
```

### Persistence Flow
1. **App Mount** → `checkAuth()` runs
2. **Zustand Hydration** → Loads `userLibraries` and `currentUserId` from localStorage
3. **Auth Check** → Only updates `currentUserId` if different
4. **Store Ready** → Stories accessible via computed getters

### Why It Was Failing Before
- `checkAuth()` was calling `setCurrentUser()` unconditionally
- This could trigger before Zustand finished hydrating from localStorage
- Race condition: sometimes auth would set user before store loaded data
- Fix: Only set user if it's different from persisted value

## Verification Checklist
- [ ] Console shows successful hydration
- [ ] Stories count > 0 after creating and refreshing
- [ ] localStorage contains story data
- [ ] Library page displays saved stories
- [ ] Draft stories appear in "My Stories" section
- [ ] Saved stories persist across browser sessions
- [ ] Different users have separate story libraries

## Need More Help?
If stories are still disappearing:
1. Share the console logs (especially hydration logs)
2. Export localStorage data for `story-store` key
3. Check if you're consistently using the same user account
