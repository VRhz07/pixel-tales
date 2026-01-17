# Text-to-Image Prompt Flow Analysis

## Problem Statement
The text-to-image prompt being sent to Replicate AI is not including all the structure for the pages info JSON. We need to understand how the system creates this JSON structure.

---

## Complete Flow Diagram

```
1. User Input (AIStoryModal.tsx)
   ↓
2. Gemini AI Story Generation (geminiService.ts)
   ↓
3. Parse JSON Response with Pages Structure
   ↓
4. Extract imagePrompt from each page
   ↓
5. Send to Image Generation Service (imageGenerationService.ts)
   ↓
6. Backend Proxy (ai_proxy_views.py)
   ↓
7. Replicate API
```

---

## Step-by-Step Breakdown

### 1. User Input (AIStoryModal.tsx - Line 127-628)
**Location**: `frontend/src/components/creation/AIStoryModal.tsx`

The user provides:
- Story idea
- Genres
- Art style
- Page count
- Language

```typescript
const handleGenerate = async () => {
  // User input collected in formData
  const selectedGenreNames = formData.selectedGenres.map(id => 
    genres.find(g => g.id === id)?.name || id
  ).join(', ');
  
  const artStyle = formData.selectedArtStyle || 'cartoon';
  const fullPrompt = `Generate a ${selectedGenreNames} story...`;
  
  // Call Gemini to generate story
  const generatedText = await generateStoryWithGemini(fullPrompt, {...});
}
```

---

### 2. Gemini AI Story Generation (geminiService.ts - Line 116-334)
**Location**: `frontend/src/services/geminiService.ts`

Gemini is instructed to return a JSON structure with **pages array**, each containing:
- `pageNumber`
- `narrativePurpose`
- `mood`
- `illustrationDescription`
- **`imagePrompt`** ← THIS IS THE KEY FIELD
- `text`

**Critical Instructions in Prompt (Line 222-232)**:
```typescript
"pages": [
  {
    "pageNumber": 1,
    "narrativePurpose": "introduction/problem/action/climax/resolution",
    "mood": "happy/sad/exciting/calm/dramatic",
    "illustrationDescription": "Brief human-readable description",
    "imagePrompt": "DETAILED TEXT-TO-IMAGE PROMPT: [Art style]...",
    "text": "The story text for this page"
  }
]
```

**The imagePrompt field is supposed to contain**:
- Art style
- EXACT character description with all details
- Specific action/pose (VARIED per page)
- COMPLETELY DIFFERENT detailed environment
- VARIED camera angle
- DIFFERENT character position
- UNIQUE lighting and atmosphere

---

### 3. Parse JSON Response (AIStoryModal.tsx - Line 200-337)
**Location**: `frontend/src/components/creation/AIStoryModal.tsx`

```typescript
// Parse the JSON response from Gemini
let storyData;
try {
  // Extract JSON from markdown code blocks
  // Clean up trailing commas
  storyData = JSON.parse(jsonText);
  
  // VALIDATION: Check if pages have imagePrompt field
  console.log('🔍 Full storyData keys:', Object.keys(storyData));
  console.log('🔍 storyData.pages exists:', !!storyData.pages);
  
  if (storyData.pages && Array.isArray(storyData.pages)) {
    storyData.pages.forEach((page: any, i: number) => {
      console.log(`🔍 Page ${i + 1} details:`);
      console.log(`   Has imagePrompt: ${!!page.imagePrompt}`);
      if (page.imagePrompt) {
        console.log(`   imagePrompt: ${page.imagePrompt.substring(0, 100)}...`);
      }
    });
  }
}
```

**Expected Structure**:
```json
{
  "title": "Story Title",
  "description": "Story summary",
  "characterDescription": "Detailed character appearance",
  "colorScheme": "Color palette",
  "pages": [
    {
      "pageNumber": 1,
      "narrativePurpose": "introduction",
      "mood": "happy",
      "illustrationDescription": "Brief description",
      "imagePrompt": "FULL DETAILED PROMPT HERE",
      "text": "Page text"
    }
  ]
}
```

---

### 4. Image Generation Call (AIStoryModal.tsx - Line 447-498)
**Location**: `frontend/src/components/creation/AIStoryModal.tsx`

```typescript
const { generateStoryIllustrationsFromPrompts } = await import('../../services/imageGenerationService');

// Pages to generate images for
console.log('🔍 Pages to generate images for:', storyData.pages?.length || 0);
console.log('🔍 First page has imagePrompt:', !!storyData.pages[0].imagePrompt);

// CALL the image generation function
imageUrls = await generateStoryIllustrationsFromPrompts(
  storyData.pages || [],
  storyData.characterDescription,
  (current, total, message) => {
    setGenerationProgress(...)
  }
);
```

---

### 5. Image Generation Service (imageGenerationService.ts - Line 579-681)
**Location**: `frontend/src/services/imageGenerationService.ts`

```typescript
export const generateStoryIllustrationsFromPrompts = async (
  pages: Array<{ 
    imagePrompt?: string;
    text?: string;
    pageNumber?: number;
  }>,
  characterDescription?: string,
  onProgress?: (current: number, total: number, message: string) => void
): Promise<(string | null)[]> => {
  
  console.log('🎨 generateStoryIllustrationsFromPrompts called with:', {
    pageCount: pages.length,
    pagesStructure: pages.map((p, i) => ({
      index: i,
      hasImagePrompt: !!p.imagePrompt,
      imagePromptPreview: p.imagePrompt?.substring(0, 80) + '...',
    }))
  });
  
  const results: (string | null)[] = [];
  
  // Process pages sequentially
  for (let index = 0; index < pages.length; index++) {
    const page = pages[index];
    
    if (!page.imagePrompt) {
      console.error(`❌ Page ${index + 1} missing imagePrompt field!`);
      results.push(null);
      continue;
    }
    
    // Generate unique seed
    const uniqueSeed = Date.now() + (index * 10000);
    
    // Try Replicate first
    let imageUrl = await generateImageWithReplicate({
      prompt: page.imagePrompt,  // ← USES imagePrompt DIRECTLY
      width: 1024,
      height: 1024,
      seed: uniqueSeed,
      pageNumber: page.pageNumber || (index + 1),
      totalPages: pages.length
    });
    
    results.push(imageUrl);
  }
  
  return results;
}
```

---

### 6. Replicate API Call (imageGenerationService.ts - Line 156-190)
**Location**: `frontend/src/services/imageGenerationService.ts`

```typescript
export const generateImageWithReplicate = async (params: ImageGenerationParams): Promise<string | null> => {
  const { prompt, width = 1024, height = 1024, seed } = params;
  
  try {
    console.log('🎨 Generating image with Replicate (FLUX model)...');
    const response = await apiService.post('/ai/replicate/generate-image/', {
      prompt: prompt,  // ← SENDS THE imagePrompt HERE
      width,
      height,
      model: 'flux-schnell',
      seed: seed || Math.floor(Math.random() * 1000000),
    });

    if (response.success && response.imageUrl) {
      return response.imageUrl;
    }
  } catch (error) {
    console.error('❌ Replicate image generation failed:', error);
    return null;
  }
};
```

---

### 7. Backend Replicate Proxy (ai_proxy_views.py - Line 344-459)
**Location**: `backend/storybook/ai_proxy_views.py`

```python
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_image_with_replicate(request):
    """
    Generate images using Replicate API
    Supports FLUX and Stable Diffusion models
    """
    try:
        prompt = request.data.get('prompt', '')  # ← RECEIVES THE imagePrompt
        model = request.data.get('model', 'flux-schnell')
        width = request.data.get('width', 1024)
        height = request.data.get('height', 1024)
        seed = request.data.get('seed')
        
        # Prepare input based on model type
        input_params = {
            "prompt": prompt,  # ← SENDS TO REPLICATE
        }
        
        # FLUX models use aspect_ratio
        if 'flux' in model.lower():
            aspect_ratio = '1:1'  # or calculated from width/height
            input_params["aspect_ratio"] = aspect_ratio
            input_params["num_outputs"] = 1
        
        if seed and seed != -1:
            input_params["seed"] = int(seed)
        
        print(f"🎨 Generating image with Replicate: {replicate_model}")
        print(f"📝 Input params: {input_params}")
        
        # Run the model
        output = replicate.run(replicate_model, input=input_params)
        
        # Extract image URL from output
        image_url = output[0].url() if hasattr(output[0], 'url') else str(output[0])
        
        return Response({
            'success': True,
            'imageUrl': str(image_url),
            'model': model,
            'provider': 'replicate'
        })
        
    except Exception as e:
        return Response(
            {'error': f'Replicate generation failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
```

---

## Critical Issue: Where the Pages JSON Structure Might Be Lost

### The Problem
The **pages JSON structure** you're asking about is NOT being sent to Replicate. Here's why:

1. **Gemini generates the full pages structure** (with imagePrompt per page)
2. **Frontend extracts ONLY the `imagePrompt` field** from each page
3. **Each `imagePrompt` is sent individually** to Replicate as a simple string
4. **Replicate receives ONLY the prompt text**, not the full page structure

### What IS Being Sent to Replicate

```json
// NOT THIS (full structure):
{
  "pages": [
    {
      "pageNumber": 1,
      "mood": "happy",
      "imagePrompt": "Cartoon illustration...",
      "text": "Story text"
    }
  ]
}

// BUT THIS (just the prompt string):
{
  "prompt": "Cartoon illustration of a small fox...",
  "width": 1024,
  "height": 1024,
  "model": "flux-schnell",
  "seed": 1234567890
}
```

---

## Why This Is Correct (By Design)

Replicate's image generation API **only accepts a text prompt**, not a JSON structure. The flow is:

1. **Gemini creates structured pages JSON** with imagePrompt per page
2. **Frontend stores the full structure** in the story store
3. **Frontend extracts imagePrompt** from each page
4. **Frontend sends ONLY the imagePrompt text** to Replicate (one at a time)
5. **Replicate generates an image** from that text prompt
6. **Frontend receives image URL** and associates it with the page

---

## Debugging Checklist

If images are not being generated correctly, check:

### ✅ 1. Does Gemini return imagePrompt field?
```typescript
// In AIStoryModal.tsx after parsing
console.log('Pages with imagePrompt:', 
  storyData.pages.filter(p => p.imagePrompt).length
);
```

### ✅ 2. Is imagePrompt being passed to generation?
```typescript
// In imageGenerationService.ts
console.log('Generating with prompt:', page.imagePrompt?.substring(0, 100));
```

### ✅ 3. Is backend receiving the prompt?
```python
# In ai_proxy_views.py
print(f"Received prompt: {prompt[:100]}...")
```

### ✅ 4. Is Replicate returning an image?
```python
# In ai_proxy_views.py
print(f"✅ Image generated: {image_url}")
```

---

## Solution: If imagePrompt is Missing

If Gemini is NOT generating the `imagePrompt` field, you need to:

1. **Check Gemini's prompt instructions** (geminiService.ts line 216-280)
2. **Verify Gemini's response** includes imagePrompt in each page
3. **Ensure JSON parsing** doesn't strip the imagePrompt field

### Example Debug Code

```typescript
// Add this after parsing in AIStoryModal.tsx (line 278-313)
console.log('========================================');
console.log('🔍 GEMINI RESPONSE VALIDATION');
console.log('========================================');
storyData.pages.forEach((page: any, i: number) => {
  console.log(`Page ${i + 1}:`);
  console.log(`  Keys: [${Object.keys(page).join(', ')}]`);
  console.log(`  Has imagePrompt: ${!!page.imagePrompt}`);
  if (page.imagePrompt) {
    console.log(`  Prompt length: ${page.imagePrompt.length}`);
    console.log(`  Prompt preview: ${page.imagePrompt.substring(0, 150)}...`);
  } else {
    console.error(`  ❌ MISSING imagePrompt!`);
  }
});
```

---

## Conclusion

**The pages JSON structure is NOT sent to Replicate** - this is by design. Replicate only accepts a text prompt string.

The flow is:
1. Gemini creates pages JSON with imagePrompt per page
2. Frontend extracts each imagePrompt string
3. Frontend sends each imagePrompt individually to Replicate
4. Replicate returns image URL
5. Frontend associates image URL with the page

**If images are not generating correctly, the issue is likely:**
- Gemini not including `imagePrompt` field in response
- JSON parsing error stripping the `imagePrompt` field
- imagePrompt field being empty or malformed

Run the debug checklist above to identify where the imagePrompt is being lost.
