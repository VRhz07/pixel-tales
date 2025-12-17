#!/usr/bin/env bash
# exit on error
set -o errexit

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Create necessary directories
mkdir -p data
mkdir -p staticfiles
mkdir -p media

# Collect static files
python manage.py collectstatic --no-input

# Run migrations
python manage.py migrate --no-input

# Create superuser automatically if environment variables are set
if [ -f "create_superuser.py" ]; then
    echo "Creating superuser..."
    python create_superuser.py
fi

# Run deployment setup (includes profanity import and achievements)
if [ -f "deploy_setup.py" ]; then
    echo "Running deployment setup..."
    python deploy_setup.py
fi

# Populate achievements if not already done
echo "Checking achievements..."
python manage.py shell -c "from storybook.models import Achievement; count = Achievement.objects.count(); print(f'Achievements: {count}'); exit()" || echo "Could not check achievements"

if python manage.py shell -c "from storybook.models import Achievement; exit(0 if Achievement.objects.count() >= 128 else 1)"; then
    echo "Achievements already populated"
else
    echo "Populating achievements..."
    python manage.py populate_achievements
fi

# Generate educational games for NEW published stories only
# Only generates games for stories that don't have them yet (unless --regenerate flag is set)
echo "Checking for stories without games..."
if python manage.py shell -c "from storybook.models import Story, StoryGame; stories = Story.objects.filter(is_published=True); stories_without_games = [s for s in stories if not StoryGame.objects.filter(story=s).exists()]; print(f'Stories without games: {len(stories_without_games)}'); exit(1 if len(stories_without_games) > 0 else 0)"; then
    echo "All published stories already have games - skipping generation"
else
    echo "Generating games for new published stories..."
    python manage.py generate_all_games
fi

# Verify game counts
echo "Current game statistics..."
python manage.py shell -c "from storybook.models import StoryGame, Story; ws_count = StoryGame.objects.filter(game_type='word_search').count(); quiz_count = StoryGame.objects.filter(game_type='quiz').count(); fb_count = StoryGame.objects.filter(game_type='fill_blanks').count(); story_count = Story.objects.filter(is_published=True).count(); print(f'Published Stories: {story_count}'); print(f'Word Search Games: {ws_count}'); print(f'Quiz Games: {quiz_count}'); print(f'Fill Blanks Games: {fb_count}')" || echo "Could not verify game counts"

echo "Build completed successfully!"
