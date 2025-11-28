"""
Test exact login credentials that frontend is using
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storybookapi.settings')
django.setup()

from django.contrib.auth import authenticate
from django.contrib.auth.models import User

# EXACT credentials from frontend
EMAIL = 'werpixeltales@gmail.com'
PASSWORD = 'PTmeljanharvz2025'

print('='*60)
print('Testing EXACT Frontend Credentials')
print('='*60)
print(f'Email: "{EMAIL}"')
print(f'Password: "{PASSWORD}"')
print('='*60)

# Step 1: Find user by email
try:
    user = User.objects.get(email=EMAIL)
    print(f'\n✅ Step 1: User found by email')
    print(f'   Username: {user.username}')
    print(f'   Email: {user.email}')
    print(f'   Is Staff: {user.is_staff}')
    print(f'   Is Superuser: {user.is_superuser}')
except User.DoesNotExist:
    print(f'\n❌ Step 1: No user found with email: {EMAIL}')
    exit(1)

# Step 2: Authenticate with password
print(f'\n🔐 Step 2: Testing authentication...')
authenticated_user = authenticate(username=user.username, password=PASSWORD)

if authenticated_user:
    print(f'✅ Step 2: Authentication SUCCESSFUL!')
    print(f'   User: {authenticated_user.username}')
    print(f'   Email: {authenticated_user.email}')
else:
    print(f'❌ Step 2: Authentication FAILED!')
    print(f'   The password is incorrect.')
    print(f'\n🔧 Fixing password...')
    user.set_password(PASSWORD)
    user.save()
    print(f'✅ Password has been reset!')
    
    # Test again
    print(f'\n🔐 Testing authentication again...')
    authenticated_user = authenticate(username=user.username, password=PASSWORD)
    if authenticated_user:
        print(f'✅ Authentication now works!')
    else:
        print(f'❌ Still failing!')

# Step 3: Check admin privileges
print(f'\n🛡️  Step 3: Checking admin privileges...')
if user.is_staff or user.is_superuser:
    print(f'✅ Step 3: User has admin privileges')
    print(f'   is_staff: {user.is_staff}')
    print(f'   is_superuser: {user.is_superuser}')
else:
    print(f'❌ Step 3: User does NOT have admin privileges!')

print('\n' + '='*60)
print('FINAL RESULT:')
if authenticated_user and (user.is_staff or user.is_superuser):
    print('✅ LOGIN SHOULD WORK!')
else:
    print('❌ LOGIN WILL FAIL!')
print('='*60)
