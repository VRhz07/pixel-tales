"""
Test admin login credentials
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storybookapi.settings')
django.setup()

from django.contrib.auth import authenticate
from django.contrib.auth.models import User

# Test credentials
EMAIL = 'werpixeltales@gmail.com'
PASSWORD = 'PTmeljanharvz2025'

print('='*60)
print('Testing Admin Login Credentials')
print('='*60)

# Check if user exists by email
try:
    user = User.objects.get(email=EMAIL)
    print(f'✅ User found by email: {user.username}')
    print(f'   Email: {user.email}')
    print(f'   Is Staff: {user.is_staff}')
    print(f'   Is Superuser: {user.is_superuser}')
except User.DoesNotExist:
    print(f'❌ No user found with email: {EMAIL}')
    exit(1)

# Test authentication
print('\nTesting authentication...')
authenticated_user = authenticate(username=user.username, password=PASSWORD)

if authenticated_user:
    print(f'✅ Authentication successful!')
    print(f'   Username: {authenticated_user.username}')
    print(f'   Email: {authenticated_user.email}')
else:
    print(f'❌ Authentication failed!')
    print(f'   The password might be incorrect.')
    
    # Try to reset password
    print('\n🔧 Resetting password...')
    user.set_password(PASSWORD)
    user.save()
    print(f'✅ Password reset successfully!')
    
    # Test again
    authenticated_user = authenticate(username=user.username, password=PASSWORD)
    if authenticated_user:
        print(f'✅ Authentication now works!')
    else:
        print(f'❌ Still failing - there might be another issue')

print('='*60)
