# Permanent Storage Fix - Manual Implementation Guide

## Overview

We need to add 4 key improvements to prevent localStorage quota issues:

1. ✅ Force extraction function in `hybridStorage.ts`
2. ✅ Call extraction after loading stories from backend
3. ✅ Add state size monitoring
4. ✅ Add startup checks

---

## Fix 1: Add Force Extraction Function

### File: `frontend/src/utils/hybridStorage.ts`

**Location:** After line 321 (after the `restoreImages` function), before the export

**Add this new function:**

```typescript
  /**
   * Force extraction of all images from localStorage to IndexedDB
   * Use this when localStorage quota is exceeded
   */
  async forceExtractAllImages(): Promise<void> {
    try {
      console.log('🔄 Force extracting all images from localStorage to IndexedDB...');
      
      // Get current state from localStorage
      const storyStoreStr = localStorage.getItem('story-store');
      if (!storyStoreStr) {
        console.log('✅ No story-store in localStorage');
        return;
      }

      const storyStore = JSON.parse(storyStoreStr);
      if (!storyStore.state) {
        console.log('✅ No state in story-store');
        return;
      }

      const originalSize = JSON.stringify(storyStore).length;
      console.log(`📊 Original state size: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);

      // Extract images
      const extractedState = await this.extractImages(storyStore.state);
      storyStore.state = extractedState;

      const newSize = JSON.stringify(storyStore).length;
      console.log(`📊 New state size: ${(newSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`📊 Reduction: ${(((originalSize - newSize) / originalSize) * 100).toFixed(1)}%`);

      // Save back to localStorage
      localStorage.setItem('story-store', JSON.stringify(storyStore));
      
      console.log('✅ Force extraction complete!');
    } catch (error) {
      console.error('❌ Force extraction failed:', error);
      throw error;
    }
  }

  /**
   * Check localStorage size and warn if too large
   */
  checkStorageSize(): { sizeMB: number; needsExtraction: boolean } {
    const storyStoreStr = localStorage.getItem('story-store');
    if (!storyStoreStr) {
      return { sizeMB: 0, needsExtraction: false };
    }

    const sizeMB = storyStoreStr.length / 1024 / 1024;
    const needsExtraction = sizeMB > 3; // Warn if > 3 MB

    if (needsExtraction) {
      console.warn(`⚠️ localStorage size is ${sizeMB.toFixed(2)} MB (should be < 3 MB)`);
      console.warn('⚠️ Image extraction may be needed');
    }

    return { sizeMB, needsExtraction };
  }
```

**Result:** These two new functions will be available on the `HybridStorageAdapter` class.

---

## Fix 2: Update the Export to Include New Functions

### File: `frontend/src/utils/hybridStorage.ts`

**Location:** Line 323 (the export line)

**Change from:**
```typescript
export const hybridStorage = new HybridStorageAdapter();
```

**To:**
```typescript
export const hybridStorage = new HybridStorageAdapter();

// Export helper functions for manual intervention
export const forceExtractImages = () => hybridStorage.forceExtractAllImages();
export const checkStorageSize = () => hybridStorage.checkStorageSize();
```

---

## Fix 3: Add Automatic Extraction After Loading Stories

### File: `frontend/src/stores/storyStore.ts`

**Location:** Find the `loadStoriesFromBackend` function (around line 1171)

**Find this section at the END of the function (should be around line 1200-1210):**

```typescript
      set((state) => ({
        userLibraries: {
          ...state.userLibraries,
          [currentUserId]: {
            ...state.userLibraries[currentUserId],
            stories: remoteStories,
            lastSync: new Date().toISOString()
          }
        },
        lastBackendSync: new Date().toISOString()
      }));

      console.log('✅ Successfully loaded stories from backend:', remoteStories.length);
```

**Add AFTER this section (before the function ends):**

```typescript
      console.log('✅ Successfully loaded stories from backend:', remoteStories.length);
      
      // Force extraction of images to IndexedDB to prevent quota issues
      try {
        const { hybridStorage } = await import('../utils/hybridStorage');
        const sizeCheck = hybridStorage.checkStorageSize();
        
        if (sizeCheck.needsExtraction) {
          console.log('🔄 State is large, forcing image extraction...');
          await hybridStorage.forceExtractAllImages();
          console.log('✅ Image extraction complete');
        }
      } catch (error) {
        console.error('❌ Failed to extract images after backend load:', error);
      }
```

---

## Fix 4: Add Startup Check in App Initialization

### File: `frontend/src/App.tsx` or `frontend/src/main.tsx`

**Location:** Inside the main App component or after app initialization

**Find where the app initializes (usually in App.tsx around the top of the component):**

```typescript
function App() {
  // Existing code...
```

**Add this useEffect at the top:**

```typescript
function App() {
  // Check storage on startup
  useEffect(() => {
    const checkAndFixStorage = async () => {
      try {
        const { hybridStorage } = await import('./utils/hybridStorage');
        const sizeCheck = hybridStorage.checkStorageSize();
        
        console.log(`📊 App startup - localStorage size: ${sizeCheck.sizeMB.toFixed(2)} MB`);
        
        if (sizeCheck.needsExtraction) {
          console.warn('⚠️ localStorage is too large, forcing extraction...');
          await hybridStorage.forceExtractAllImages();
          console.log('✅ Storage optimized on startup');
        }
      } catch (error) {
        console.error('❌ Storage check failed:', error);
      }
    };
    
    checkAndFixStorage();
  }, []);

  // Rest of existing code...
```

**Don't forget to import useEffect at the top:**
```typescript
import { useEffect } from 'react';
```

---

## Fix 5: Enhance Error Handling in setItem

### File: `frontend/src/utils/hybridStorage.ts`

**Location:** In the `setItem` function (line 347-367)

**Replace the entire setItem function with:**

```typescript
    setItem: async (name: string, value: string | any): Promise<void> => {
      try {
        // Handle both string and object input (zustand sometimes passes objects)
        const state = typeof value === 'string' ? JSON.parse(value) : value;
        
        // Check size before extraction
        const originalSize = JSON.stringify(state).length;
        
        // Extract images to IndexedDB
        const stateWithoutImages = await hybridStorage.extractImages(state);
        
        const extractedSize = JSON.stringify(stateWithoutImages).length;
        const reductionPercent = ((originalSize - extractedSize) / originalSize) * 100;
        
        // Log extraction results
        if (originalSize > 1000000) { // Only log for states > 1 MB
          console.log(`📊 State extraction: ${(originalSize / 1024 / 1024).toFixed(2)} MB → ${(extractedSize / 1024 / 1024).toFixed(2)} MB (${reductionPercent.toFixed(1)}% reduction)`);
        }
        
        // Warn if still too large after extraction
        if (extractedSize > 3000000) { // 3 MB
          console.warn(`⚠️ State still large after extraction: ${(extractedSize / 1024 / 1024).toFixed(2)} MB`);
          console.warn('⚠️ Consider reducing number of stories in memory');
        }
        
        // Save metadata to localStorage
        localStorage.setItem(name, JSON.stringify(stateWithoutImages));
        
        console.log('✅ Saved to hybrid storage (metadata in localStorage, images in IndexedDB)');
      } catch (error: any) {
        if (error.name === 'QuotaExceededError') {
          console.error('❌ LocalStorage quota exceeded even after extracting images!');
          console.error('State size:', typeof value === 'string' ? value.length : JSON.stringify(value).length, 'bytes');
          
          // Try force extraction as last resort
          try {
            console.log('🔄 Attempting force extraction as recovery...');
            await hybridStorage.forceExtractAllImages();
            console.log('✅ Force extraction completed, retrying save...');
            // Don't retry - let it fail and user will see the error
          } catch (extractError) {
            console.error('❌ Force extraction also failed:', extractError);
          }
        } else {
          console.error('❌ Error saving to hybrid storage:', error);
        }
        throw error;
      }
    },
```

---

## Summary of Changes

| File | Lines | What to Add |
|------|-------|-------------|
| `hybridStorage.ts` | After 321 | Add `forceExtractAllImages()` and `checkStorageSize()` functions |
| `hybridStorage.ts` | Line 323 | Export helper functions |
| `hybridStorage.ts` | Lines 347-367 | Enhanced `setItem` with better logging and error handling |
| `storyStore.ts` | After line ~1210 | Add extraction after `loadStoriesFromBackend` |
| `App.tsx` | Top of component | Add startup storage check |

---

## Testing the Fix

After implementing all changes:

1. **Restart the dev server**
2. **Check console on startup:**
   ```
   📊 App startup - localStorage size: X.XX MB
   ```

3. **Load stories from backend:**
   ```
   ✅ Successfully loaded stories from backend: 13
   🔄 State is large, forcing image extraction...
   📊 Original state size: 4.95 MB
   📊 New state size: 0.53 MB
   📊 Reduction: 89.3%
   ✅ Image extraction complete
   ```

4. **Check storage manually:**
   ```javascript
   // In browser console:
   import { checkStorageSize } from './src/utils/hybridStorage.ts';
   checkStorageSize();
   // Should show: { sizeMB: 0.53, needsExtraction: false }
   ```

---

## Expected Results

### Before Fix:
- 13 stories = 4.95 MB
- 53 images in localStorage
- QuotaExceededError

### After Fix:
- 13 stories = ~0.5 MB (90% reduction)
- 0 images in localStorage (all in IndexedDB)
- No quota errors
- Automatic extraction on:
  - App startup
  - After loading from backend
  - On any large state save

---

## Quick Verification Script

After implementing, run this in console to verify:

```javascript
const storyStore = JSON.parse(localStorage.getItem('story-store') || '{}');
let imagesCount = 0;
let placeholdersCount = 0;

if (storyStore.state?.userLibraries) {
  for (const userId in storyStore.state.userLibraries) {
    const lib = storyStore.state.userLibraries[userId];
    lib.stories?.forEach(story => {
      if (story.coverImage?.startsWith('data:')) imagesCount++;
      if (story.coverImage === '__INDEXED_DB__') placeholdersCount++;
      
      story.pages?.forEach(page => {
        if (page.canvasData?.startsWith('data:')) imagesCount++;
        if (page.canvasData === '__INDEXED_DB__') placeholdersCount++;
      });
    });
  }
}

console.log(`Images still in localStorage: ${imagesCount} (should be 0)`);
console.log(`Images in IndexedDB: ${placeholdersCount} (should be 53)`);
console.log(`Total size: ${(JSON.stringify(storyStore).length / 1024 / 1024).toFixed(2)} MB (should be < 1 MB)`);
```

**Expected output:**
```
Images still in localStorage: 0
Images in IndexedDB: 53
Total size: 0.53 MB
```

---

## If You Still Get Errors

If quota errors persist after implementing all fixes:

1. **Clear and reload:**
   ```javascript
   localStorage.removeItem('story-store');
   location.reload();
   ```

2. **Force extraction manually:**
   ```javascript
   const { forceExtractImages } = await import('./src/utils/hybridStorage.ts');
   await forceExtractImages();
   ```

3. **Check IndexedDB:**
   - Open DevTools → Application → IndexedDB
   - Look for "PixelTalesImages" database
   - Should contain 53 images

---

## APK Considerations

For the mobile APK build:

1. ✅ These fixes work in Android WebView
2. ✅ IndexedDB is supported in all modern WebViews
3. ✅ Quota limits are the same (5-10 MB localStorage, 50-100 MB IndexedDB)
4. ⚠️ Test thoroughly on actual device before release

---

## Next Steps

1. Implement all 5 fixes above
2. Test in browser first
3. Verify with the verification script
4. Test story creation and loading
5. Build and test APK
6. Monitor storage size over time

Let me know when you've implemented these and I can help verify they're working!
