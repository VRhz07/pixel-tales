# Offline Games Debug Guide

## 🔍 How to Debug the Issue

The enhanced logging will help us identify why the games button isn't showing offline.

## 📝 Step-by-Step Testing with Console

### Step 1: Save Story Offline (While Online)
1. **Open your browser's Developer Console** (F12)
2. **Go to Console tab**
3. **Navigate to a story with games**
4. **Click "Save Offline" button**
5. **Look for these logs:**

```
✅ Saved story for offline reading
🎮 Fetching games to cache for offline play...
📝 Using ID for caching: [NUMBER] backendStoryId: [NUMBER] storyId: [STRING]
📖 Story object: {
  id: "[STRING]",
  backendId: [NUMBER],
  title: "Story Title"
}
✅ Cached 3 games list
✅ Cached game 171 (Multiple Choice Quiz) questions
✅ Cached game 172 (Fill in the Blanks) questions
✅ Cached game 173 (Word Search) questions
🎉 Story and 3/3 games saved for offline play!
```

**📋 Write down the following:**
- What is the `backendStoryId`? → `_________`
- What is the `storyId`? → `_________`
- What is `story.id`? → `_________`
- What is `story.backendId`? → `_________`

### Step 2: Check LocalStorage
1. **In Developer Console, go to "Application" tab** (Chrome) or "Storage" tab (Firefox)
2. **Click "Local Storage" → Your localhost URL**
3. **Look for keys that start with:** `games_cache_story_games_`
4. **Find the game cache key** - it should be like: `games_cache_story_games_171`

**📋 Write down:**
- What is the full cache key? → `_________`
- What number is at the end? → `_________`

### Step 3: Go Offline and Check
1. **Turn off internet** (WiFi/Data)
2. **Refresh the page** (or close and reopen)
3. **Go to Library → Offline**
4. **Click on the saved story**
5. **Watch the console logs:**

```
📖 Loaded story from local store: Story Title
🎮 Checking games - backendStoryId: [VALUE] storyId: [VALUE] user: [USERNAME]
🔍 Checking cache with IDs: [ARRAY OF IDS]
❌ No cached games found for ID: [ID1]
❌ No cached games found for ID: [ID2]
❌ No cached games found for ID: [ID3]
❌ No cached games found for any ID variant
```

**📋 Write down:**
- What IDs are being checked? → `_________`
- Do any of them match the cache key from Step 2? → `_________`

---

## 🔧 Common Issues and Solutions

### Issue 1: ID Mismatch
**Problem:** Cache key uses ID `171` but checking uses ID `"abc123xyz"`

**Solution:** The story object needs to preserve the `backendId` when saved offline.

**Check:** In Step 3, does `story.backendId` exist in the IDs being checked?

### Issue 2: Story Not Loaded from Cache
**Problem:** Story loads but doesn't have all its properties

**Solution:** Verify the offline story has the `backendId` field

**Check in Console:**
```javascript
// Type this in console while viewing offline story:
console.log('Story from store:', storyStore.getStory('YOUR_STORY_ID'));
```

### Issue 3: Cache Key Format Wrong
**Problem:** Cache is saved with different key format than expected

**Check:** The cache key should be `games_cache_story_games_{backendId}`

---

## 🛠️ Manual Debug Commands

While viewing the offline story, open the console and run these commands:

### Check if games are cached:
```javascript
// Replace 171 with your story's backend ID
const cached = localStorage.getItem('games_cache_story_games_171');
console.log('Cached games:', cached ? JSON.parse(cached) : 'NOT FOUND');
```

### Check what story ID is being used:
```javascript
// Get current story from URL
const urlParams = new URLSearchParams(window.location.search);
const storyId = window.location.pathname.split('/').pop();
console.log('Story ID from URL:', storyId);
```

### List all game caches:
```javascript
const keys = Object.keys(localStorage);
const gameCaches = keys.filter(k => k.startsWith('games_cache_'));
console.log('All game caches:', gameCaches);
```

### Check the offline story object:
```javascript
// This depends on your store structure
const stores = JSON.parse(localStorage.getItem('storybook-store') || '{}');
console.log('Offline stories:', stores.userLibraries);
```

---

## 📊 Expected vs Actual Comparison

Fill this out based on your testing:

| Item | Expected | Actual | Match? |
|------|----------|--------|--------|
| Cache Key ID | 171 | _____ | ☐ |
| backendStoryId | 171 | _____ | ☐ |
| storyId | _____ | _____ | ☐ |
| story.backendId | 171 | _____ | ☐ |
| story.id | _____ | _____ | ☐ |

---

## 🎯 The Fix (Once We Identify the Issue)

Based on the debug results, we'll need to ensure:

1. **When saving offline:** Cache games with the same ID that will be checked later
2. **When loading offline:** Check for games using the same ID that was used for caching
3. **Story object:** Must preserve `backendId` when saved to offline storage

---

## 📞 What to Report

After running the debug steps, please share:

1. **Console logs from Step 1** (saving offline)
2. **LocalStorage cache key from Step 2**
3. **Console logs from Step 3** (loading offline)
4. **Filled comparison table above**

This will help identify exactly where the ID mismatch is happening!

---
**Debug Guide by:** Rovo Dev  
**Date:** December 18, 2025
