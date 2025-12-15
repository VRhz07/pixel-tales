# 🎮 Games Feature - Quick Setup Guide

## Backend Setup (Required)

### 1. Register Game Models in Admin
Add to `backend/storybook/admin.py`:

```python
from .game_models import StoryGame, GameQuestion, GameAttempt, GameAnswer

@admin.register(StoryGame)
class StoryGameAdmin(admin.ModelAdmin):
    list_display = ['story', 'game_type', 'difficulty', 'is_active', 'created_at']
    list_filter = ['game_type', 'difficulty', 'is_active']
    search_fields = ['story__title']

@admin.register(GameQuestion)
class GameQuestionAdmin(admin.ModelAdmin):
    list_display = ['game', 'question_type', 'order', 'points', 'is_active']
    list_filter = ['question_type', 'is_active']
    ordering = ['game', 'order']

@admin.register(GameAttempt)
class GameAttemptAdmin(admin.ModelAdmin):
    list_display = ['user', 'game', 'score_percentage', 'passed', 'xp_earned', 'completed_at']
    list_filter = ['is_completed', 'game__game_type']
    search_fields = ['user__username', 'game__story__title']
    readonly_fields = ['score_percentage', 'passed']

@admin.register(GameAnswer)
class GameAnswerAdmin(admin.ModelAdmin):
    list_display = ['attempt', 'question', 'is_correct', 'points_earned', 'answered_at']
    list_filter = ['is_correct']
```

### 2. Run Database Migrations

```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

### 3. Generate Games for Existing Stories (Optional)

Open Django shell:
```bash
python manage.py shell
```

Run:
```python
from storybook.models import Story
from storybook.game_service import GameGenerationService

# Generate games for all published stories
for story in Story.objects.filter(is_published=True):
    try:
        result = GameGenerationService.generate_games_for_story(story)
        print(f"✅ Generated games for: {story.title}")
        print(f"   Games created: {', '.join(result.keys())}")
    except Exception as e:
        print(f"❌ Error with {story.title}: {str(e)}")

print("\n✅ Done! Games have been generated.")
```

### 4. Test the Backend API

```bash
# Start the server
python manage.py runserver

# Test endpoints (use Postman or curl):
# GET /api/games/available_stories/
# GET /api/games/story/1/
```

## Frontend Setup (Already Done!)

✅ Routes configured in `App.tsx`
✅ Navigation tab added to `BottomNav.tsx`
✅ Pages created: GamesPage, StoryGamesPage, GamePlayPage

## 🎯 How to Test

### 1. Create a Test Story with Games

1. Go to admin panel or create a story via the app
2. Make sure the story has:
   - Title
   - Content (at least 100 words)
   - Published status: `true`

3. Generate games using API or Django shell

### 2. Test the Games Flow

1. **Navigate to Games**
   - Open app and click Games tab in bottom nav
   - Should see list of stories with games

2. **Select a Story**
   - Click on a story card
   - Should see 3 game types: Quiz, Fill Blanks, Spelling

3. **Play a Game**
   - Click "Play Now" on any game
   - Answer questions
   - Complete and see results

4. **Check XP Earned**
   - Go to Profile tab
   - Check XP increased

## 📝 API Endpoints Reference

```
# Get stories with games
GET /api/games/available_stories/

# Get games for a story
GET /api/games/story/{story_id}/

# Start a game
POST /api/games/{game_id}/start_game/

# Submit an answer
POST /api/games/submit_answer/
Body: { attempt_id, question_id, answer }

# Complete game
POST /api/games/complete/
Body: { attempt_id }

# Get user stats
GET /api/games/my_stats/

# Get leaderboard
GET /api/games/{game_id}/leaderboard/

# Generate games (author/admin only)
POST /api/games/generate/
Body: { story_id }
```

## 🐛 Troubleshooting

### "No games available"
- Make sure stories are published
- Run the game generation script
- Check that story has content (>100 words)

### "Failed to start game"
- Check user is authenticated
- Verify game exists and is active
- Check backend console for errors

### Questions not appearing
- Check `is_active=True` on GameQuestion
- Verify questions were created during generation
- Check Django admin panel

### XP not awarded
- Check `xp_service.py` is imported correctly
- Verify user profile exists
- Check backend logs for XP award errors

## 🎨 Customization

### Change Question Count
In `game_service.py`, modify:
```python
questions_data = cls._generate_quiz_questions(story, story_text)
# Change from [:5] to [:10] for 10 questions
for idx, q_data in enumerate(questions_data[:10]):
```

### Modify XP Rewards
In `game_models.py`, `GameAttempt.calculate_xp_reward()`:
```python
base_xp = 30  # Change this
performance_xp = self.correct_answers * 5  # Change multiplier
```

### Add New Game Types
1. Add to `GAME_TYPES` in `game_models.py`
2. Create generation method in `game_service.py`
3. Add frontend handling in `GamePlayPage.tsx`

## ✅ Verification Checklist

- [ ] Database migrations run successfully
- [ ] Game models appear in Django admin
- [ ] Can generate games via shell/API
- [ ] Games tab appears in navigation
- [ ] Can see stories with games
- [ ] Can play quiz game
- [ ] Can play fill blanks game
- [ ] Can play spelling game
- [ ] XP is awarded on completion
- [ ] Leaderboard displays correctly
- [ ] Stats page shows game history

## 🚀 Next Steps

1. **Enhance Question Generation**
   - Integrate Gemini AI for better questions
   - Add character-specific questions
   - Context-aware comprehension questions

2. **Add Social Features**
   - Challenge friends to beat your score
   - Share achievements
   - Multiplayer quiz mode

3. **Teacher Dashboard**
   - Assign games as homework
   - Track student progress
   - Export reports

4. **More Game Types**
   - Story sequencing
   - Character matching
   - Drawing challenges

---

**Need Help?** Check `GAMES_FEATURE_IMPLEMENTATION.md` for full documentation!
