import json
from django.test import TestCase
from django.contrib.auth.models import User
from storybook.models import Story

class StoryCreationTestCase(TestCase):
    def setUp(self):
        # Create a test user
        self.user = User.objects.create_user(
            username='testauthor', 
            password='testpassword'
        )

    def test_manual_story_creation(self):
        """Test that a story can be created manually and saved correctly."""
        story = Story.objects.create(
            title="A Test Story",
            author=self.user,
            content="Once upon a time in a test database...",
            canvas_data=json.dumps({"objects": []}),
            category="adventure",
            creation_type="manual",
            is_published=True
        )

        # Retrieve from DB
        saved_story = Story.objects.get(id=story.id)
        
        self.assertEqual(saved_story.title, "A Test Story")
        self.assertEqual(saved_story.author, self.user)
        self.assertTrue(saved_story.is_published)
        self.assertEqual(saved_story.creation_type, "manual")
        
    def test_required_fields(self):
        """Test that missing required fields raise validation errors or exceptions."""
        from django.core.exceptions import ValidationError
        
        with self.assertRaises(Exception):
            # Missing author
            Story.objects.create(
                title="Missing Author",
                content="This should fail"
            )
