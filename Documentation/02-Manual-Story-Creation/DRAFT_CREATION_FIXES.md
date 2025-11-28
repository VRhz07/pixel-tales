# Draft Creation & Navigation Fixes

## Issues Fixed

### Issue 1: New Draft Created Every Time (Multiple Scenarios)

#### Scenario A: Returning from Canvas
**Problem**: When creating a new story manually, entering a title, then editing the canvas and returning, a NEW draft would be created instead of updating the existing one. The title would also reset to "Untitled Story".

**Root Cause**: 
- The initialization effect had `createStory` and `setCurrentStory` in its dependency array
- Every time the effect re-ran, it would create a new story
- When returning from canvas, the effect would trigger and create a duplicate draft

#### Scenario B: After Saving Title
**Problem**: When you create a new story, enter a title, click Save, the page would create a duplicate draft.

**Root Cause**:
- When creating a new story from "Start Creating", the URL had no `storyId`
- After saving the title, the URL STILL had no `storyId`
- Any navigation or refresh would trigger the initialization effect
- Since there was no `storyId`, it would create a NEW story instead of loading the existing one

### Issue 1b: Title Resets to "Untitled Story" When Returning from Canvas
**Problem**: When you type a title, then go to canvas and return, the title resets to "Untitled Story" even though canvas data and page text are preserved.

**Root Cause**: 
- Title was only stored in local state, not saved to the store
- When you navigate to canvas and back, the initialization effect loads the story from the store
- The store still has "Untitled Story" as the title (never saved)
- So the title resets even though you typed a different one

**Solution**:
```typescript
// 1. Fixed initialization effect - only depend on storyId
useEffect(() => {
  if (storyId) {
    // Load existing story
    const story = useStoryStore.getState().getStory(storyId);
    if (story) {
      setCurrentStory(story);
      setStoryTitle(story.title);
    }
  } else if (!currentStory) {
    // Only create new story if we don't already have one
    const newStory = createStory('Untitled Story');
    setStoryTitle(newStory.title);
    // ✅ KEY FIX: Update URL to include storyId immediately
    navigate('/create-story-manual', { state: { storyId: newStory.id }, replace: true });
  }
}, [storyId]); // Only depend on storyId - prevents re-creation

// 2. Fixed refresh effect - only depend on pathname, preserve user edits
useEffect(() => {
  if (currentStory && location.pathname === '/create-story-manual') {
    const refreshedStory = useStoryStore.getState().getStory(currentStory.id);
    if (refreshedStory) {
      // Check for canvas/content changes
      const hasChanges = refreshedStory.pages.some((page, index) => {
        const currentPage = currentStory.pages[index];
        return !currentPage || page.canvasData !== currentPage.canvasData || page.text !== currentPage.text;
      });
      
      // Only update if there are actual changes
      if (hasChanges || refreshedStory.pages.length !== currentStory.pages.length) {
        setCurrentStory(refreshedStory);
        // ✅ Only update title if not currently editing (preserve user's unsaved changes)
        if (refreshedStory.title !== storyTitle && !hasUnsavedChanges) {
          setStoryTitle(refreshedStory.title);
        }
      }
    }
  }
}, [location.pathname]); // Only refresh on navigation, not on currentStory change

// 3. REMOVED the problematic "Update title when story changes" effect
// This effect was causing the title to reset whenever currentStory changed
// useEffect(() => {
//   if (currentStory) {
//     setStoryTitle(currentStory.title); // ❌ This was resetting the title!
//   }
// }, [currentStory]);

// 4. Updated save handler to immediately reflect title changes
if (storyTitle !== currentStory.title) {
  updateStory(currentStory.id, { title: storyTitle });
  setCurrentStory({ ...currentStory, title: storyTitle });
}

// 5. Added unsaved changes flag when title is edited
<input
  value={storyTitle}
  onChange={(e) => {
    setStoryTitle(e.target.value);
    setHasUnsavedChanges(true); // ✅ Mark as unsaved
  }}
/>

// 6. ✅ KEY FIX: Auto-save title to store as user types (debounced)
useEffect(() => {
  if (currentStory && storyTitle && storyTitle !== currentStory.title) {
    const timeoutId = setTimeout(() => {
      updateStory(currentStory.id, { title: storyTitle });
    }, 500); // Save 500ms after user stops typing
    
    return () => clearTimeout(timeoutId);
  }
}, [storyTitle, currentStory, updateStory]);
```

This ensures the title is always saved to the store, so when you navigate to canvas and back, the correct title is loaded.

### Issue 2: "Continue Working" Creates New Draft Instead of Editing Existing
**Problem**: Clicking "Continue" on a draft from the HomePage would create a new draft instead of editing the existing one.

**Root Cause**:
- The `handleContinueStory` function in HomePage was navigating to `/create-story-manual` WITHOUT passing the `storyId` in the navigation state
- Without `storyId`, ManualStoryCreationPage thought it was a new story and created a fresh draft
- This resulted in duplicate drafts being created

**Solution**:
```typescript
// HomePage.tsx - Pass storyId in navigation state
const handleContinueStory = (story: any) => {
  setCurrentStory(story);
  navigate('/create-story-manual', { state: { storyId: story.id } }); // Added storyId
};
```

Now when you click "Continue", the page receives the `storyId` and loads the existing story instead of creating a new one.

## Files Modified

### 1. `/pages/ManualStoryCreationPage.tsx`
- **Title Sync**: Added title update in refresh effect
- **Save Handler**: Immediately update local state when title is saved
- **Refresh Logic**: Check for title changes in addition to content changes

### 2. `/components/pages/HomePage.tsx`
- **Continue Handler**: Pass `storyId` in navigation state when continuing a draft

## Testing Instructions

### Test 1: Title Persistence with Canvas
1. Click "Start Creating" from home page
2. Enter a custom title (e.g., "My Amazing Story")
3. Click "Edit Canvas" and draw something
4. Click "Done" to return
5. ✅ **Verify**: Title should still be "My Amazing Story" (not "Untitled Story")
6. Canvas preview should show your drawing

### Test 2: Continue Working from HomePage
1. Create a draft story with a title and some content
2. Go back to home page
3. Find the draft in "Continue Working" section
4. Click "Continue" button
5. ✅ **Verify**: Opens the SAME draft (not a new one)
6. Make changes and save
7. Go back to home and click "Continue" again
8. ✅ **Verify**: Your changes are preserved (no duplicate drafts)

### Test 3: Multiple Drafts
1. Create 3 different draft stories with different titles
2. Go to home page
3. Click "Continue" on draft #2
4. ✅ **Verify**: Opens draft #2 (not a new story)
5. Go back and click "Continue" on draft #3
6. ✅ **Verify**: Opens draft #3 (correct story loaded)

### Test 4: Title + Canvas Together
1. Create new story: "Test Story"
2. Add canvas drawing
3. Return and verify title is "Test Story"
4. Go to home page
5. Click "Continue" on "Test Story"
6. ✅ **Verify**: Title is "Test Story" AND canvas is visible
7. Change title to "Updated Story"
8. Save and go to canvas
9. Add more drawings
10. Return
11. ✅ **Verify**: Title is "Updated Story" with all canvas drawings

## How It Works Now

### New Story Creation Flow
```
Home Page → "Start Creating" 
  → ManualStoryCreationPage (no storyId)
  → Creates new story with "Untitled Story"
  → User changes title
  → Title saved to store AND local state
  → User edits canvas
  → Canvas saved to store
  → Returns to page
  → Refresh effect syncs both title AND canvas from store
  → ✅ Both title and canvas preserved
```

### Continue Existing Draft Flow
```
Home Page → "Continue" on draft
  → Navigate with storyId in state
  → ManualStoryCreationPage receives storyId
  → Loads existing story from store
  → User makes changes
  → Changes saved to store
  → ✅ Same draft updated (no duplicates)
```

## Benefits

✅ **Title Persistence**: Titles no longer reset when navigating to/from canvas
✅ **No Duplicate Drafts**: "Continue" properly edits existing drafts
✅ **State Consistency**: Local state stays in sync with store
✅ **Better UX**: Users don't lose their work or create accidental duplicates
✅ **Reliable Navigation**: All navigation paths properly pass story context

## Related Fixes
- Canvas data persistence (from previous fix)
- User-specific library isolation
- Story state synchronization across navigation
