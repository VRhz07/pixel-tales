# Replicate AI Integration with FLUX Schnell

## Overview
This guide explains how to integrate Replicate AI with the FLUX Schnell model for AI story image generation in PixelTales.

## What is FLUX Schnell?
- **FLUX Schnell** by Black Forest Labs is a fast, high-quality image generation model
- **Speed**: Generates images in ~2-4 seconds (4 inference steps)
- **Quality**: Superior to SDXL Turbo, competitive with Midjourney
- **Cost**: Free credits available, very affordable pricing after that
- **Use Case**: Perfect for children's book illustrations

## Current Status ✅
- ✅ Replicate API token configured in `.env`
- ✅ `replicate` package installed (v1.0.7)
- ✅ Backend endpoint implemented at `/api/ai/replicate/generate-image/`
- ✅ Frontend service functions ready
- ⚠️ Need to apply optimizations

## Implementation Steps

### Step 1: Apply Backend Optimization

Replace the `generate_image_with_replicate` function in `backend/storybook/ai_proxy_views.py` with the optimized version from `backend/storybook/ai_proxy_views_replicate_optimized.py`.

**Key improvements:**
- Proper FLUX aspect ratio handling (1:1, 3:4, 4:3)
- Better error messages for credits and rate limits
- Optimized parameters for children's book illustrations
- Proper FileOutput URL extraction

### Step 2: Update Frontend Image Generation Service

The frontend already has `generateImageWithReplicate()` function that:
1. Tries Replicate first (FLUX Schnell)
2. Falls back to Pollinations if Replicate fails
3. Handles proper aspect ratios for book pages and covers

**No changes needed** - the current implementation already prioritizes Replicate!

### Step 3: Verify API Configuration

Check your `backend/.env` file:
```env
REPLICATE_API_TOKEN=your_replicate_token_here
```

## How It Works

### AI Story Generation Flow:
1. **Cover Image**: 
   - Calls `generateCoverIllustration()`
   - Uses aspect ratio `3:4` (portrait, 1024x1365)
   - Tries Replicate FLUX Schnell first
   - Falls back to Pollinations if needed

2. **Page Illustrations**:
   - Calls `generateStoryIllustrationsFromPrompts()`
   - Uses aspect ratio `1:1` (square, 1024x1024)
   - Processes pages sequentially
   - Each page tries Replicate first

### FLUX Schnell Parameters:
```javascript
{
  prompt: "Your enhanced prompt here...",
  model: "flux-schnell",
  aspect_ratio: "1:1",  // or "3:4" for covers
  num_outputs: 1,
  seed: 12345  // Optional, for consistency
}
```

### Backend API Response:
```json
{
  "success": true,
  "imageUrl": "https://replicate.delivery/.../output.webp",
  "model": "flux-schnell",
  "provider": "replicate",
  "aspect_ratio": "1:1"
}
```

## Aspect Ratios for Different Use Cases

| Use Case | Aspect Ratio | Resolution | When to Use |
|----------|-------------|------------|-------------|
| Story Pages | `1:1` | 1024x1024 | Standard page illustrations |
| Book Covers | `3:4` | 1024x1365 | Cover images (portrait) |
| Wide Scenes | `4:3` | 1365x1024 | Landscape illustrations |

## Cost & Credits

### Free Tier:
- New accounts get **free credits** to start
- Enough for ~500-1000 images with FLUX Schnell

### Paid Tier:
- FLUX Schnell: ~$0.003 per image (very affordable)
- FLUX Dev: ~$0.025 per image (higher quality, slower)
- Add credits at: https://replicate.com/billing

## Testing

### Test Single Image Generation:
```bash
# From frontend directory
npm run dev

# Navigate to AI Story creation
# Generate a story and watch console logs for:
# "🎨 Generating image with Replicate (FLUX model)..."
# "✅ Image generated via Replicate backend proxy"
```

### Test Backend Directly:
```bash
# From backend directory
python manage.py shell

# Test Replicate connection
import replicate
output = replicate.run(
    "black-forest-labs/flux-schnell",
    input={"prompt": "a cute cat in a garden, children's book illustration", "aspect_ratio": "1:1"}
)
print(output[0].url())
```

## Error Handling

The system handles these scenarios gracefully:

1. **Insufficient Credits**:
   - Returns 402 Payment Required
   - Directs user to billing page
   - Falls back to Pollinations

2. **Rate Limit**:
   - Returns 429 Too Many Requests
   - User can retry after a moment
   - Falls back to Pollinations

3. **API Error**:
   - Returns 500 Internal Server Error
   - Falls back to Pollinations

## Comparison: FLUX Schnell vs Others

| Feature | FLUX Schnell | Pollinations | SDXL Turbo |
|---------|-------------|--------------|------------|
| Speed | ⚡ 2-4 sec | 🐌 30-60 sec | ⚡ 3-5 sec |
| Quality | 🌟🌟🌟🌟🌟 | 🌟🌟🌟 | 🌟🌟🌟🌟 |
| Consistency | ✅ Excellent | ⚠️ Variable | ✅ Good |
| Cost | 💰 Free credits | 💰 Free | 💰 Paid |
| Anatomy | ✅ Great | ❌ Issues | ✅ Good |

## Troubleshooting

### Issue: "Replicate library not installed"
**Solution**: 
```bash
cd backend
pip install replicate
```

### Issue: "REPLICATE_API_TOKEN not configured"
**Solution**: Add to `backend/.env`:
```env
REPLICATE_API_TOKEN=your_token_here
```

### Issue: Images not generating
**Check**:
1. Backend logs: `python manage.py runserver` (look for 🎨 and ✅ emojis)
2. Frontend console: Check for Replicate API calls
3. Credits: Visit https://replicate.com/account to check balance

### Issue: All images falling back to Pollinations
**Possible causes**:
1. No Replicate credits
2. API token expired
3. Rate limit reached
4. Network issues

## Next Steps

1. ✅ Apply backend optimization from `ai_proxy_views_replicate_optimized.py`
2. ✅ Test with a simple AI story generation
3. ✅ Monitor credits usage at https://replicate.com/account
4. ✅ Adjust aspect ratios if needed for your use case
5. ✅ Consider upgrading to FLUX Dev for higher quality (slower, more expensive)

## Additional Resources

- Replicate FLUX Schnell Docs: https://replicate.com/black-forest-labs/flux-schnell
- Replicate Python SDK: https://github.com/replicate/replicate-python
- FLUX Model Cards: https://blackforestlabs.ai/
- Pricing Calculator: https://replicate.com/pricing

## Support

If you encounter issues:
1. Check backend logs for detailed error messages
2. Verify API token at https://replicate.com/account
3. Test with the provided shell commands
4. Review this guide's troubleshooting section

---

**Created**: January 10, 2026  
**Status**: Ready for testing  
**Next Review**: After first production test

