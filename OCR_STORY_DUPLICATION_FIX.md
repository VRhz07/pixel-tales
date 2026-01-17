# OCR/Photo Story Duplication Fix

## Problem
When creating a story using OCR (text extraction) or Photo Story mode, the story draft was being **duplicated** in the backend. Users would see two copies of the same story in their library.

## Root Cause
The duplication occurred because of a race condition in the save flow:

1. **Story Created Locally** (PhotoStoryModal line 324)
   - `createStory()` creates a story in the local state
   - The story has NO `backendId` yet (only a local UUID)

2. **User Navigates to Story** (PhotoStoryModal line 633)
   - Story is displayed but still has no `backendId`

3. **User Clicks "Save"** (ManualStoryCreationPage line 2198)
   - `syncStoryToBackend()` is called
   - Since the story has no `backendId`, it calls `createStory()` API
   - This creates a FIRST copy in the backend

4. **Auto-sync or Second Save**
   - If user saves again or auto-sync triggers
   - Story STILL doesn't have `backendId` (timing issue)
   - `createStory()` API is called AGAIN
   - This creates a SECOND copy (duplicate!)

## The Fix

Added immediate backend sync after story creation in `PhotoStoryModal.tsx` (after line 625):

```typescript
// CRITICAL FIX: Sync story to backend immediately to get backendId
// This prevents duplicate stories when user clicks "Save" later
try {
  console.log('🔄 Syncing story to backend to prevent duplicates...');
  const backendId = await useStoryStore.getState().syncStoryToBackend(newStory.id);
  console.log(`✅ Story synced to backend with ID: ${backendId}`);
} catch (error) {
  console.warn('⚠️ Failed to sync story to backend:', error);
  // Continue anyway - story is saved locally
}
```

## How It Works Now

1. **Story Created Locally**
   - `createStory()` creates story with local UUID

2. **Immediate Backend Sync** ✅ NEW
   - Story is synced to backend RIGHT AWAY
   - Backend returns `backendId` (e.g., 42)
   - Local story is updated with `backendId: 42`

3. **User Navigates to Story**
   - Story now has `backendId: 42`

4. **User Clicks "Save"**
   - `syncStoryToBackend()` is called
   - Story HAS `backendId: 42`
   - Calls `updateStory(42)` API instead of `createStory()`
   - ✅ **No duplicate created!**

## Files Modified
- `frontend/src/components/creation/PhotoStoryModal.tsx` (line 625-636)

## Benefits
✅ No more duplicate stories in the library
✅ Immediate backend sync ensures data safety
✅ Subsequent saves UPDATE instead of CREATE
✅ Works for both Photo Story and OCR modes
✅ Graceful fallback if sync fails (story still saved locally)

## Testing
1. Create a story using OCR mode (extract text from image)
2. Generate the story with AI
3. Check your library - should see **1 story**, not 2
4. Edit the story and save again
5. Check library - should still see **1 story** (updated, not duplicated)

## Technical Details

### Before Fix
```
createStory() → no backendId → save → CREATE API → backendId=42
                                save again → no backendId yet → CREATE API → backendId=43 ❌ DUPLICATE
```

### After Fix
```
createStory() → syncToBackend() → backendId=42
                                → save → UPDATE API (42) ✅ No duplicate
                                → save again → UPDATE API (42) ✅ No duplicate
```

The key is getting the `backendId` BEFORE the user has a chance to save manually.
