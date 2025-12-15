# 🧪 Local Testing Guide - Games Feature

## 🚀 Test Before Deploy

Let's test everything locally to make sure it works perfectly!

---

## 📋 Testing Steps

### **Step 1: Apply Migrations Locally**

Since you can't run migrations locally (TTS configured on Render), we'll simulate the tables:

```bash
cd backend

# Check what migrations would be created
python manage.py makemigrations --dry-run

# If you see game models listed, create the migration
python manage.py makemigrations storybook

# Apply migrations
python manage.py migrate
```

**Expected Output:**
```
Migrations for 'storybook':
  storybook/migrations/0024_storygame_gamequestion_gameattempt_gameanswer.py
    - Create model StoryGame
    - Create model GameQuestion
    - Create model GameAttempt
    - Create model GameAnswer
```

---

### **Step 2: Start Backend Server**

```bash
cd backend
python manage.py runserver
```

Keep this running in one terminal.

---

### **Step 3: Check Admin Panel**

1. Go to: `http://localhost:8000/admin/`
2. Login with your admin credentials
3. Look for new sections:
   - **Story games**
   - **Game questions**
   - **Game attempts**
   - **Game answers**

✅ If you see these, migrations worked!

---

### **Step 4: Generate Test Games**

Open another terminal:

```bash
cd backend

# Test the management command
python manage.py generate_all_games
```

**Expected Output:**
```
🎮 Generating games for 3 stories...

[1/3] ✅ Story Title: Created 3 games (quiz, fill_blanks, spelling)
     • quiz: 5 questions
     • fill_blanks: 5 questions
     • spelling: 5 questions
[2/3] ✅ Another Story: Created 3 games (quiz, fill_blanks, spelling)
...
========================================
✅ Successfully generated: 3
========================================
🎉 Game generation complete!
```

---

### **Step 5: Test API Endpoints**

With backend running, test these endpoints:

#### **1. Get Available Stories with Games**
```bash
curl http://localhost:8000/api/games/available_stories/
```

**Expected Response:**
```json
{
  "stories": [
    {
      "id": 1,
      "title": "Story Title",
      "cover_image": "...",
      "games_count": 3
    }
  ],
  "total": 1
}
```

#### **2. Get Games for a Story**
```bash
curl http://localhost:8000/api/games/story/1/
```

**Expected Response:**
```json
{
  "story_id": 1,
  "story_title": "Story Title",
  "games": [
    {
      "id": 1,
      "game_type": "quiz",
      "game_type_display": "Multiple Choice Quiz",
      "difficulty": "medium",
      "questions_count": 5
    },
    ...
  ]
}
```

---

### **Step 6: Start Frontend**

Open a new terminal:

```bash
cd frontend
npm run dev
```

**Expected Output:**
```
VITE v5.x.x ready in xxx ms
➜  Local:   http://localhost:5173/
```

---

### **Step 7: Test Frontend Features**

1. **Open App**: Go to `http://localhost:5173/`

2. **Login**: Use any test account

3. **Check Navigation**:
   - Look for **Games** tab (🎮) in bottom nav
   - Should be pink colored
   - Between Home and Library

4. **Click Games Tab**:
   - Should see list of stories with games
   - Each story shows game count badge
   - Stories with cover images display properly

5. **Select a Story**:
   - Click on a story card
   - Should navigate to `/games/story/{id}`
   - See 3 game types with different colors

6. **Play a Game**:
   - Click "Play Now" on any game
   - Should see first question
   - Progress bar at top
   - Question number counter

7. **Answer Questions**:
   - For **Quiz**: Click an option
   - For **Fill Blanks**: Type answer
   - For **Spelling**: Type answer
   - Click "Submit Answer"

8. **Check Feedback**:
   - Green background for correct ✅
   - Red background for incorrect ❌
   - See explanation/feedback
   - Points earned displayed

9. **Complete Game**:
   - Answer all 5 questions
   - Should auto-redirect to results
   - See score percentage
   - See XP earned
   - Pass/fail status

10. **Verify XP Award**:
    - Go to Profile tab
    - Check XP increased
    - Check level if applicable

---

## 🔍 What to Check

### ✅ **Backend Checks**

1. **Migrations Created**
   ```bash
   python manage.py showmigrations storybook
   ```
   Should show `[X] 0024_storygame...`

2. **Admin Panel**
   - All 4 game models visible
   - Can view/edit games
   - Can view questions
   - Can view attempts

3. **Database Records**
   ```bash
   python manage.py shell
   ```
   ```python
   from storybook.models import StoryGame, GameQuestion
   print(f"Games: {StoryGame.objects.count()}")
   print(f"Questions: {GameQuestion.objects.count()}")
   # Should see numbers > 0
   ```

4. **API Responses**
   - All endpoints return valid JSON
   - No 500 errors
   - Proper authentication

### ✅ **Frontend Checks**

1. **Navigation**
   - Games tab visible
   - Pink color scheme
   - Icon displays correctly

2. **Pages Load**
   - `/games` - List of stories
   - `/games/story/1` - Game selection
   - `/games/play/1` - Gameplay

3. **UI Elements**
   - Cards display properly
   - Buttons work
   - Animations smooth
   - Dark mode support

4. **Gameplay**
   - Questions display
   - Can submit answers
   - Feedback shows
   - Progress updates
   - Results screen

5. **XP Integration**
   - XP is awarded
   - Shows in profile
   - Notifications work

---

## 🐛 Troubleshooting

### **"No module named 'storybook.models'"**
**Fix:** Restart Django server after adding models

### **"Table doesn't exist"**
**Fix:** Run `python manage.py migrate`

### **"No games available"**
**Cause:** Need to generate games
**Fix:** Run `python manage.py generate_all_games`

### **"Story content too short to generate games"**
**Cause:** Story has less than 100 words
**Fix:** Add more content to story or lower threshold in `game_service.py`:
```python
if not story_text or len(story_text) < 50:  # Changed from 100
```

### **Frontend shows blank page**
**Check:**
1. Backend is running on port 8000
2. Frontend API URL is correct
3. Browser console for errors

### **Games tab not showing**
**Check:**
1. `BottomNav.tsx` was updated
2. Frontend rebuilt/reloaded
3. Clear browser cache

### **"Cannot start game"**
**Check:**
1. User is authenticated
2. Game exists in database
3. Backend logs for errors

---

## 📝 Test Scenarios

### **Scenario 1: Complete Happy Path**
1. ✅ Migrations applied
2. ✅ Games generated
3. ✅ Can see stories in Games tab
4. ✅ Can select a game type
5. ✅ Can play and complete game
6. ✅ XP is awarded
7. ✅ Can see score and results

### **Scenario 2: Multiple Users**
1. ✅ User A plays game
2. ✅ User B plays same game
3. ✅ Both scores tracked separately
4. ✅ Leaderboard shows both users

### **Scenario 3: Different Game Types**
1. ✅ Quiz works (multiple choice)
2. ✅ Fill blanks works (text input)
3. ✅ Spelling works (text input)
4. ✅ All reward XP correctly

### **Scenario 4: Error Handling**
1. ✅ Empty answer shows error
2. ✅ Network error handled
3. ✅ Invalid game ID handled
4. ✅ No crashes

---

## 🧪 Quick Test Script

Create `test_games.py` in backend:

```python
"""
Quick test script for games feature
Usage: python test_games.py
"""
from storybook.models import Story, StoryGame, GameQuestion, GameAttempt
from storybook.game_service import GameGenerationService
from django.contrib.auth.models import User

# Check models exist
print("📊 Database Status:")
print(f"  Stories: {Story.objects.count()}")
print(f"  Published Stories: {Story.objects.filter(is_published=True).count()}")
print(f"  Story Games: {StoryGame.objects.count()}")
print(f"  Questions: {GameQuestion.objects.count()}")
print(f"  Attempts: {GameAttempt.objects.count()}")
print()

# Test game generation for one story
story = Story.objects.filter(is_published=True).first()
if story:
    print(f"🎮 Testing game generation for: {story.title}")
    
    # Check if games already exist
    if story.games.exists():
        print(f"  ✅ Games already exist: {story.games.count()}")
        for game in story.games.all():
            print(f"     • {game.game_type}: {game.get_questions_count()} questions")
    else:
        print("  🔧 Generating games...")
        result = GameGenerationService.generate_games_for_story(story)
        
        if 'error' in result:
            print(f"  ❌ Error: {result['error']}")
        else:
            print(f"  ✅ Created {len(result)} games:")
            for game_type, game in result.items():
                print(f"     • {game_type}: {game.get_questions_count()} questions")
else:
    print("❌ No published stories found")
    print("   Create and publish a story first!")
print()

# Test user can start a game
if StoryGame.objects.exists():
    game = StoryGame.objects.first()
    user = User.objects.first()
    
    print(f"🎯 Testing game start for user: {user.username}")
    attempt = GameGenerationService.start_game_attempt(user, game)
    print(f"  ✅ Attempt created: ID {attempt.id}")
    print(f"  📝 Total questions: {attempt.total_questions}")
    print(f"  🎁 Max points: {attempt.max_points}")
else:
    print("⚠️  No games available for testing")

print("\n✅ Test complete!")
```

Run it:
```bash
cd backend
python manage.py shell < test_games.py
```

---

## ✅ Final Checklist Before Commit

Test these one by one:

- [ ] Backend migrations applied successfully
- [ ] Can see game models in admin panel
- [ ] `generate_all_games` command works
- [ ] API endpoint `/api/games/available_stories/` returns data
- [ ] API endpoint `/api/games/story/1/` returns games
- [ ] Games tab visible in frontend navigation
- [ ] Can browse stories with games
- [ ] Can select a game type
- [ ] Can start and play a quiz game
- [ ] Can complete a fill blanks game
- [ ] Can complete a spelling game
- [ ] Get instant feedback on answers
- [ ] See results screen after completion
- [ ] XP is awarded to user profile
- [ ] No console errors in browser
- [ ] No server errors in backend
- [ ] Dark mode works properly
- [ ] Mobile responsive (test different screen sizes)

---

## 🎯 If All Tests Pass

You're ready to commit and deploy! 🚀

```bash
git add .
git commit -m "Add educational games feature with auto-generation"
git push origin main
```

---

## 📞 Need Help?

If any test fails:
1. Check the specific error message
2. Review the troubleshooting section above
3. Check backend and frontend console logs
4. Let me know which test failed and I'll help fix it!

**Happy Testing! 🧪✨**
