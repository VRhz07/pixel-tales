"""
Script to create admin superuser for PixelTales
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storybookapi.settings')
django.setup()

from django.contrib.auth.models import User
from storybook.models import UserProfile

# Admin credentials
USERNAME = 'pixeltaleadmin'
EMAIL = 'werpixeltales@gmail.com'
PASSWORD = 'PTmeljanharvz2025'
DISPLAY_NAME = 'PixelTale Administrator'

# Check if user already exists
if User.objects.filter(username=USERNAME).exists():
    print(f'✅ Admin user "{USERNAME}" already exists')
    user = User.objects.get(username=USERNAME)
    # Update credentials and ensure it's a superuser
    user.email = EMAIL
    user.set_password(PASSWORD)
    user.is_staff = True
    user.is_superuser = True
    user.save()
    print(f'✅ Updated {USERNAME} credentials and superuser status')
else:
    # Create superuser
    user = User.objects.create_superuser(
        username=USERNAME,
        email=EMAIL,
        password=PASSWORD
    )
    print(f'✅ Created superuser: {USERNAME}')

# Create or update profile
profile, created = UserProfile.objects.get_or_create(
    user=user,
    defaults={
        'display_name': DISPLAY_NAME,
        'user_type': 'parent',  # Set as parent type for admin
    }
)

if not created:
    profile.display_name = DISPLAY_NAME
    profile.save()
    print(f'✅ Updated profile for {USERNAME}')
else:
    print(f'✅ Created profile for {USERNAME}')

print('\n' + '='*50)
print('Admin Account Details:')
print('='*50)
print(f'Username: {USERNAME}')
print(f'Password: {PASSWORD}')
print(f'Email: {EMAIL}')
print(f'Is Staff: {user.is_staff}')
print(f'Is Superuser: {user.is_superuser}')
print('='*50)
print('\nYou can now login to the admin dashboard at:')
print('http://localhost:3001/admin')
print('='*50)
