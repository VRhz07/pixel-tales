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

# Run deployment setup (includes profanity import)
if [ -f "deploy_setup.py" ]; then
    echo "Running deployment setup..."
    python deploy_setup.py
fi

echo "Build completed successfully!"
