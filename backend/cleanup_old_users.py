"""
Simple script to clean up old test users from the database
Run with: python cleanup_old_users.py
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storybookapi.settings')
django.setup()

from django.contrib.auth.models import User

# Get all users
all_users = User.objects.all()
print(f"\n📊 Total users in database: {all_users.count()}")
print("\nCurrent users:")
for user in all_users:
    print(f"  {user.id}: {user.username} - {user.email} {'(superuser)' if user.is_superuser else ''}")

# Users to keep
keep_usernames = ['johndoe', 'aria']

# Get old users to delete
old_users = User.objects.exclude(username__in=keep_usernames).exclude(is_superuser=True)

print(f"\n🗑️  Users to be deleted: {old_users.count()}")
for user in old_users:
    print(f"  - {user.username} ({user.email})")

# Ask for confirmation
confirm = input("\n⚠️  Do you want to delete these users? (yes/no): ")

if confirm.lower() == 'yes':
    count = old_users.count()
    old_users.delete()
    print(f"\n✅ Successfully deleted {count} old users!")
    
    # Show remaining users
    remaining = User.objects.all()
    print(f"\n📊 Remaining users: {remaining.count()}")
    for user in remaining:
        print(f"  - {user.username} ({user.email})")
else:
    print("\n❌ Cleanup cancelled.")
