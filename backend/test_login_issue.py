#!/usr/bin/env python
"""
Test script to diagnose login issues
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storybookapi.settings')
django.setup()

from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from storybook.models import UserProfile

print("=" * 70)
print("LOGIN DIAGNOSTICS")
print("=" * 70)

# Get total users
total_users = User.objects.count()
print(f"\n📊 Total users in database: {total_users}")

# Check first 5 users
print("\n🔍 First 5 users and their profiles:")
for user in User.objects.all()[:5]:
    has_profile = False
    user_type = "N/A"
    try:
        profile = user.profile
        has_profile = True
        user_type = profile.user_type
    except UserProfile.DoesNotExist:
        has_profile = False
    
    print(f"  • {user.username:15} | Email: {user.email:25} | Profile: {has_profile:5} | Type: {user_type}")

# Test authentication with different passwords
print("\n🔐 Testing authentication with 'john' user:")
try:
    user = User.objects.get(username='john')
    print(f"  User found: {user.username}")
    print(f"  Email: {user.email}")
    print(f"  Has usable password: {user.has_usable_password()}")
    
    # Try common passwords
    passwords_to_try = ['john', 'password', '123456', 'admin', 'john123', '']
    for pwd in passwords_to_try:
        auth_user = authenticate(username='john', password=pwd)
        status = "✅ SUCCESS" if auth_user else "❌ FAILED"
        print(f"  Try password '{pwd}': {status}")
        
except User.DoesNotExist:
    print("  ❌ User 'john' not found")

# Check if UserProfiles exist for users without them
print("\n🔧 Users missing profiles:")
users_without_profiles = []
for user in User.objects.all():
    try:
        _ = user.profile
    except UserProfile.DoesNotExist:
        users_without_profiles.append(user.username)

if users_without_profiles:
    print(f"  Found {len(users_without_profiles)} users without profiles")
    print(f"  Creating profiles for all users...")
    
    created_count = 0
    for user in User.objects.all():
        try:
            _ = user.profile
        except UserProfile.DoesNotExist:
            try:
                UserProfile.objects.create(
                    user=user,
                    user_type='child',
                    display_name=user.get_full_name() or user.username,
                    avatar_emoji='📚'
                )
                created_count += 1
            except Exception as e:
                print(f"  ❌ Failed to create profile for {user.username}: {e}")
    
    print(f"  ✅ Created {created_count} profiles")
else:
    print(f"  ✅ All users have profiles!")

print("\n" + "=" * 70)
