"""
Check exact admin email in database
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storybookapi.settings')
django.setup()

from django.contrib.auth.models import User

print('='*60)
print('Checking Admin User Email')
print('='*60)

# Find all superusers
superusers = User.objects.filter(is_superuser=True)

if superusers.exists():
    for user in superusers:
        print(f'\nUsername: {user.username}')
        print(f'Email: "{user.email}"')  # Quotes to see exact value
        print(f'Email length: {len(user.email)}')
        print(f'Is Staff: {user.is_staff}')
        print(f'Is Superuser: {user.is_superuser}')
        
        # Check for whitespace
        if user.email != user.email.strip():
            print('⚠️  WARNING: Email has whitespace!')
            print(f'   Trimmed: "{user.email.strip()}"')
        
        # Test with the expected email
        expected = 'werpixeltales@gmail.com'
        if user.email == expected:
            print('✅ Email matches expected value!')
        else:
            print(f'❌ Email does NOT match!')
            print(f'   Expected: "{expected}"')
            print(f'   Got:      "{user.email}"')
            print(f'   Difference: {repr(user.email)} vs {repr(expected)}')
else:
    print('❌ No superusers found!')

print('='*60)
