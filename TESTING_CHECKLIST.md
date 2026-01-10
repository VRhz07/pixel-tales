# ✅ Flux Model Testing Checklist

## Before You Start

- [ ] Backend is running
- [ ] Frontend is running
- [ ] You have a test account to log in with
- [ ] Browser DevTools console is open (F12)

---

## Test 1: Simple Image Generation (5 min)

### Steps:
1. [ ] Open `test_flux_model.html` in your browser
2. [ ] Verify API URL is correct (default: http://localhost:8000)
3. [ ] Make sure you're logged in to your app (to get auth token)
4. [ ] Enter test prompt: "A cheerful dragon in a magical forest"
5. [ ] Click "Generate Image with Flux Model"

### Expected Results:
- [ ] See "Generating..." spinner
- [ ] Console shows: `✅ Image generated via backend proxy with Flux model`
- [ ] Image displays on the page
- [ ] No errors in console

### If It Fails:
- Check you're logged in (auth token exists)
- Check backend is running
- Check POLLINATIONS_API_KEY is set in backend
- Review console errors

---

## Test 2: AI Story Creation (10 min)

### Steps:
1. [ ] Go to your app
2. [ ] Click "Create Story"
3. [ ] Select "AI-Assisted Creation"
4. [ ] Fill in the form:
   - Story Idea: "A young wizard learning their first spell"
   - Art Style: "Cartoon"
   - Genre: "Fantasy"
   - Pages: 3 (for quick test)
5. [ ] Click "Generate Story"

### Expected Results:
- [ ] Progress bar shows stages
- [ ] Console shows multiple: `✅ Image generated via backend proxy with Flux model`
- [ ] Console shows: `✅ Generated image for page 1`, `page 2`, `page 3`
- [ ] Story completes with: `✅ Your story is ready!`
- [ ] No warning modal appears
- [ ] Redirected to Story Reader

### Console Output to Look For:
```
🎨 Creating your story cover...
✅ Image generated via backend proxy with Flux model
✅ Cover illustration generated
🎨 Drawing page illustrations...
✅ Image generated via backend proxy with Flux model
✅ Generated image for page 1
✅ Image generated via backend proxy with Flux model
✅ Generated image for page 2
✅ Image generated via backend proxy with Flux model
✅ Generated image for page 3
✅ Your story is ready!
```

### If It Fails:
- Check Gemini API key is configured
- Check backend logs for errors
- Verify all 6 code changes are in place
- Check network tab for failed requests

---

## Test 3: Story Reader Display (2 min)

### Steps:
1. [ ] View the story you just created
2. [ ] Check that all images display correctly
3. [ ] Switch between reading modes (vertical scroll / left-to-right)
4. [ ] Verify images load in both modes

### Expected Results:
- [ ] Cover image displays on story card
- [ ] All page images display in Story Reader
- [ ] No broken image icons
- [ ] No loading spinners stuck
- [ ] Images are clear and relevant to text

### Console Output:
```
🔗 Full Image URL: http://localhost:8000/api/ai/pollinations/fetch-image/?...&model=flux&...
```

### If Images Don't Display:
- Check Network tab for image request status
- Verify URL starts with your backend domain
- Check for CORS errors
- Verify images saved in `canvasData`

---

## Test 4: Multiple Stories (15 min)

### Steps:
1. [ ] Create 3-5 AI stories in quick succession
2. [ ] Use different prompts and styles
3. [ ] Monitor console for any rate limit errors

### Expected Results:
- [ ] All stories generate successfully
- [ ] All images display correctly
- [ ] NO rate limit errors
- [ ] NO "failed to generate" warnings
- [ ] Console consistently shows "Flux model" messages

### Success Criteria:
- [ ] 100% success rate on all stories
- [ ] All images generate and display
- [ ] No errors or warnings

---

## Verification Summary

### Code Verification
- [ ] Backend uses 'flux' model (2 locations verified)
- [ ] Frontend uses 'flux' model (4 locations verified)
- [ ] Console logs show "Flux model" (not "Turbo")

### Functional Verification
- [ ] Single image generation works
- [ ] AI story generation works
- [ ] All page images display
- [ ] Cover images display
- [ ] No rate limit errors occur

### Performance Check
- [ ] Images generate in reasonable time (5-15 seconds each)
- [ ] Multiple stories can be created back-to-back
- [ ] No degradation in quality or speed

---

## Common Issues & Solutions

### Issue: "Not authenticated" Error
**Solution:** Log in to your app first to get auth token

### Issue: Images don't display
**Solution:** Check that URLs go through backend proxy, not direct pollinations.ai

### Issue: 404 on image URLs
**Solution:** Verify backend is running and endpoint exists

### Issue: CORS errors
**Solution:** Verify using backend proxy (should handle CORS automatically)

### Issue: Still seeing "turbo" in console
**Solution:** Hard refresh browser (Ctrl+Shift+R) or clear cache

---

## Success Indicators

You'll know everything is working when you see:

✅ Console logs show "Flux model" consistently
✅ AI stories generate with 100% success rate
✅ All images display in Story Reader
✅ No rate limit errors
✅ No warning modals
✅ Multiple stories can be created without issues

---

## Documentation Reference

If you encounter issues, refer to:

1. **FLUX_IMPLEMENTATION_SUMMARY.md** - Quick overview
2. **FLUX_MODEL_QUICK_GUIDE.md** - Debugging tips
3. **FLUX_MODEL_IMPLEMENTATION.md** - Technical details
4. **FLUX_VS_TURBO_COMPARISON.md** - What changed

---

## Final Verification

Once all tests pass:

- [ ] ✅ Flux model is working correctly
- [ ] ✅ No rate limit issues
- [ ] ✅ Image quality is good
- [ ] ✅ Ready for production use

---

## 🎉 Congratulations!

If all tests pass, you've successfully implemented the Flux model!

**Enjoy unlimited, high-quality image generation for your AI stories!**

---

**Test Date:** __________
**Tested By:** __________
**Status:** [ ] Pass [ ] Fail
**Notes:** ___________________________________________
