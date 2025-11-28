"""
Quick test script to verify real-time collaboration setup
Run this after migration to check if everything is configured correctly
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storybookapi.settings')
django.setup()

from django.contrib.auth.models import User
from storybook.models import UserProfile, Friendship
from django.conf import settings

def test_setup():
    print("🔍 Testing Real-Time Collaboration Setup\n")
    
    # 1. Check if Channels is installed
    print("1. Checking Django Channels installation...")
    try:
        import channels
        print(f"   ✅ Django Channels installed (version {channels.__version__})")
    except ImportError:
        print("   ❌ Django Channels NOT installed!")
        print("      Run: pip install channels")
        return False
    
    # 2. Check CHANNEL_LAYERS configuration
    print("\n2. Checking CHANNEL_LAYERS configuration...")
    if hasattr(settings, 'CHANNEL_LAYERS'):
        print(f"   ✅ CHANNEL_LAYERS configured: {settings.CHANNEL_LAYERS}")
    else:
        print("   ❌ CHANNEL_LAYERS not configured!")
        return False
    
    # 3. Check if UserProfile has is_online field
    print("\n3. Checking UserProfile model...")
    try:
        from storybook.models import UserProfile
        test_fields = ['is_online', 'last_seen']
        for field in test_fields:
            if hasattr(UserProfile, field):
                print(f"   ✅ UserProfile has '{field}' field")
            else:
                print(f"   ❌ UserProfile missing '{field}' field!")
                print("      Run: python manage.py migrate")
                return False
    except Exception as e:
        print(f"   ❌ Error checking model: {e}")
        return False
    
    # 4. Check if notification_consumer exists
    print("\n4. Checking notification consumer...")
    try:
        from storybook.notification_consumer import NotificationConsumer
        print("   ✅ NotificationConsumer found")
    except ImportError as e:
        print(f"   ❌ NotificationConsumer not found: {e}")
        return False
    
    # 5. Check WebSocket routing
    print("\n5. Checking WebSocket routing...")
    try:
        from storybook.routing import websocket_urlpatterns
        routes = [str(route.pattern) for route in websocket_urlpatterns]
        if any('notifications' in route for route in routes):
            print("   ✅ Notifications WebSocket route configured")
            print(f"      Routes: {routes}")
        else:
            print("   ⚠️  Notifications route not found in routing")
            print(f"      Current routes: {routes}")
    except Exception as e:
        print(f"   ❌ Error checking routing: {e}")
        return False
    
    # 6. Check if there are test users
    print("\n6. Checking test users...")
    user_count = User.objects.count()
    if user_count >= 2:
        print(f"   ✅ Found {user_count} users for testing")
        users = User.objects.all()[:2]
        print(f"      Test users: {[u.username for u in users]}")
    else:
        print(f"   ⚠️  Only {user_count} user(s) found")
        print("      Create at least 2 users to test collaboration")
    
    print("\n" + "="*60)
    print("✅ Setup verification complete!")
    print("\n📋 Next steps:")
    print("1. Run: python manage.py runserver")
    print("2. Open two browser windows")
    print("3. Log in as different users")
    print("4. Make them friends")
    print("5. Send a collaboration invite")
    print("6. Watch the invitation appear instantly! 🎉")
    print("="*60)
    
    return True

if __name__ == "__main__":
    try:
        test_setup()
    except Exception as e:
        print(f"\n❌ Error during setup verification: {e}")
        import traceback
        traceback.print_exc()
