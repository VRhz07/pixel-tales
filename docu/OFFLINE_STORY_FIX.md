# Offline Story Loading Fix

## 🐛 Problem
When saving a story created by another user to offline storage and then trying to open it from the offline library, the app would display "Story not found" error. The story would be saved successfully but couldn't be retrieved.

## 🔍 Root Cause
The issue was in the `getStory` function in `frontend/src/stores/storyStore.ts`. The function only searched for stories in the `stories` array (user's own stories), but **completely ignored the `offlineStories` array** where downloaded stories from other users are stored.

### Original Code (Line 542-546):
```typescript
getStory: (id: string) => {
  const state = get();
  if (!state.currentUserId) return undefined;
  return state.userLibraries[state.currentUserId]?.stories.find(story => story.id === id);
},
```

This meant:
- ✅ User's own stories could be loaded
- ❌ Offline stories from other users were invisible to the system

## ✅ Solution Applied

### 1. **Fixed `getStory` Function**
Modified to check both `stories` and `offlineStories` arrays:

```typescript
getStory: (id: string) => {
  const state = get();
  if (!state.currentUserId) return undefined;
  
  // First check regular stories
  const regularStory = state.userLibraries[state.currentUserId]?.stories.find(story => story.id === id);
  if (regularStory) return regularStory;
  
  // If not found, check offline stories
  const offlineStory = state.userLibraries[state.currentUserId]?.offlineStories?.find(story => story.id === id);
  return offlineStory;
},
```

### 2. **Enhanced `isStorySavedOffline` Function**
Updated to handle different ID formats (string IDs vs backend numeric IDs):

```typescript
isStorySavedOffline: (storyId: string) => {
  const state = get();
  if (!state.currentUserId) return false;
  
  const currentLibrary = state.userLibraries[state.currentUserId];
  if (!currentLibrary || !currentLibrary.offlineStories) return false;
  
  // Check by both id and backendId to handle different story ID formats
  return currentLibrary.offlineStories.some(s => 
    s.id === storyId || 
    (s.backendId && s.backendId.toString() === storyId) ||
    (s.id === storyId.toString())
  );
},
```

### 3. **Enhanced `removeOfflineStory` Function**
Updated to properly remove stories regardless of ID format:

```typescript
removeOfflineStory: (storyId: string) => {
  const state = get();
  if (!state.currentUserId) return;
  
  const currentLibrary = state.userLibraries[state.currentUserId];
  if (!currentLibrary) return;
  
  const offlineStories = currentLibrary.offlineStories || [];
  
  // Filter by both id and backendId to handle different story ID formats
  set((state) => ({
    userLibraries: {
      ...state.userLibraries,
      [state.currentUserId!]: {
        ...currentLibrary,
        offlineStories: offlineStories.filter(s => 
          s.id !== storyId && 
          (!s.backendId || s.backendId.toString() !== storyId)
        )
      }
    }
  }));
  
  console.log('✅ Removed offline story:', storyId);
},
```

### 4. **Enhanced `saveStoryOffline` Function**
Improved duplicate detection to check both ID and backendId:

```typescript
saveStoryOffline: (story: Story) => {
  const state = get();
  if (!state.currentUserId) {
    console.error('❌ Cannot save offline: No user logged in');
    return;
  }
  
  const currentLibrary = state.userLibraries[state.currentUserId] || { stories: [], characters: [], offlineStories: [] };
  const offlineStories = currentLibrary.offlineStories || [];
  
  // Check if story is already saved offline (by both id and backendId)
  const isAlreadySaved = offlineStories.some(s => 
    s.id === story.id || 
    (s.backendId && story.backendId && s.backendId === story.backendId)
  );
  if (isAlreadySaved) {
    console.log('ℹ️ Story already saved offline');
    return;
  }
  
  // Add story to offline storage
  set((state) => ({
    userLibraries: {
      ...state.userLibraries,
      [state.currentUserId!]: {
        ...currentLibrary,
        offlineStories: [...offlineStories, story]
      }
    }
  }));
  
  console.log('✅ Story saved offline:', story.title);
},
```

## 📋 Files Modified
1. ✅ `frontend/src/stores/storyStore.ts`
   - Fixed `getStory()` to check offline stories
   - Enhanced `isStorySavedOffline()` for different ID formats
   - Enhanced `removeOfflineStory()` for proper removal
   - Enhanced `saveStoryOffline()` for better duplicate detection

## 🧪 How to Test

### Test 1: Save and Load Other User's Story
1. Browse to the Public Library
2. Find a story created by another user
3. Open the story
4. Click the "Save Offline" button (cloud with down arrow)
5. Navigate to your Private Library
6. Go to the "Offline" tab
7. Click on the saved story
8. **Expected**: Story should load successfully ✅
9. **Before Fix**: "Story not found" error ❌

### Test 2: Verify Offline Icon Shows Correctly
1. Save a story from another user offline
2. Navigate back to that story in the public library
3. **Expected**: The offline icon should be displayed/highlighted ✅

### Test 3: Remove Offline Story
1. Go to Private Library → Offline tab
2. Click on an offline story
3. Click the "Remove Offline" button
4. **Expected**: Story should be removed from offline storage ✅
5. Return to public library and verify the offline icon is no longer shown

### Test 4: Duplicate Prevention
1. Save a story offline
2. Try to save the same story again
3. **Expected**: Should show "Story already saved offline" message ✅
4. Should not create duplicate entries

## ✨ Benefits

### Before Fix:
- ❌ Offline stories couldn't be opened
- ❌ "Story not found" error
- ❌ Users couldn't read downloaded content

### After Fix:
- ✅ Offline stories load correctly
- ✅ Stories from other users work properly
- ✅ Handles both string and numeric IDs
- ✅ No duplicate offline saves
- ✅ Proper offline status indication
- ✅ Seamless offline reading experience

## 🔄 Data Structure

### User Library Structure:
```typescript
interface UserLibrary {
  stories: Story[];          // User's own stories
  characters: Character[];   // User's own characters
  offlineStories: Story[];   // Downloaded stories from others
}
```

### Story ID Formats:
- **Local Stories**: String ID (e.g., "abc123xyz")
- **Backend Stories**: Numeric backendId (e.g., 42)
- **Offline Stories**: Can have both formats

The fix ensures all three scenarios work correctly!

---
**Fixed by:** Rovo Dev  
**Date:** December 18, 2025  
**Related Issues:** Offline story loading, Story not found error
