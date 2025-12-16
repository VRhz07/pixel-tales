# Word Search Update Guide

## What Changed?

The word search game has been updated to be more child-friendly and mobile-optimized:

- **Grid Size:** 12x12 → 8x8 (64 cells instead of 144)
- **Number of Words:** 6-8 → 4-5 words
- **Word Length:** 4-8 letters → 3-6 letters
- **Directions:** Horizontal, vertical, diagonal → Horizontal & vertical only
- **Touch Controls:** Improved for Android with better detection and scrolling

## How to Update Existing Games

### Option 1: Automatic Regeneration (Recommended)
Just delete the old word searches. New ones will be generated automatically when users access them:

```bash
python delete_old_word_searches.py
# Choose option 1
```

### Option 2: Immediate Regeneration
Delete old games and regenerate all at once:

```bash
python delete_old_word_searches.py
# Choose option 2
```

## Running on Render

### Method 1: Via Render Shell (Easiest)

1. Go to your Render dashboard
2. Select your backend web service
3. Click on "Shell" tab
4. Run the script:
   ```bash
   python delete_old_word_searches.py
   ```
5. Follow the prompts

### Method 2: Via Django Management Command

If you prefer using Django management commands, you can also run:

```bash
# Open Render shell
python manage.py shell

# Then paste this:
from storybook.models import StoryGame, GameQuestion, GameAnswer, GameAttempt

# Delete old word searches
word_searches = StoryGame.objects.filter(game_type='word_search')
print(f"Deleting {word_searches.count()} word search games...")

# Delete related data first
GameAnswer.objects.filter(attempt__game__in=word_searches).delete()
GameAttempt.objects.filter(game__in=word_searches).delete()
GameQuestion.objects.filter(game__in=word_searches).delete()
word_searches.delete()

print("Done! New word searches will be generated with 8x8 format.")
```

### Method 3: Via API Endpoint (Create one if needed)

If you want to add an admin endpoint to do this:

Add to `backend/storybook/admin_views.py`:

```python
@require_http_methods(["POST"])
@admin_required
def regenerate_word_searches(request):
    """Admin endpoint to regenerate all word searches"""
    from .models import StoryGame, GameQuestion, GameAnswer, GameAttempt
    
    # Delete old word searches
    word_searches = StoryGame.objects.filter(game_type='word_search')
    count = word_searches.count()
    
    GameAnswer.objects.filter(attempt__game__in=word_searches).delete()
    GameAttempt.objects.filter(game__in=word_searches).delete()
    GameQuestion.objects.filter(game__in=word_searches).delete()
    word_searches.delete()
    
    return JsonResponse({
        'message': f'Deleted {count} old word searches. New ones will be generated automatically.',
        'deleted_count': count
    })
```

## What Happens to User Progress?

- ✅ Other games (quiz, fill-in-blanks) are **NOT affected**
- ✅ User XP and achievements remain **intact**
- ❌ Word search game attempts/scores will be **deleted**
- ✅ Users can replay the new easier version

## Testing After Update

1. Access any story's games page
2. Click on "Word Search" game
3. Verify:
   - Grid is 8x8 (not 12x12)
   - 4-5 words to find (not 6-8)
   - Words are horizontal or vertical (no diagonals)
   - Grid is scrollable in landscape mode on mobile
   - Touch controls work smoothly

## Rollback Plan

If you need to rollback to 12x12 grids:

1. In `backend/storybook/game_service.py`:
   - Change `grid_size = 8` back to `grid_size = 12`
   - Change `min(5, len(interesting_words))` back to `min(8, len(interesting_words))`
   - Change `r'\b[a-zA-Z]{3,6}\b'` back to `r'\b[a-zA-Z]{4,8}\b'`
   - Add back diagonal direction code

2. Delete and regenerate word searches again

## Need Help?

If you encounter any issues, check:
- Django logs in Render dashboard
- Database connection is working
- Story content has enough text for word extraction
