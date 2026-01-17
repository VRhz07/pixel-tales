# Fix AIStoryModal.tsx Prompt Structure

## ❌ THE REAL PROBLEM

We edited `geminiService.ts` but **the app doesn't use it!**

The actual flow is:
```
AIStoryModal.tsx (lines 154-187) 
  → geminiProxyService.ts (passthrough)
  → backend ai_proxy_views.py (passthrough)
  → Gemini API
```

**The prompt structure is defined in `AIStoryModal.tsx` lines 154-187!**

---

## Current Bad Example (Line 176)

```typescript
"imagePrompt": "${artStyle} illustration: [USE EXACT characterDescription HERE]. Scene: [what's happening on this page]. Style: ${artStyle}, [use colorScheme colors]"
```

**This is exactly what Gemini follows**, which is why you're getting:
```
cartoon illustration: [character description]. Scene: [action]. Style: cartoon, warm sunset tones
```

**Missing:**
- Camera angle
- Character positioning
- Detailed lighting
- Atmospheric effects
- Quality keywords

---

## The Fix

### Location
**File:** `frontend/src/components/creation/AIStoryModal.tsx`  
**Lines:** 154-187 (the `fullPrompt` variable)

### What to Replace

**FIND (lines 175-186):**
```typescript
EXAMPLE of good imagePrompt format:
"${artStyle} illustration: A 7-year-old girl with curly brown hair in two pigtails, bright green eyes, wearing a red and white striped t-shirt, blue denim overalls, and white sneakers. Scene: She discovers a magical door in her backyard garden. Style: ${artStyle}, warm sunset tones with orange and pink sky."

Make sure EVERY page's imagePrompt starts with the EXACT SAME character description!
```

**REPLACE WITH:**
```typescript
CRITICAL imagePrompt STRUCTURE - You MUST follow this EXACT format for EVERY page:

"${artStyle} illustration of [EXACT characterDescription with all details]. [Specific action/pose - VARIED per page]. [Detailed environment with specific objects, plants, weather]. [Camera angle: Wide establishing shot/Medium shot/Close-up shot/Low angle/High angle]. [Character position: positioned in lower right leaving space for text/centered in frame/upper left]. [Detailed lighting: warm golden hour lighting filtering through trees casting long shadows/soft overcast lighting/dramatic side lighting]. [Atmospheric effects: morning mist with light rays/sparkles/rain]. [Color palette using colorScheme]. Professional children's book illustration, detailed, high quality, vibrant colors, safe for children."

EXAMPLE 1 (establishing shot):
"${artStyle} illustration of a 7-year-old girl with curly brown hair in two pigtails, bright green eyes, wearing a red and white striped t-shirt, blue denim overalls, and white sneakers, standing with arms raised excitedly in a sun-dappled backyard garden with tall oak trees, colorful wildflowers, a white picket fence, and a mysterious glowing door. Wide establishing shot with girl positioned in lower right, leaving space for text at top. Warm golden hour lighting filtering through tree canopy, casting long playful shadows across grass. Morning mist creating atmospheric depth with soft light rays. Warm tones with orange, pink, soft yellow sky. Professional children's book illustration, detailed, vibrant colors, safe for children."

EXAMPLE 2 (close-up emotional):
"${artStyle} illustration of a 7-year-old girl with curly brown hair in two pigtails, bright green eyes, wearing a red and white striped t-shirt, blue denim overalls, and white sneakers, sitting cross-legged with a curious expression examining a glowing magical key in her hands, surrounded by floating sparkles. Close-up shot focusing on girl's face and hands, positioned in upper right with negative space on left for text. Soft magical glow from key illuminating her face from below, creating wonder in her eyes. Sparkles and light particles floating in air. Warm magical tones with soft yellows and pinks. Professional children's book illustration, expressive character art, detailed, safe for children."

EXAMPLE 3 (action scene):
"${artStyle} illustration of a 7-year-old girl with curly brown hair in two pigtails, bright green eyes, wearing a red and white striped t-shirt, blue denim overalls, and white sneakers, running joyfully through a field of tall sunflowers with butterflies flying around her. Dynamic low angle shot capturing movement with girl in center frame, showing energy and motion. Bright afternoon sunlight creating strong shadows and highlighting the golden sunflowers. Blue butterflies adding pops of color. Vibrant warm colors with yellows, oranges, and blue sky. Professional children's book illustration, dynamic composition, detailed, safe for children."

Make sure EVERY page's imagePrompt:
1. Starts with EXACT SAME characterDescription
2. Has DIFFERENT specific action/pose
3. Has UNIQUE environment details
4. Includes explicit camera angle
5. Includes character position in frame
6. Has detailed lighting description (not just color)
7. Includes atmospheric effects
8. Ends with quality keywords
```

---

## Quick Instructions

1. Open `frontend/src/components/creation/AIStoryModal.tsx`
2. Press `Ctrl+F` and search for: `EXAMPLE of good imagePrompt format:`
3. Select from that line down to `Make sure EVERY page's imagePrompt starts`
4. Replace with the new text above
5. Save the file

---

## Why This Will Work

**Before:**
- Gemini sees: `Scene: [action]. Style: [colors]`
- Gemini copies this simple format
- Result: Missing camera angles, positioning, lighting details

**After:**
- Gemini sees 3 COMPLETE examples with ALL elements
- Gemini sees MANDATORY requirements list
- Gemini understands the expected structure
- Result: Complete prompts with all elements

---

## Expected Result

**Before fix:**
```
cartoon illustration: Maya, 7 years old, black hair... Scene: waving goodbye. Style: cartoon, warm sunset tones
```

**After fix:**
```
Cartoon illustration of Maya, a 7-year-old girl with straight shoulder-length black hair wearing a pink headband, bright brown eyes, yellow t-shirt with fish print, green shorts, and blue rubber sandals, waving goodbye with both hands raised to a large fish swimming away in crystal clear tropical water with coral reef and colorful fish in background. Wide establishing shot with Maya positioned in lower right, fish in upper left, leaving space for text. Warm sunset lighting filtering through water creating dancing light patterns and beautiful caustics on sandy bottom. Light rays piercing through from surface. Warm tropical colors with orange, pink, turquoise water, golden sand. Professional children's book illustration, detailed watercolor style, underwater atmospheric lighting, high quality, safe for children.
```

---

## File to Edit

**frontend/src/components/creation/AIStoryModal.tsx**

Lines 175-186

---

## Test After Fix

1. Restart frontend dev server
2. Generate a test story (5 pages, Tagalog is fine)
3. Check browser console for imagePrompt previews
4. Look for:
   - ✅ Camera angles mentioned
   - ✅ Character positioning mentioned
   - ✅ Detailed lighting (not just colors)
   - ✅ Quality keywords at end
