#!/usr/bin/env bash
# exit on error
set -o errexit

echo "🚀 Starting optimized build process for Render free tier..."

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p data
mkdir -p staticfiles
mkdir -p media

# Collect static files
echo "📋 Collecting static files..."
python manage.py collectstatic --no-input

# Run migrations
echo "🗄️ Running database migrations..."
# python manage.py migrate --no-input

# MEMORY OPTIMIZATION: Only run heavy operations if not skipped
# Set SKIP_HEAVY_BUILD=true in Render environment to skip memory-intensive operations

if [ "$SKIP_HEAVY_BUILD" = "true" ]; then
    echo "⚡ SKIP_HEAVY_BUILD enabled - skipping memory-intensive operations"
    echo "✅ Build completed successfully (lightweight mode)!"
    exit 0
fi

# Create superuser (lightweight)
if [ -f "create_superuser.py" ]; then
    echo "👤 Creating superuser..."
    python create_superuser.py || echo "Superuser already exists or skipped"
fi

# Run deployment setup - profanity import (lightweight)
if [ -f "deploy_setup.py" ]; then
    echo "⚙️ Running deployment setup..."
    python deploy_setup.py || echo "Deployment setup skipped"
fi

# Check achievements count (lightweight query)
echo "🏆 Checking achievements..."
ACHIEVEMENT_COUNT=$(python manage.py shell -c "from storybook.models import Achievement; print(Achievement.objects.count())" 2>/dev/null || echo "0")

if [ "$ACHIEVEMENT_COUNT" -lt 128 ]; then
    echo "📝 Populating achievements..."
    python manage.py populate_achievements || echo "Achievement population skipped"
else
    echo "✅ Achievements already populated ($ACHIEVEMENT_COUNT/128)"
fi

# SKIP game generation during build - too memory intensive for free tier
# Games will be generated on-demand when users access them
echo "🎮 Skipping game generation during build (memory optimization)"
echo "   Games will be generated on-demand or run manually if needed"

echo "✅ Build completed successfully!"
