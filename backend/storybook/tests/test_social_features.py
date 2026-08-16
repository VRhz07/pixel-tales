from django.test import TestCase
from django.contrib.auth.models import User
from storybook.models import Friendship, Message, Notification

class SocialFeaturesTestCase(TestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(username='user_one', password='password123')
        self.user2 = User.objects.create_user(username='user_two', password='password123')

    def test_friendship_request_and_accept(self):
        """Test sending and accepting a friend request."""
        # Send request
        friendship = Friendship.objects.create(
            sender=self.user1,
            receiver=self.user2,
            status='pending'
        )
        self.assertEqual(friendship.status, 'pending')
        
        # Accept request
        friendship.status = 'accepted'
        friendship.save()
        
        self.assertEqual(Friendship.objects.get(id=friendship.id).status, 'accepted')

    def test_messaging_between_users(self):
        """Test that messages can be sent between users."""
        message = Message.objects.create(
            sender=self.user1,
            receiver=self.user2,
            content="Hello World!"
        )
        
        self.assertFalse(message.is_read)
        self.assertEqual(Message.objects.filter(receiver=self.user2).count(), 1)
        
        # Mark as read
        message.is_read = True
        message.save()
        self.assertTrue(Message.objects.get(id=message.id).is_read)

    def test_notification_creation(self):
        """Test that notifications are created correctly."""
        notification = Notification.objects.create(
            recipient=self.user2,
            sender=self.user1,
            notification_type='friend_request',
            title='New Friend Request',
            message='user_one sent you a friend request.'
        )
        
        self.assertEqual(notification.get_icon(), 'user-plus')
        self.assertEqual(notification.get_url(), '/friends/')
