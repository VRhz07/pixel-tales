"""
Test the messaging functionality
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storybookapi.settings')
django.setup()

from django.contrib.auth.models import User
from storybook.models import Message, Friendship

# Get users
john = User.objects.get(username='johndoe')
aria = User.objects.get(username='aria')

print(f"\n👤 Sender: {john.username} (ID: {john.id})")
print(f"👤 Receiver: {aria.username} (ID: {aria.id})")

# Check if they're friends
are_friends = Friendship.objects.filter(
    sender=john, receiver=aria, status='accepted'
) | Friendship.objects.filter(
    sender=aria, receiver=john, status='accepted'
)

print(f"\n🤝 Are friends: {are_friends.exists()}")

# Try to create a message
try:
    message = Message.objects.create(
        sender=john,
        receiver=aria,
        content="Test message from script"
    )
    print(f"\n✅ Message created successfully!")
    print(f"   ID: {message.id}")
    print(f"   Content: {message.content}")
    print(f"   Created: {message.created_at}")
    
    # Clean up test message
    message.delete()
    print(f"\n🗑️  Test message deleted")
    
except Exception as e:
    print(f"\n❌ Error creating message: {e}")
    import traceback
    traceback.print_exc()
