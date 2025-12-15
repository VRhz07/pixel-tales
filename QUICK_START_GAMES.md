# 🎮 Quick Start: Educational Games

## For Users

### How to Play Games

1. **Open the App**
   - Launch PixelTales app

2. **Navigate to Games**
   - Click the **Games** tab 🎮 in the bottom navigation
   - It's right between Home and Library

3. **Choose a Story**
   - Browse stories that have games available
   - Each card shows how many games are available
   - Click on any story card

4. **Select Game Type**
   - 📝 **Quiz**: Multiple choice questions (easiest)
   - ✍️ **Fill in the Blanks**: Complete sentences with options
   - 🔤 **Spelling**: Spell words from the story
   - Click **Play Now** on any game

5. **Play & Win!**
   - Answer questions one by one
   - Get instant feedback
   - Earn XP for completion
   - Try to score 70% or higher to pass!

## For Developers

### Generate Games for Stories

```bash
# Navigate to backend
cd backend

# Generate games for ALL published stories
python manage.py generate_all_games

# Generate for a specific story
python manage.py generate_all_games --story-id 5

# Regenerate (delete old games and create new ones)
python manage.py generate_all_games --regenerate
```

### Test the Feature

```bash
# Start backend
cd backend
python manage.py runserver

# Start frontend (in another terminal)
cd frontend
npm run dev

# Open browser
# Navigate to: http://localhost:5173/games
```

### API Endpoints

```
GET  /api/games/available_stories/     # List stories with games
GET  /api/games/story/<id>/            # Get games for a story
POST /api/games/<id>/start_game/       # Start a game attempt
POST /api/games/submit_answer/         # Submit an answer
POST /api/games/complete/              # Complete the game
GET  /api/games/my_stats/             # User's game statistics
GET  /api/games/<id>/leaderboard/     # Game leaderboard
```

## Quick Test

Want to test if games are working?

```bash
cd backend
python manage.py shell
```

Then in the shell:
```python
from storybook.models import Story, StoryGame
from storybook.game_service import GameGenerationService

# Get a story
story = Story.objects.filter(is_published=True).first()
print(f"Story: {story.title}")

# Generate games
result = GameGenerationService.generate_games_for_story(story)
print(f"Generated: {list(result.keys())}")

# Check questions
for game_type, game in result.items():
    print(f"{game_type}: {game.questions.count()} questions")
```

## Troubleshooting

### "No games available"
- Make sure stories are published
- Run `python manage.py generate_all_games`
- Check that stories have at least 100 characters of text

### Games not appearing in frontend
- Check backend is running
- Verify API endpoints are working: `http://localhost:8000/api/games/available_stories/`
- Check browser console for errors

### Questions have errors
- Make sure you're on the latest code with the text extraction fix
- Regenerate games: `python manage.py generate_all_games --regenerate`

## Features

✅ **Works Offline** - No internet needed after generation
✅ **No AI Required** - Template-based generation
✅ **Fast** - Instant game creation
✅ **Free** - No API costs
✅ **Educational** - Tests story comprehension
✅ **Rewarding** - Earn XP for playing

## XP Rewards

- Base reward: **30 XP**
- Per correct answer: **+5 XP**
- Pass bonus (70%+): **+10 XP**
- Perfect score: **+20 XP**
- Speed bonus (<2 min): **+15 XP**

**Maximum possible XP per game: ~90 XP!**

## Stats

- 28 stories with games
- 84 total games (3 per story)
- 363 questions total
- Average: 4.3 questions per game

---

**Have fun learning! 🎮📚✨**
