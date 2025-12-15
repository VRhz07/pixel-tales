# 🧪 Frontend Testing Steps

## ✅ Backend Status: RUNNING
- Backend server: http://localhost:8000
- Games in DB: **84 games**
- Questions: **366 questions**
- Ready to test!

## 🚀 Start Frontend

Open a **NEW terminal/command prompt** and run:

```bash
cd frontend
npm run dev
```

Should show:
```
VITE v5.x.x ready in xxx ms
➜  Local:   http://localhost:5173/
```

## ✅ Frontend Testing Checklist

### 1. Check Navigation (⭐ MOST IMPORTANT)
- [ ] Open http://localhost:5173/
- [ ] Login with any account
- [ ] Look at **bottom navigation**
- [ ] **Games tab (🎮)** should be visible between Home and Library
- [ ] Pink/hot-pink colored icon

### 2. Browse Games
- [ ] Click **Games tab**
- [ ] Should see list of stories
- [ ] Each story shows **game count badge** (e.g., "🎮 3 Games")
- [ ] Cover images display (or emoji if no image)
- [ ] Can scroll through stories

### 3. Select a Story
- [ ] Click on any story card
- [ ] Should navigate to `/games/story/{id}`
- [ ] See **3 game types**:
  - 📝 Multiple Choice Quiz (blue gradient)
  - ✍️ Fill in the Blanks (green gradient)
  - 🔤 Spelling Challenge (purple gradient)
- [ ] Each shows question count and difficulty

### 4. Play Quiz Game
- [ ] Click "Play Now" on **Quiz**
- [ ] Should see:
  - Progress bar at top
  - Question number (e.g., "Question 1 / 3")
  - Question text
  - Multiple choice options (clickable buttons)
- [ ] Click an answer
- [ ] Click "Submit Answer"
- [ ] Should see:
  - ✅ Green feedback for correct
  - ❌ Red feedback for incorrect
  - Explanation/feedback text
  - Points earned
- [ ] Auto-advances to next question after 2 seconds
- [ ] After all questions: Results screen

### 5. Check Results Screen
- [ ] See score percentage
- [ ] See XP earned (e.g., "+65 XP")
- [ ] See correct/incorrect count
- [ ] See time taken
- [ ] Pass/fail status
- [ ] Encouragement message
- [ ] "Play Again" and "Back to Games" buttons

### 6. Verify XP Awarded
- [ ] Click "Back to Games"
- [ ] Go to **Profile** tab
- [ ] Check XP increased
- [ ] Level may have increased

### 7. Test Other Game Types
- [ ] Go back to Games
- [ ] Select same story
- [ ] Play **Fill in the Blanks**:
  - [ ] Type answer in text box
  - [ ] Submit answer
  - [ ] Get feedback
- [ ] Play **Spelling Challenge**:
  - [ ] Type word spelling
  - [ ] Submit answer
  - [ ] Get feedback

### 8. Test Different Stories
- [ ] Try a different story
- [ ] Play a game
- [ ] Should work the same way

### 9. Check Responsiveness
- [ ] Resize browser window
- [ ] Should be mobile-responsive
- [ ] Bottom nav should stay at bottom
- [ ] Cards stack on mobile

### 10. Check Dark Mode
- [ ] Toggle dark mode (if available)
- [ ] Games page should adapt
- [ ] Cards should have dark background
- [ ] Text should be readable

## 🐛 Common Issues to Watch For

### Games Tab Not Showing
- **Fix:** Hard refresh (Ctrl+Shift+R)
- **Or:** Clear browser cache
- **Or:** Check browser console for errors

### "No games available"
- **Check:** Backend is running
- **Check:** Games were generated (84 games in DB)
- **Check:** User is authenticated

### Can't start game
- **Check:** Browser console for API errors
- **Check:** Backend logs for errors
- **Fix:** Make sure both backend and frontend are running

### Questions not displaying
- **Check:** Network tab in browser dev tools
- **Check:** API response from `/api/games/{id}/start_game/`
- **Check:** Backend logs

### XP not awarded
- **Check:** Backend logs when completing game
- **Check:** Profile page shows updated XP
- **Wait:** May need to refresh profile

## ✅ Success Criteria

If you can:
1. ✅ See Games tab in navigation
2. ✅ Browse stories with games
3. ✅ Start and play a game
4. ✅ Complete a game and see results
5. ✅ XP is awarded to profile

**Then everything is working! Ready to deploy! 🚀**

## 📸 Screenshot This

Take screenshots of:
1. Games tab in navigation
2. Games listing page
3. Game selection page
4. Gameplay screen
5. Results screen with XP

These prove everything works!

---

## 🎯 What to Report Back

After testing, tell me:
- ✅ What worked
- ❌ What didn't work (with error messages)
- 🤔 Any confusing UI/UX
- 💡 Suggestions for improvement

Then we can deploy to Render! 🚀
