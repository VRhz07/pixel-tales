# Enhanced Backend Logging for Replicate

## Summary

I've identified that the backend already has **some** logging for Replicate, but it needs enhancement to see the actual prompt being sent.

## Current Backend Logging (Lines 415-416, 445, 455)

```python
print(f"🎨 Generating image with Replicate: {replicate_model}")
print(f"📝 Input params: {input_params}")  # This shows the params
print(f"✅ Image generated: {image_url}")
print(f"❌ Replicate error: {str(e)}")
```

## What's Being Logged vs What We Need

### Currently Logged:
- Model name (e.g., "black-forest-labs/flux-schnell")
- Input params dictionary (includes prompt, aspect_ratio, seed)
- Success/error status

### Missing Detail:
The `input_params` dictionary includes the prompt, but it's not explicitly showing the **full prompt text** in a readable way.

## Proposed Enhancement

Add these lines after line 416 in `backend/storybook/ai_proxy_views.py`:

```python
print(f"🎨 Generating image with Replicate: {replicate_model}")
print(f"📝 Input params: {input_params}")

# ADD THESE LINES:
print(f"📋 PROMPT DETAILS:")
print(f"   Length: {len(prompt)} characters")
print(f"   First 200 chars: {prompt[:200]}...")
print(f"   Contains 'imagePrompt': {'imagePrompt' in prompt}")
print(f"   Contains character description: {any(word in prompt.lower() for word in ['character', 'appearance', 'wearing', 'hair'])}")
```

This will show:
- Exact prompt length
- Preview of the prompt content
- Whether it contains expected keywords

## To Add This Logging

Replace lines 415-416 in `backend/storybook/ai_proxy_views.py` with:

```python
# Enhanced logging for debugging imagePrompt
print(f"========================================")
print(f"🎨 REPLICATE IMAGE GENERATION REQUEST")
print(f"========================================")
print(f"🎯 Model: {replicate_model}")
print(f"📏 Dimensions: {width}x{height} (Aspect: {input_params.get('aspect_ratio', 'N/A')})")
print(f"🎲 Seed: {seed if seed else 'random'}")
print(f"")
print(f"📋 PROMPT ANALYSIS:")
print(f"   Total Length: {len(prompt)} characters")
print(f"   First 200 chars: {prompt[:200]}...")
if len(prompt) > 200:
    print(f"   Last 100 chars: ...{prompt[-100:]}")
print(f"   Contains 'character': {('character' in prompt.lower())}")
print(f"   Contains 'illustration': {('illustration' in prompt.lower())}")
print(f"   Contains 'cartoon/watercolor/anime': {any(style in prompt.lower() for style in ['cartoon', 'watercolor', 'anime', 'digital'])}")
print(f"")
print(f"📝 Full input_params: {input_params}")
print(f"========================================")
```

## Why This Helps

This will show you in the backend logs:
1. **Exact prompt length** - verify it's not empty or truncated
2. **Prompt preview** - see if character descriptions are included
3. **Keyword detection** - confirm expected terms are present
4. **Full context** - all parameters being sent to Replicate

## Alternative: Check Backend Logs Now

If you have backend logs from a recent story generation, search for:
```
🎨 Generating image with Replicate:
📝 Input params:
```

The `input_params` dictionary already contains the prompt. Look for the `"prompt"` key in that dictionary to see what's being sent.

## Manual Test Without Code Changes

1. Generate a simple 5-page story
2. Check backend console/logs for lines containing "Generating image with Replicate"
3. Look at the `input_params` dictionary printed
4. The `"prompt"` key shows what was sent to Replicate

Example of what you should see:
```
🎨 Generating image with Replicate: black-forest-labs/flux-schnell
📝 Input params: {'prompt': 'Cartoon illustration of a small fox with bright orange fur...', 'aspect_ratio': '1:1', 'num_outputs': 1, 'seed': 1234567}
```

If the prompt value is very short or doesn't contain character descriptions, that's the issue!
