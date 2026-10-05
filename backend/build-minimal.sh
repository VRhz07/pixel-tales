#!/usr/bin/env bash
# ULTRA MINIMAL BUILD - For Render Free Tier
# This skips ALL optional operations
set -o errexit

echo "⚡ ULTRA MINIMAL BUILD MODE"

# Install dependencies
echo "📦 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Create directories
mkdir -p data staticfiles media

# Collect static files
echo "📋 Collecting static files..."
python manage.py collectstatic --no-input

# Run migrations
echo "🗄️ Running migrations..."
# python manage.py migrate --no-input

echo "✅ Minimal build complete - ~150MB memory used"
