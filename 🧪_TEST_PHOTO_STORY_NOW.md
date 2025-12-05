# 🧪 Test Photo Story Features - Quick Guide

## ⚡ Quick Test (5 Minutes)

### Test 1: OCR (Text Extraction) ✅ FIXED

1. **Open app** and login
2. **Create** → Photo Story modal
3. **Switch to "Text Extraction"** mode
4. **Capture/upload** an image with text (book page, sign, note)
5. **Click "Extract Text"**

**Expected**:
- ✅ Text extracts successfully
- ✅ NO "Authentication required" error
- ✅ Extracted text appears in textarea

**If still failing**:
- Open console (F12)
- Look for error message
- Check if token is found

---

### Test 2: Photo Story Page Images ⏳ NEEDS TESTING

1. **Open app** and login
2. **Create** → Photo Story modal
3. **Stay in "Photo Story"** mode
4. **Capture/upload** a photo
5. **Add context** (optional)
6. **Select art style** (e.g., Cartoon)
7. **Select genre** (e.g., Adventure)
8. **Click "Generate Story"**
9. **Open browser console** (F12) to watch logs
10. **Wait for generation** to complete
11. **Check the generated story**

**Expected**:
- ✅ Cover image generated
- ✅ Each page has **image + text**
- ✅ Console shows: `✅ Generated image for page 1, 2, 3...`

**If pages missing images**:
- ❌ Console shows errors
- ❌ Pages have text only (no images)

---

## 🔍 What to Check in Console

### Good Console Output ✅
```javascript
🎨 Generating cover with prompt: ...
✅ Base cover illustration generated
✅ Cover illustration with title text created

Creating illustration 1 of 5...
✅ Generated image for page 1

Creating illustration 2 of 5...
✅ Generated image for page 2

Creating illustration 3 of 5...
✅ Generated image for page 3
...

Story complete!
```

### Bad Console Output ❌
```javascript
❌ Error generating image for page 1: ...
⚠️ Failed to generate image for page 2
null returned from generateImage()
```

---

## 📊 Comparison

### Working (Both Cover + Pages)
```
Story:
├─ Cover Image ✅
├─ Page 1: Image + Text ✅
├─ Page 2: Image + Text ✅
├─ Page 3: Image + Text ✅
└─ Page 4: Image + Text ✅
```

### Broken (Only Cover)
```
Story:
├─ Cover Image ✅
├─ Page 1: TEXT ONLY ❌
├─ Page 2: TEXT ONLY ❌
├─ Page 3: TEXT ONLY ❌
└─ Page 4: TEXT ONLY ❌
```

---

## 🐛 If Page Images Still Missing

### Check Network Tab
1. **F12** → Network tab
2. **Filter**: image.pollinations.ai
3. **Generate story**
4. **Look for**:
   - Are requests being made?
   - Are they succeeding (200) or failing (4xx/5xx)?
   - Are they timing out?

### Check Console Logs
```javascript
// Good
✅ Generated image for page 1

// Bad
❌ Error generating image for page 1: TypeError...
null
undefined
```

### Check Story Data
```javascript
// In console
const stories = JSON.parse(localStorage.getItem('stories-storage'));
console.log(stories.state.stories[0].pages);

// Each page should have:
{
  id: "...",
  text: "...",
  canvasData: "https://image.pollinations.ai/..." // ← Should be URL
}

// If canvasData is null or empty, images didn't save
```

---

## 📝 Report Back

After testing, please share:

### OCR Test
- ✅ Working / ❌ Still failing
- Console error (if any)

### Page Images Test
- ✅ All pages have images
- ❌ Only cover has image, pages are text-only
- Console logs (copy/paste key lines)
- Network tab status (any failed requests?)

---

## 🎯 Quick Summary

**OCR Fix**: ✅ **Should work now** (token lookup fixed)  
**Page Images**: ⏳ **Needs your testing** (code looks correct)

---

**Ready to test?** Open the app and try both features! 🚀✨
