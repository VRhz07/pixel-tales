#!/usr/bin/env python
"""
Create a superuser if one doesn't exist.
Run this after deployment to create admin account.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storybookapi.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# Get superuser credentials from environment variables
ADMIN_USERNAME = os.getenv('DJANGO_SUPERUSER_USERNAME', 'admin')
ADMIN_EMAIL = os.getenv('DJANGO_SUPERUSER_EMAIL', 'admin@pixeltales.com')
ADMIN_PASSWORD = os.getenv('DJANGO_SUPERUSER_PASSWORD', 'changeme123')

if not User.objects.filter(username=ADMIN_USERNAME).exists():
    print(f'Creating superuser: {ADMIN_USERNAME}')
    User.objects.create_superuser(
        username=ADMIN_USERNAME,
        email=ADMIN_EMAIL,
        password=ADMIN_PASSWORD
    )
    print(f'✅ Superuser created successfully!')
    print(f'Username: {ADMIN_USERNAME}')
    print(f'Email: {ADMIN_EMAIL}')
    print(f'Password: {ADMIN_PASSWORD}')
    print(f'⚠️  CHANGE THE PASSWORD after first login!')
else:
    print(f'ℹ️  Superuser "{ADMIN_USERNAME}" already exists')
