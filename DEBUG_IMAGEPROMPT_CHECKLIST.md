# Debug Checklist: Tracking imagePrompt Through the System

## Current Debug Logging Status

✅ **AIStoryModal.tsx** - Has comprehensive logging (Lines 278-313, 452-469)
✅ **imageGenerationService.ts** - Has logging for missing imagePrompt (Line 608)
❌ **Backend Replicate proxy** - No prompt logging currently

---

## How to Use Existing Debug Logs

Your system already has extensive debug logging. When you generate a story, check your **browser console** for these key messages:

### Step 1: Check Gemini Response (After Story Generation)

Look for this section in console:
```
========================================
🔍 GEMINI RESPONSE STRUCTURE VALIDATION
========================================
🔍 Full storyData keys: [...]
🔍 storyData.pages exists: true
🔍 storyData.pages is array: true
🔍 Story has X pages, Y have imagePrompt

🔍 Page 1 details:
   Keys: [pageNumber, mood, text, imagePrompt, ...]
   Has imagePrompt: true/false
   imagePrompt (first 100 chars): ...
   
🔍 Page 2 details:
   ...
```

### Step 2: Check Image Generation Call

Look for:
```
========================================
🔍 STARTING PAGE ILLUSTRATIONS GENERATION
========================================
🔍 Pages to generate images for: X
🔍 First page structure: [...]
🔍 First page has imagePrompt: true/false
🔍 First page imagePrompt preview: ...

🔍 ALL PAGES STRUCTURE:
   Page 1: keys = [...], hasImagePrompt = true/false
   Page 2: keys = [...], hasImagePrompt = true/false
```

### Step 3: Check Image Service

Look for:
```
🎨 generateStoryIllustrationsFromPrompts called with:
   pageCount: X
   pagesStructure: [
     {index: 0, hasImagePrompt: true, imagePromptPreview: "..."}
   ]
```

And for each page:
```
🖼️ Page X/Y: Starting image generation...
🎨 Generating image with Replicate (FLUX model)...
✅ Image generated via Replicate backend proxy
```

Or errors:
```
❌ Page X missing imagePrompt field!
   Available keys: [...]
```

---

## Common Issues and What to Look For

### ❌ Issue 1: Gemini Not Generating imagePrompt

**Symptom in console:**
```
❌ PROBLEM: NO PAGES HAVE imagePrompt FIELD!
🔍 This means Gemini did not generate the imagePrompt field.
```

**What to check:**
- Look at the full first page object logged in console
- Check if pages have `illustrationDescription` but no `imagePrompt`
- This means Gemini's prompt needs adjustment

**Solution:**
- Check `geminiService.ts` line 216-232 for the JSON format instructions
- Gemini may be ignoring the imagePrompt field requirement

---

### ❌ Issue 2: imagePrompt Field Gets Stripped During Parsing

**Symptom in console:**
```
🔍 Story has 5 pages, 0 have imagePrompt
   Keys: [pageNumber, text, mood, illustrationDescription]
   (imagePrompt is missing from keys)
```

**What to check:**
- The JSON parsing code may have an issue
- Check if the raw Gemini response includes imagePrompt before parsing

**Solution:**
- Look at `AIStoryModal.tsx` lines 200-275 (JSON parsing section)
- Check the "Raw generated text" logged to console

---

### ❌ Issue 3: Empty imagePrompt Values

**Symptom in console:**
```
🔍 Has imagePrompt: true
   imagePrompt (first 100 chars): undefined...
```

**What to check:**
- imagePrompt field exists but is empty or undefined
- Gemini generated the field but didn't populate it

---

### ❌ Issue 4: Replicate Not Receiving Prompt

**Symptom in console:**
```
🎨 Generating image with Replicate (FLUX model)...
(No logs from backend about what prompt was received)
```

**Currently Missing:** Backend logs for received prompts

---

## Quick Diagnostic Steps

### Step A: Generate a Test Story

1. Open browser DevTools (F12) → Console tab
2. Clear console (Ctrl+L or click 🚫)
3. Generate a simple 5-page story
4. Watch console output during generation

### Step B: Check for Red Error Messages

Look for these critical errors:
```
❌ PROBLEM: NO PAGES HAVE imagePrompt FIELD!
❌ Page X missing imagePrompt field!
❌ Replicate image generation failed
```

### Step C: Export Console Logs

If you see issues:
1. Right-click in console → "Save as..."
2. Save the log file
3. Search for "imagePrompt" in the file
4. Count how many times you see "Has imagePrompt: true"

---

## What Information to Provide

If you're experiencing issues, please provide:

1. **Console output** during story generation (especially the validation sections)
2. **Specific error messages** you see
3. **Page count** - how many pages does Gemini say it has vs how many have imagePrompt
4. **First page structure** - what keys does the first page have?

Example format:
```
Issue: Images not generating

Console shows:
- Gemini returned 5 pages
- 0 pages have imagePrompt field
- First page keys: [pageNumber, text, mood, illustrationDescription]
- Missing: imagePrompt field

Expected: All pages should have imagePrompt field
```

---

## Additional Backend Logging Needed

To add backend logging for Replicate prompts, we need to add logging in:
- `backend/storybook/ai_proxy_views.py` line 362 (in `generate_image_with_replicate`)

This would log:
```python
print(f"📝 Received prompt from frontend (length: {len(prompt)})")
print(f"📝 Prompt preview: {prompt[:200]}...")
```

Would you like me to add this backend logging?

---

## Summary

**Your frontend already has comprehensive debug logging!** 

When you generate a story, check your browser console for:
1. ✅ Whether Gemini returned imagePrompt fields (lines 278-313)
2. ✅ Whether pages have imagePrompt before image generation (lines 452-469)
3. ✅ Whether individual pages are missing imagePrompt (imageGenerationService.ts line 608)

**The only missing piece is backend logging** to see what prompt Replicate actually receives.

---

## Next Steps

Please try generating a story and tell me:
1. What do you see in the browser console?
2. Are there any red error messages about missing imagePrompt?
3. Do pages have the imagePrompt field when validated?
4. Are images being generated at all?

This will help identify exactly where the issue is occurring.
