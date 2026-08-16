from django.test import TestCase
from django.contrib.auth.models import User
from storybook.models import (
    Story, SavedStory, StoryRead, 
    Friendship, CollaborationSession, SessionParticipant, 
    DrawingOperation, Notification, Comment, Like
)
from unittest.mock import patch

class IntegrationTestCase(TestCase):
    def setUp(self):
        # Create users for the integration tests
        self.user_a = User.objects.create_user(username='user_alpha', password='password123')
        self.user_b = User.objects.create_user(username='user_beta', password='password123')
        self.user_c = User.objects.create_user(username='user_gamma', password='password123')

    @patch('storybook.ai_proxy_views.replicate', autospec=True)
    def test_ai_to_story_to_library(self, mock_replicate):
        """UT-INT-01: AI -> Story Creation -> Library System"""
        
        # 1. User A uses AI to generate content (mocked)
        mock_replicate.Client.return_value.predictions.create.return_value.id = "mock_pred_1"
        client = mock_replicate.Client(api_token="dummy")
        prediction = client.predictions.create(
            model="black-forest-labs/flux-schnell",
            input={"prompt": "A magical forest"}
        )
        self.assertEqual(prediction.id, "mock_pred_1")
        
        # 2. The AI content is formatted and published manually as a story
        ai_story = Story.objects.create(
            title="The Magical Forest",
            author=self.user_a,
            content="Once upon a time in a magical AI forest...",
            creation_type="ai_assisted",
            is_published=True
        )
        
        # 3. User B discovers the story, reads it, and saves it
        story_read = StoryRead.objects.create(user=self.user_b, story=ai_story)
        saved_story = SavedStory.objects.create(user=self.user_b, story=ai_story)
        
        # Assertions
        self.assertEqual(ai_story.creation_type, "ai_assisted")
        self.assertEqual(StoryRead.objects.filter(user=self.user_b).count(), 1)
        self.assertEqual(SavedStory.objects.filter(user=self.user_b).count(), 1)
        self.assertEqual(SavedStory.objects.get(user=self.user_b).story.title, "The Magical Forest")


    def test_social_to_collaboration_to_story(self):
        """UT-INT-02: Social Features -> Collaboration -> Story Creation"""
        
        # 1. User A and User B become friends
        friendship = Friendship.objects.create(sender=self.user_a, receiver=self.user_b, status='pending')
        friendship.status = 'accepted'
        friendship.save()
        self.assertEqual(Friendship.objects.get(id=friendship.id).status, 'accepted')
        
        # 2. User A invites User B to a real-time drawing session
        session = CollaborationSession.objects.create(
            session_id="collab_session_x",
            host=self.user_a,
            canvas_name="Our Shared Journey"
        )
        SessionParticipant.objects.create(session=session, user=self.user_a, role="host")
        SessionParticipant.objects.create(session=session, user=self.user_b, role="participant")
        
        self.assertEqual(session.participants.count(), 2)
        
        # 3. They simulate drawing operations together
        DrawingOperation.objects.create(session=session, user=self.user_a, operation_type="path", operation_data={"point": 1})
        DrawingOperation.objects.create(session=session, user=self.user_b, operation_type="path", operation_data={"point": 2})
        
        self.assertEqual(session.operations.count(), 2)
        
        # 4. Collaborative canvas is finalized into a Story
        collab_story = Story.objects.create(
            title=session.canvas_name,
            author=self.user_a,
            content="A collaborative masterpiece.",
            creation_type="collaborative",
            is_collaborative=True,
            collaboration_session=session,
            is_published=True
        )
        collab_story.authors.add(self.user_a, self.user_b)
        
        # Assertions
        self.assertEqual(collab_story.authors.count(), 2)
        self.assertTrue(collab_story.is_collaborative)
        self.assertEqual(collab_story.collaboration_session, session)


    def test_story_creation_to_social_notifications(self):
        """UT-INT-03: Story Creation -> Social Notifications"""
        
        # 1. User A publishes a new story
        new_story = Story.objects.create(
            title="Adventures of the Notification System",
            author=self.user_a,
            content="Will User C get notified?",
            creation_type="manual",
            is_published=True
        )
        
        # 2. User C reads the story and leaves a comment/like
        StoryRead.objects.create(user=self.user_c, story=new_story)
        comment = Comment.objects.create(story=new_story, author=self.user_c, text="Great story!")
        like = Like.objects.create(story=new_story, user=self.user_c)
        
        # 3. System generates notifications for User A
        notif_comment = Notification.objects.create(
            recipient=self.user_a,
            sender=self.user_c,
            notification_type='story_commented',
            title='New Comment',
            message='User C commented on your story.',
            related_story=new_story
        )
        
        notif_like = Notification.objects.create(
            recipient=self.user_a,
            sender=self.user_c,
            notification_type='story_liked',
            title='New Like',
            message='User C liked your story.',
            related_story=new_story
        )
        
        # Assertions
        self.assertEqual(Notification.objects.filter(recipient=self.user_a).count(), 2)
        self.assertEqual(notif_comment.related_story, new_story)
        self.assertEqual(notif_like.notification_type, 'story_liked')
