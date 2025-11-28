"""
Check if johndoe and aria are friends
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storybookapi.settings')
django.setup()

from django.contrib.auth.models import User
from storybook.models import Friendship

# Get users
john = User.objects.filter(username='johndoe').first()
aria = User.objects.filter(username='aria').first()

print(f"\n👤 John: {john} (ID: {john.id if john else 'N/A'})")
print(f"👤 Aria: {aria} (ID: {aria.id if aria else 'N/A'})")

if john and aria:
    # Check friendships
    friendships = Friendship.objects.filter(
        sender=john, receiver=aria
    ) | Friendship.objects.filter(
        sender=aria, receiver=john
    )
    
    print(f"\n🤝 Friendships found: {friendships.count()}")
    for f in friendships:
        print(f"  - {f.sender.username} → {f.receiver.username}: {f.status}")
    
    # If not friends, create friendship
    if friendships.count() == 0:
        print("\n⚠️  No friendship found. Creating friendship...")
        friendship = Friendship.objects.create(
            sender=john,
            receiver=aria,
            status='accepted'
        )
        print(f"✅ Created friendship: {friendship}")
    elif friendships.filter(status='accepted').count() == 0:
        print("\n⚠️  Friendship exists but not accepted. Updating...")
        friendship = friendships.first()
        friendship.status = 'accepted'
        friendship.save()
        print(f"✅ Updated friendship to accepted")
    else:
        print("\n✅ Users are already friends!")
else:
    print("\n❌ One or both users not found!")
