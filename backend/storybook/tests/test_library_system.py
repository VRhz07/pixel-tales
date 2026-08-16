from django.test import TestCase
from django.contrib.auth.models import User
from storybook.models import Story, SavedStory, StoryRead

class LibrarySystemTestCase(TestCase):
    def setUp(self):
        self.author = User.objects.create_user(username='author', password='password123')
        self.reader = User.objects.create_user(username='reader', password='password123')
        
        self.story = Story.objects.create(
            title="Library Test Story",
            author=self.author,
            content="This story is in the library.",
            is_published=True
        )

    def test_save_story_to_library(self):
        """Test that a user can save a story to their library."""
        saved_story = SavedStory.objects.create(
            user=self.reader,
            story=self.story
        )
        
        self.assertEqual(SavedStory.objects.filter(user=self.reader).count(), 1)
        self.assertEqual(saved_story.story.title, "Library Test Story")

    def test_read_story_tracking(self):
        """Test tracking when a user reads a story."""
        story_read = StoryRead.objects.create(
            user=self.reader,
            story=self.story
        )
        
        self.assertEqual(StoryRead.objects.filter(user=self.reader).count(), 1)
        
        # Verify uniqueness constraint handles re-reading (in views we'd use get_or_create)
        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            StoryRead.objects.create(
                user=self.reader,
                story=self.story
            )
