# ✅ Replicate Rate Limit & Aspect Ratio Fix

## Issues Found & Fixed

### Issue 1: Incorrect Aspect Ratio ❌
**Problem**: Backend was sending `aspect_ratio: "1024:1024"` but FLUX expects standard ratios like `"1:1"`

**Backend Log:**
```
Input params: {'prompt': '...', 'aspect_ratio': '1024:1024', 'num_outputs': 1, 'seed': 1768051297912}
```

**Fix Applied**: Map dimensions to standard aspect ratios
```python
# backend/storybook/ai_proxy_views.py (lines 390-407)
aspect_ratio_map = {
    (1024, 1024): '1:1',     # Square
    (1024, 768): '4:3',      # Landscape
    (768, 1024): '3:4',      # Portrait (book cover)
    (1024, 1365): '3:4',     # Portrait (book cover)
    (1365, 1024): '4:3',     # Landscape
    (512, 512): '1:1',       # Square
    (512, 683): '3:4',       # Portrait
}
aspect_ratio = aspect_ratio_map.get((width, height), '1:1')
```

---

### Issue 2: Rate Limit (429 Error) ⚠️
**Problem**: Replicate limits to **6 requests per minute** when you have less than $5 in credits

**Backend Log:**
```
INFO HTTP Request: POST https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions "HTTP/1.1 429 Too Many Requests"
Replicate error: ReplicateError Details:
status: 429
detail: Request was throttled. Your rate limit for creating predictions is reduced to 6 requests per minute with a burst of 1 requests while you have less than $5.0 in credit. Your rate limit resets in ~1s.
```

**Fix Applied**:

1. **Backend - Better Error Handling** (lines 445-456):
```python
except Exception as e:
    error_msg = str(e)
    print(f"❌ Replicate error: {error_msg}")
    
    # Handle rate limit errors specifically
    if '429' in error_msg or 'rate limit' in error_msg.lower() or 'throttled' in error_msg.lower():
        return Response(
            {'error': 'Replicate rate limit reached. Please add credits at https://replicate.com/billing or wait a moment.', 'code': 'RATE_LIMIT'},
            status=status.HTTP_429_TOO_MANY_REQUESTS
        )
```

2. **Frontend - 12 Second Delay Between Requests** (lines 666-669):
```typescript
// Delay between pages to avoid Replicate rate limits (6 req/min = 10 sec between)
if (index < pages.length - 1) {
  console.log(`⏳ Waiting 12 seconds before next image to avoid rate limit...`);
  await new Promise(resolve => setTimeout(resolve, 12000)); // 12 second pause
}
```

---

## Why 12 Seconds?

**Replicate Rate Limit**: 6 requests per minute with < $5 credits
- **Math**: 60 seconds ÷ 6 requests = 10 seconds minimum between requests
- **Safety Buffer**: 12 seconds ensures we stay under the limit
- **User Experience**: Progress messages keep users informed

---

## Solutions to Rate Limit

### Option 1: Add Credits (Recommended) 💰
- Add $5+ to your Replicate account
- Rate limit increases to **50+ requests per minute**
- Much faster story generation
- Link: https://replicate.com/billing

**Cost**: ~$0.003 per image (very affordable)
- 10-page story = ~$0.033 (3 cents)
- $10 = ~3,000 images

### Option 2: Live with 12-Second Delays ⏳
- **Current behavior**: 
  - 10-page story = ~2 minutes total (12 sec × 10 pages)
  - Each image still generates in 2-4 seconds
  - Just waiting between requests
- **Fallback**: If rate limit hit, automatically uses Pollinations

### Option 3: Use Pollinations as Primary 🆓
- Change frontend to try Pollinations first
- Slower (30-60 sec per image) but no rate limits
- Free forever

---

## Current Flow

```
User generates AI story
    ↓
For each page:
    ↓
    Try Replicate FLUX Schnell
    ├─ Success → Image in 2-4 seconds ✅
    ├─ Rate Limit (429) → Wait 12 seconds → Try next page
    └─ Other Error → Fallback to Pollinations (30-60 sec)
```

---

## Testing the Fix

### 1. Restart Backend
```bash
cd backend
python manage.py runserver
```

### 2. Generate a Story
- Create a 3-page story (for testing)
- Watch console logs for:
  ```
  🎨 Generating image with Replicate: black-forest-labs/flux-schnell
  📝 Input params: {'prompt': '...', 'aspect_ratio': '1:1', 'num_outputs': 1}
  ✅ Image generated: https://replicate.delivery/.../out-0.webp
  ⏳ Waiting 12 seconds before next image to avoid rate limit...
  ```

### Expected Behavior:
- ✅ First image: Generates successfully (2-4 sec)
- ⏳ Wait 12 seconds
- ✅ Second image: Generates successfully (2-4 sec)
- ⏳ Wait 12 seconds
- ✅ Third image: Generates successfully (2-4 sec)

**Total time**: ~40 seconds for 3 pages (better than Pollinations' 90-180 seconds!)

---

## Files Modified

### Backend:
1. **`backend/storybook/ai_proxy_views.py`**
   - Lines 390-407: Fixed aspect ratio mapping
   - Lines 445-456: Added rate limit error handling

### Frontend:
2. **`frontend/src/services/imageGenerationService.ts`**
   - Lines 666-669: Increased delay to 12 seconds between requests

---

## Monitoring Rate Limits

### Check Your Status:
1. Visit: https://replicate.com/account
2. Look for:
   - Current credits
   - Rate limit info
   - API usage

### Backend Logs Will Show:
- ✅ Success: `✅ Image generated: https://...`
- ⚠️ Rate Limit: `❌ Replicate error: Request was throttled`
- 🔄 Fallback: `⚠️ Replicate failed, falling back to Pollinations...`

---

## Recommendations

### For Development/Testing:
- ✅ Current setup is fine (12-second delays)
- ✅ Pollinations fallback works great

### For Production:
- 💰 **Add $10 credits** to Replicate
  - Removes rate limits
  - Much faster generation
  - Still very affordable

---

## Summary of Changes

| Fix | Location | What Changed |
|-----|----------|--------------|
| **Aspect Ratio** | Backend | Maps dimensions to standard ratios (`"1:1"` instead of `"1024:1024"`) |
| **Rate Limit Handling** | Backend | Returns 429 error with helpful message |
| **Request Delay** | Frontend | 12-second pause between Replicate requests |
| **User Feedback** | Frontend | Console logs explain waiting |

---

## Next Steps

1. ✅ **Restart your backend** (apply the fixes)
2. ✅ **Test with a 3-page story** (verify it works)
3. 💰 **Consider adding credits** (removes rate limits)
4. 🎨 **Enjoy fast, high-quality images!**

---

**Implementation Date**: January 10, 2026  
**Status**: ✅ Complete  
**Testing**: Ready to test now!
