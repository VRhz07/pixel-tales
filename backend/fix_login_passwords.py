#!/usr/bin/env python
"""
Fix login issue by resetting all user passwords
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storybookapi.settings')
django.setup()

from django.contrib.auth.models import User

print("=" * 70)
print("FIXING LOGIN ISSUE - RESETTING USER PASSWORDS")
print("=" * 70)

# Define default passwords (you should change these after login)
default_passwords = {
    'john': 'Test123!@#',
    'harvz': 'Test123!@#',
    'mel': 'Test123!@#',
    'pixeltaleadmin': 'AdminPassword123!@#',  # Admin account
}

print("\n🔧 Resetting user passwords...")

reset_count = 0
for user in User.objects.all():
    # Use specific password for admin, default for others
    if user.username in default_passwords:
        password = default_passwords[user.username]
    else:
        password = 'Test123!@#'  # Default for all users
    
    user.set_password(password)
    user.save()
    reset_count += 1
    
    account_type = "👑 ADMIN" if user.is_superuser else "👤 USER"
    print(f"  ✅ {user.username:20} ({account_type:10}) - Password reset")

print(f"\n✅ Successfully reset passwords for {reset_count} users")

print("\n" + "=" * 70)
print("📋 LOGIN CREDENTIALS")
print("=" * 70)
print("\n🔑 Regular Users:")
print(f"   Email: john@gmail.com")
print(f"   Password: Test123!@#")
print(f"\n   Email: harvz@gmail.com")
print(f"   Password: Test123!@#")
print(f"\n🔐 Admin Account:")
print(f"   Email: werpixeltales@gmail.com (username: pixeltaleadmin)")
print(f"   Password: AdminPassword123!@#")

print("\n⚠️  IMPORTANT: Change these passwords after successful login!")
print("=" * 70)

# Verify authentication works
print("\n✅ Verifying authentication...")
from django.contrib.auth import authenticate

test_user = authenticate(username='john', password='Test123!@#')
if test_user:
    print(f"   ✅ Authentication test PASSED for 'john'")
else:
    print(f"   ❌ Authentication test FAILED for 'john'")

test_admin = authenticate(username='pixeltaleadmin', password='AdminPassword123!@#')
if test_admin:
    print(f"   ✅ Authentication test PASSED for 'pixeltaleadmin'")
else:
    print(f"   ❌ Authentication test FAILED for 'pixeltaleadmin'")

print("\n" + "=" * 70)
