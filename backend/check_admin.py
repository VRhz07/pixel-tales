import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storybookapi.settings')
django.setup()

from django.contrib.auth.models import User

try:
    u = User.objects.get(email='werpixeltales@gmail.com')
    print(f'User found: {u.username}')
    print(f'Email: {u.email}')
    print(f'is_staff: {u.is_staff}')
    print(f'is_superuser: {u.is_superuser}')
    print(f'Password check: {u.check_password("PTmeljanharvz2025")}')
except User.DoesNotExist:
    print('User not found!')
    print('All users with email:')
    for user in User.objects.all():
        print(f'  - {user.username} ({user.email})')
