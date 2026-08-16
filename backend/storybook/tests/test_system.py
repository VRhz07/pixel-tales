import time
from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth.models import User
from storybook.models import Story, SavedStory, Friendship

class SystemTestCase(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(username='system_user', password='password123')
        self.story = Story.objects.create(
            title="System Test Story",
            author=self.user,
            content="System test content.",
            is_published=True
        )

    def test_functionality_core_workflow(self):
        """System Functionality: Core story discovery and save workflow"""
        # Ensure story exists in the system
        self.assertEqual(Story.objects.count(), 1)
        
        # Save to library
        saved = SavedStory.objects.create(user=self.user, story=self.story)
        
        # Verify it appears in user's library
        user_library = SavedStory.objects.filter(user=self.user)
        self.assertEqual(user_library.count(), 1)
        self.assertEqual(user_library.first().story, self.story)

    def test_security_auth_enforcement(self):
        """System Security: Unauthenticated access is denied"""
        # We don't have a specific login endpoint in URL map handy, but we can test API protection
        # We will simulate an unauthorized API request by not authenticating the client
        # Usually Django REST framework returns 401/403 for protected views.
        
        # Using a dummy client without login should fail or redirect
        response = self.client.get('/api/friends/')  # Assuming this endpoint is protected based on previous scripts
        
        # Depending on configuration, it could be 401 (Unauthorized), 403 (Forbidden), or 302 (Redirect to login)
        self.assertIn(response.status_code, [302, 401, 403])

    def test_usability_graceful_errors(self):
        """System Usability: Invalid data is handled gracefully"""
        from django.core.exceptions import ValidationError
        
        # Attempt to create a story without required fields
        # It should raise ValidationError, not crash the server with a raw 500 DB error
        with self.assertRaises(ValidationError):
            story = Story(author=self.user)  # Missing title and content
            story.full_clean()  # This triggers model validation

    def test_performance_query_speed(self):
        """System Performance: Library queries resolve quickly"""
        # Create a few more stories to query
        for i in range(5):
            Story.objects.create(
                title=f"Bulk Story {i}",
                author=self.user,
                content="Content",
                is_published=True
            )
        
        start_time = time.time()
        
        # Perform query
        stories = list(Story.objects.filter(is_published=True).order_by('-date_created')[:10])
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        # Assert the database query is fast (e.g., under 100ms)
        self.assertLess(execution_time, 0.1)
        self.assertEqual(len(stories), 6)  # 1 original + 5 new

    def test_reliability_data_integrity(self):
        """System Reliability: Constraints prevent duplicate entries"""
        from django.db import IntegrityError
        
        # Create a friendship
        Friendship.objects.create(sender=self.user, receiver=User.objects.create_user('other', 'pass'))
        
        # Attempt to create duplicate friendship (violates unique_together)
        with self.assertRaises(IntegrityError):
            Friendship.objects.create(sender=self.user, receiver=User.objects.get(username='other'))
