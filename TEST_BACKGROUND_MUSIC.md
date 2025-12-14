# 🧪 Testing Background Music System

## Pre-Flight Checklist

Before testing, verify:
- [ ] All 6 MP3 files are in `frontend/public/sounds/background-music/`
- [ ] Filenames match exactly (case-sensitive)
- [ ] Development server is running
- [ ] You have a child user account to test with

## 🧪 Test Suite

### Test 1: Auto-Play on Login ✓

**Steps**:
1. Open app (logout if logged in)
2. Login as a **child user**
3. Wait 2-3 seconds after login

**Expected**:
- ✅ Music should start playing automatically
- ✅ Volume should fade in smoothly
- ✅ Should hear one of the 6 tracks (or random track)

**If Failed**:
- Check browser console for errors
- Verify background music is enabled in settings
- Try clicking anywhere on the page (autoplay block)

---

### Test 2: Settings UI Display ✓

**Steps**:
1. Navigate to Settings page
2. Scroll to "Background Music" section

**Expected**:
- ✅ Section header "🎵 Background Music" visible
- ✅ Enable/disable toggle present
- ✅ Volume slider visible (if enabled)
- ✅ Track selection grid with 7 options:
  - 🎲 Random (Surprise Me!)
  - 🗺️ Adventure Time
  - 🎨 Creative Flow
  - ☁️ Dreamy Clouds
  - 🌲 Magical Forest
  - 🎈 Playful Journey
  - ✨ Wonder Land
- ✅ Currently selected track is highlighted
- ✅ "Now Playing" indicator shows current track

**If Failed**:
- Check if SoundSettings component is rendering
- Verify imports are correct
- Check browser console for React errors

---

### Test 3: Track Selection ✓

**Steps**:
1. In Settings, click on "Creative Flow" track
2. Wait 1-2 seconds
3. Listen to the music

**Expected**:
- ✅ Old track fades out smoothly
- ✅ New track fades in smoothly
- ✅ Button highlights for selected track
- ✅ "Now Playing" updates to show "Creative Flow"
- ✅ You hear the Creative Flow track

**Repeat for each track**:
- [ ] Adventure Time
- [ ] Creative Flow
- [ ] Dreamy Clouds
- [ ] Magical Forest
- [ ] Playful Journey
- [ ] Wonder Land

---

### Test 4: Random Mode ✓

**Steps**:
1. In Settings, select "🎲 Random (Surprise Me!)"
2. Note which track starts playing
3. Stop music (toggle off and on)
4. Observe which track plays now

**Expected**:
- ✅ Random is highlighted when selected
- ✅ Different tracks may play on different starts
- ✅ All tracks should be playable in random mode

**To thoroughly test**:
1. Select Random
2. Logout and login 5 times
3. Each time, note which track plays
4. You should see variety in tracks

---

### Test 5: Volume Control ✓

**Steps**:
1. Make sure music is playing
2. In Settings, drag volume slider to different positions
3. Test: 0%, 25%, 50%, 75%, 100%

**Expected**:
- ✅ Volume changes immediately
- ✅ Percentage displays correctly
- ✅ At 0%, music is silent (but still "playing")
- ✅ At 100%, music is at full volume
- ✅ Volume changes persist after page refresh

---

### Test 6: Enable/Disable Toggle ✓

**Steps**:
1. Music is playing
2. Click toggle to **disable**
3. Wait for fade-out
4. Click toggle to **enable**
5. Wait for fade-in

**Expected**:
- ✅ Disabling fades out and stops music
- ✅ Track selection UI hides when disabled
- ✅ Enabling fades in and starts music
- ✅ Setting persists after refresh

---

### Test 7: Seamless Looping ✓

**Steps**:
1. Select any track
2. Let it play until the end
3. Listen for the loop point

**Expected**:
- ✅ Track loops automatically
- ✅ No gap or silence between loops
- ✅ Smooth transition from end to beginning
- ✅ No volume drop or glitch

**If Failed**:
- Check if track has proper fade in/out
- Verify track is properly trimmed
- May need to re-export with loop optimization

---

### Test 8: Page Navigation ✓

**Steps**:
1. Music is playing on Settings page
2. Navigate to Home page
3. Navigate to Create page
4. Navigate to Library page
5. Navigate back to Settings

**Expected**:
- ✅ Music continues playing during navigation
- ✅ No interruption or restart
- ✅ Same track keeps playing
- ✅ Volume stays consistent

---

### Test 9: Tab Visibility ✓

**Steps**:
1. Music is playing
2. Switch to another browser tab (minimize or switch)
3. Wait 5 seconds
4. Switch back to app tab

**Expected**:
- ✅ Music pauses when tab is hidden
- ✅ Music resumes when tab is visible again
- ✅ Resumes from where it paused (not restart)

---

### Test 10: Logout Behavior ✓

**Steps**:
1. Music is playing as child user
2. Logout
3. Observe music

**Expected**:
- ✅ Music fades out smoothly
- ✅ Music stops completely after fade
- ✅ No music plays on auth page

---

### Test 11: Parent Account ✓

**Steps**:
1. Logout if logged in
2. Login as a **parent user**
3. Navigate through pages

**Expected**:
- ✅ No music plays at all for parent accounts
- ✅ Background music section still visible in settings
- ✅ Can configure settings (but won't play for parent)

---

### Test 12: Preference Persistence ✓

**Steps**:
1. Select "Playful Journey" track
2. Set volume to 30%
3. Disable background music
4. Refresh the page
5. Check settings

**Expected**:
- ✅ "Playful Journey" still selected
- ✅ Volume still at 30%
- ✅ Music still disabled
- ✅ All preferences saved in localStorage

---

### Test 13: Mobile Responsiveness ✓

**Steps**:
1. Open app on mobile device or mobile emulator
2. Login as child
3. Go to Settings
4. Test track selection grid

**Expected**:
- ✅ Track buttons are touch-friendly
- ✅ Grid displays correctly (2 columns)
- ✅ Buttons are not too small
- ✅ No horizontal scrolling
- ✅ Music controls are accessible

---

### Test 14: Performance Check ✓

**Steps**:
1. Open browser DevTools
2. Go to Network tab
3. Select a track
4. Switch to a different track
5. Observe network requests

**Expected**:
- ✅ Only one MP3 loads at a time
- ✅ Track size is 3-6 MB
- ✅ No unnecessary reloads
- ✅ Clean memory management (check Memory tab)

---

### Test 15: Error Handling ✓

**Steps**:
1. Temporarily rename one track file (simulate missing file)
2. Select that track in settings
3. Observe behavior

**Expected**:
- ✅ Error logged in console (404)
- ✅ App doesn't crash
- ✅ Can select other tracks successfully
- ✅ User-friendly error handling

**Restore file after test**

---

## 🎯 Quick Test (5 Minutes)

If you're short on time, run these essential tests:

1. ✓ Login as child → Music plays
2. ✓ Go to Settings → See all tracks
3. ✓ Click 2-3 different tracks → Music switches
4. ✓ Try Random mode → Works
5. ✓ Adjust volume → Changes immediately
6. ✓ Logout → Music stops

## 📊 Test Results Template

```
Date: _______________
Tester: _______________
Browser: _______________

[ ] Test 1: Auto-Play ✓/✗ _____________
[ ] Test 2: Settings UI ✓/✗ _____________
[ ] Test 3: Track Selection ✓/✗ _____________
[ ] Test 4: Random Mode ✓/✗ _____________
[ ] Test 5: Volume Control ✓/✗ _____________
[ ] Test 6: Enable/Disable ✓/✗ _____________
[ ] Test 7: Seamless Loop ✓/✗ _____________
[ ] Test 8: Navigation ✓/✗ _____________
[ ] Test 9: Tab Visibility ✓/✗ _____________
[ ] Test 10: Logout ✓/✗ _____________
[ ] Test 11: Parent Account ✓/✗ _____________
[ ] Test 12: Persistence ✓/✗ _____________
[ ] Test 13: Mobile ✓/✗ _____________
[ ] Test 14: Performance ✓/✗ _____________
[ ] Test 15: Error Handling ✓/✗ _____________

Overall Status: PASS / FAIL
Notes: 
```

## 🐛 Common Issues & Solutions

### Issue: Music doesn't play
**Solutions**:
- Check if files exist in correct directory
- Verify filenames match exactly
- Look for 404 errors in console
- Try disabling/enabling in settings

### Issue: Track won't switch
**Solutions**:
- Check if new track file exists
- Look for console errors
- Try stopping and starting music
- Verify selectedTrack is updating

### Issue: Loop has gap
**Solutions**:
- Re-export track with fade in/out
- Trim silence from start/end
- Check if track is designed for looping

### Issue: Volume doesn't change
**Solutions**:
- Check if volume slider is bound correctly
- Verify soundService.setBackgroundMusicVolume is called
- Check if audio element exists

### Issue: Preferences don't save
**Solutions**:
- Check localStorage in DevTools
- Verify localStorage.setItem is called
- Check for localStorage permission issues

## 📝 Test Notes

### Browser Compatibility
Test in:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (iOS)
- [ ] Mobile Chrome (Android)

### Network Conditions
Test with:
- [ ] Fast WiFi
- [ ] Slow 3G (throttle in DevTools)
- [ ] Offline mode (track shouldn't load)

### User Scenarios
- [ ] First-time user (no preferences saved)
- [ ] Returning user (has preferences)
- [ ] Child switching between sessions
- [ ] Parent account (no music)

---

**Testing Complete?** ✅

If all tests pass, your background music system is ready for production! 🎉
