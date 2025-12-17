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

if python manage.py shell -c "from storybook.models import Achievement; exit(0 if Achievement.objects.count() >= 100 else 1)"; then
    echo "Achievements already populated"
else
    echo "Populating achievements..."
    python manage.py populate_achievements
fi

# Update word searches to new 8x8 format (delete old 12x12 ones)
echo "Updating word search games to child-friendly 8x8 format..."
python manage.py update_word_searches --force || echo "No word searches to update"

# Generate educational games for all published stories
# IMPORTANT: This includes word search, quiz, and fill-in-the-blank games
echo "Generating educational games for published stories..."
python manage.py generate_all_games --regenerate

# Verify games were created
echo "Verifying game generation..."
python manage.py shell -c "from storybook.models import StoryGame; ws_count = StoryGame.objects.filter(game_type='word_search').count(); print(f'Word Search Games: {ws_count}'); quiz_count = StoryGame.objects.filter(game_type='quiz').count(); print(f'Quiz Games: {quiz_count}'); fb_count = StoryGame.objects.filter(game_type='fill_blanks').count(); print(f'Fill Blanks Games: {fb_count}')" || echo "Could not verify game counts"

echo "Build completed successfully!"
