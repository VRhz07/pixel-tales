# Canvas Drawing Disappearing Fix

## Issue Description
When editing a draft story from the library, the canvas drawings would disappear after navigating to the canvas page and back.

## Root Cause

### The Problem Flow
1. User clicks "Edit" on a draft in the Library
2. `ManualStoryCreationPage` loads the story from the store into local state (`currentStory`)
3. User clicks "Edit Canvas" and draws something
4. Canvas data is saved to the store via `saveCanvasData(storyId, pageId, canvasData)`
5. User clicks "Done" to return to `ManualStoryCreationPage`
6. **BUG**: The local `currentStory` state still has the OLD data (without canvas)
7. Canvas preview shows nothing because `currentStory.pages[x].canvasData` is undefined

### Why This Happened
The `currentStory` was stored in **local component state** and was only initialized once when the component mounted. When the canvas data was saved to the Zustand store, the local state didn't automatically update to reflect the changes.

## Solution

Added a **story refresh effect** that syncs the local `currentStory` state with the store whenever navigation changes:

```typescript
// Refresh story data when returning from canvas or other pages
useEffect(() => {
  if (currentStory) {
    const refreshedStory = useStoryStore.getState().getStory(currentStory.id);
    if (refreshedStory) {
      // Check if canvas data or other content has changed
      const hasChanges = refreshedStory.pages.some((page, index) => {
        const currentPage = currentStory.pages[index];
        return !currentPage || page.canvasData !== currentPage.canvasData || page.text !== currentPage.text;
      });
      
      if (hasChanges || refreshedStory.pages.length !== currentStory.pages.length) {
        setCurrentStory(refreshedStory);
      }
    }
  }
}, [location.pathname, currentStory]); // Refresh when navigation changes
```

### How It Works
1. Monitors `location.pathname` for navigation changes
2. When user returns from canvas page, the effect triggers
3. Fetches the latest story data from the store
4. Compares canvas data and text content between local and store versions
5. Updates local state if changes are detected
6. Canvas preview now shows the saved drawing

## Files Modified
- `/pages/ManualStoryCreationPage.tsx` - Added story refresh effect

## Testing Instructions

### Test 1: Canvas Persistence on Edit
1. Sign in to your account
2. Go to Library
3. Click "Edit" on an existing draft
4. Click "Edit Canvas" 
5. Draw something on the canvas
6. Click "Done" to return
7. ✅ **Verify**: Canvas drawing should be visible in the preview
8. Navigate away and come back
9. ✅ **Verify**: Canvas drawing is still there

### Test 2: Multiple Page Canvas
1. Create a new story with multiple pages
2. Add canvas drawings to page 1
3. Switch to page 2, add different drawings
4. Switch back to page 1
5. ✅ **Verify**: Page 1 canvas is preserved
6. Edit page 2 canvas again
7. ✅ **Verify**: Both pages maintain their drawings

### Test 3: Canvas Data After Save
1. Edit a draft with canvas drawings
2. Make text changes
3. Click "Save"
4. Navigate to canvas and add more drawings
5. Click "Done"
6. ✅ **Verify**: Both text changes and new canvas drawings are preserved

## Performance Considerations

The refresh effect uses efficient comparison:
- Only checks when navigation changes (not on every render)
- Compares specific fields (canvasData, text) instead of deep equality
- Skips update if no changes detected
- Minimal performance impact

## Related Issues Fixed
- ✅ Canvas drawings disappear when editing drafts
- ✅ Canvas data not syncing between store and component state
- ✅ Preview showing empty canvas despite saved data

## Future Improvements
- [ ] Consider using Zustand selectors instead of local state for `currentStory`
- [ ] Add optimistic UI updates for canvas saves
- [ ] Implement debounced auto-save for canvas changes
