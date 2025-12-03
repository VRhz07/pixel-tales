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

echo "Build completed successfully!"
