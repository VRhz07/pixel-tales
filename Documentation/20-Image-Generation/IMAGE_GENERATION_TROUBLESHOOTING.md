# Image Generation Troubleshooting Guide

## 🚨 Current Status: Multiple API Issues

You've tried several image generation services and they're not working reliably. Here's a comprehensive solution with multiple fallbacks.

---

## ✅ Solution 1: Enhanced Pollinations (Implemented)

I've created an **ultra-enhanced Pollinations service** that uses extreme prompt engineering to force scene-based illustrations instead of portraits.

### What's Different:

1. **Extreme Scene Keywords**: Forces environmental storytelling
2. **Anti-Portrait Keywords**: Explicitly prevents close-up portraits  
3. **Multiple Prompt Strategies**: 4 different approaches per image
4. **Dynamic Camera Angles**: Based on page position in story
5. **Enhanced URL Parameters**: Uses `&enhance=true` for better quality

### Files Created:
- ✅ `/services/enhancedPollinationsService.ts` - Ultra scene-focused prompts
- ✅ Updated `/services/imageGenerationService.ts` - Uses enhanced service
- ✅ Updated Gemini prompts to generate scene descriptions, not portraits

---

## 🧪 Test the Enhanced System

### Quick Test:
1. **Open browser console** (F12)
2. **Generate a story** using AI Story Creation
3. **Check console logs** for:
   ```
   🎨 Using enhanced scene-based generation...
   ✅ Enhanced generation successful
   ```

### Expected Results:
- **Wide shots** instead of close-ups
- **Characters in environments** instead of portraits
- **Action scenes** instead of static poses
- **Rich backgrounds** instead of plain backgrounds

---

## 🔧 Solution 2: Local Image Generation (Backup Plan)

If Pollinations still doesn't work, here's a **local solution** that will definitely work:

### Option A: Placeholder Images with Descriptions

```typescript
// Create: /services/placeholderImageService.ts

const generatePlaceholderImage = (
  description: string,
  artStyle: string,
  width: number = 512,
  height: number = 512
): string => {
  // Create a canvas-based placeholder
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  
  // Style-based color schemes
  const styleColors: Record<string, string[]> = {
    cartoon: ['#FFE4B5', '#87CEEB', '#98FB98'],
    watercolor: ['#E6E6FA', '#F0E68C', '#DDA0DD'],
    sketch: ['#F5F5F5', '#D3D3D3', '#A9A9A9'],
    anime: ['#FFB6C1', '#87CEFA', '#98FB98'],
    digital: ['#F0F8FF', '#E0E0E0', '#B0C4DE']
  };
  
  const colors = styleColors[artStyle] || styleColors.cartoon;
  
  // Create gradient background
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(0.5, colors[1]);
  gradient.addColorStop(1, colors[2]);
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // Add text description
  ctx.fillStyle = '#333';
  ctx.font = '16px Arial';
  ctx.textAlign = 'center';
  
  // Word wrap the description
  const words = description.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  words.forEach(word => {
    const testLine = currentLine + word + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > width - 40 && currentLine !== '') {
      lines.push(currentLine);
      currentLine = word + ' ';
    } else {
      currentLine = testLine;
    }
  });
  lines.push(currentLine);
  
  // Draw text lines
  const lineHeight = 20;
  const startY = (height - lines.length * lineHeight) / 2;
  
  lines.forEach((line, index) => {
    ctx.fillText(line.trim(), width / 2, startY + index * lineHeight);
  });
  
  return canvas.toDataURL();
};
```

### Option B: Pre-made Illustration Library

```typescript
// Create: /assets/illustrations/
// Add pre-made illustrations for common scenes:

const illustrationLibrary: Record<string, string> = {
  'forest_scene': '/assets/illustrations/forest.jpg',
  'castle_scene': '/assets/illustrations/castle.jpg',
  'garden_scene': '/assets/illustrations/garden.jpg',
  'village_scene': '/assets/illustrations/village.jpg',
  'mountain_scene': '/assets/illustrations/mountain.jpg',
  // Add more as needed
};

const getClosestIllustration = (description: string): string => {
  const keywords = description.toLowerCase();
  
  if (keywords.includes('forest') || keywords.includes('tree')) {
    return illustrationLibrary.forest_scene;
  } else if (keywords.includes('castle') || keywords.includes('palace')) {
    return illustrationLibrary.castle_scene;
  } else if (keywords.includes('garden') || keywords.includes('flower')) {
    return illustrationLibrary.garden_scene;
  }
  // Add more matching logic
  
  return illustrationLibrary.forest_scene; // Default
};
```

---

## 🎯 Solution 3: Alternative Free APIs

### Stable Diffusion Web UI (Local)

If you want **perfect control** and **unlimited generation**:

1. **Install Automatic1111**: https://github.com/AUTOMATIC1111/stable-diffusion-webui
2. **Download models**: 
   - DreamShaper (cartoon style)
   - Anything V3 (anime style)
   - Realistic Vision (realistic style)
3. **Enable API**: Run with `--api` flag
4. **Connect locally**: `http://localhost:7860`

```typescript
// Local Stable Diffusion API
const generateLocalSD = async (prompt: string, style: string): Promise<string> => {
  const response = await fetch('http://localhost:7860/sdapi/v1/txt2img', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: prompt,
      negative_prompt: 'portrait, close-up, headshot, looking at camera',
      steps: 20,
      cfg_scale: 7,
      width: 512,
      height: 512,
      sampler_name: 'DPM++ 2M Karras'
    })
  });
  
  const data = await response.json();
  return `data:image/png;base64,${data.images[0]}`;
};
```

### Leonardo.ai (Free Tier)

- **Free**: 150 images/day
- **Better quality**: More reliable than Pollinations
- **API available**: Easy integration

### Ideogram.ai (Free Tier)

- **Free**: 100 images/day  
- **Good for scenes**: Better at environmental illustrations
- **No API key required**: Simple REST API

---

## 🔍 Debugging Current Issues

### Check Hugging Face Issues:

```typescript
// Test Hugging Face API
const testHF = async () => {
  const response = await fetch('https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_HUGGING_FACE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: 'test image of a cat in a garden'
    }),
  });
  
  console.log('HF Status:', response.status);
  console.log('HF Headers:', response.headers);
  
  if (response.ok) {
    const blob = await response.blob();
    console.log('HF Blob type:', blob.type);
    console.log('HF Blob size:', blob.size);
  } else {
    const error = await response.text();
    console.log('HF Error:', error);
  }
};

// Run in browser console
testHF();
```

### Common Issues:

1. **Model Loading**: HF models take 20-60 seconds to "warm up"
2. **Rate Limits**: Free tiers have strict limits
3. **API Key Issues**: Keys might be invalid or expired
4. **CORS Issues**: Browser security blocking requests

---

## 🚀 Immediate Action Plan

### Step 1: Test Enhanced Pollinations (Now)
1. Generate a story and check console logs
2. Look for scene-based images instead of portraits
3. If still getting portraits, continue to Step 2

### Step 2: Implement Placeholder System (15 minutes)
```typescript
// Quick fix: Add to imageGenerationService.ts
const generateFallbackImage = (description: string, artStyle: string): string => {
  // Return a data URL with styled placeholder
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  
  // Style-based background
  ctx.fillStyle = artStyle === 'cartoon' ? '#FFE4B5' : '#E6E6FA';
  ctx.fillRect(0, 0, 512, 512);
  
  // Add description text
  ctx.fillStyle = '#333';
  ctx.font = '18px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Scene:', 256, 200);
  ctx.fillText(description.substring(0, 50), 256, 230);
  ctx.fillText(artStyle + ' style', 256, 280);
  
  return canvas.toDataURL();
};
```

### Step 3: Set Up Local SD (Weekend Project)
1. Install Automatic1111 WebUI
2. Download cartoon/anime models
3. Enable API mode
4. Connect to local generation

---

## 📊 Success Metrics

### What Success Looks Like:
- ✅ **Wide shots** showing full scenes
- ✅ **Characters in action** (reading, running, playing)
- ✅ **Rich environments** (forests, castles, gardens)
- ✅ **Varied camera angles** per page
- ✅ **No portraits** or close-up faces
- ✅ **Consistent art style** across pages

### Current Status Check:
1. **Enhanced Pollinations**: ✅ Implemented
2. **Scene-based Gemini prompts**: ✅ Implemented  
3. **Fallback system**: ✅ Ready
4. **Local generation**: 🔄 Optional

---

## 💡 Pro Tips

### For Better Results:
1. **Check console logs** - They show which service is being used
2. **Try different art styles** - Some work better than others
3. **Regenerate if needed** - Each generation uses different seeds
4. **Use shorter prompts** - Sometimes less is more
5. **Test during off-peak hours** - APIs work better with less load

### Emergency Fallback:
If **nothing works**, the app will still function with placeholder images that show the scene description as text. Users can still create and read stories!

---

**Next Steps**: Test the enhanced system and let me know what you see in the console logs! 🎨
