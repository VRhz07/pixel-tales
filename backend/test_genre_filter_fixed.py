"""
Test genre filtering with Python-based approach
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storybookapi.settings')
django.setup()

from storybook.models import Story

# Get all published stories
stories = Story.objects.filter(is_published=True)
print(f"Total published stories: {stories.count()}\n")

# Test filtering by 'fantasy' using Python
print("=== Testing filter: category='fantasy' (Python approach) ===")
category = 'fantasy'
all_stories = list(stories)
filtered_ids = []
for story in all_stories:
    if story.category == category or (story.genres and category in story.genres):
        filtered_ids.append(story.id)

fantasy_stories = stories.filter(id__in=filtered_ids) if filtered_ids else stories.none()
print(f"Found {fantasy_stories.count()} fantasy stories:")
for story in fantasy_stories:
    print(f"  - {story.title} (category: {story.category}, genres: {story.genres})")

# Test filtering by 'adventure'
print("\n=== Testing filter: category='adventure' ===")
category = 'adventure'
all_stories = list(stories)
filtered_ids = []
for story in all_stories:
    if story.category == category or (story.genres and category in story.genres):
        filtered_ids.append(story.id)

adventure_stories = stories.filter(id__in=filtered_ids) if filtered_ids else stories.none()
print(f"Found {adventure_stories.count()} adventure stories:")
for story in adventure_stories:
    print(f"  - {story.title} (category: {story.category}, genres: {story.genres})")

# Test with a story that has multiple genres
print("\n=== Creating test story with multiple genres ===")
test_story = Story.objects.create(
    title="Test Multi-Genre Story",
    author_id=1,
    content="Test content",
    canvas_data="[]",
    category="fantasy",
    genres=["fantasy", "adventure", "mystery"],
    is_published=True
)
print(f"Created: {test_story.title}")
print(f"  Category: {test_story.category}")
print(f"  Genres: {test_story.genres}")

# Test filtering this story by each genre
for genre in ["fantasy", "adventure", "mystery"]:
    all_stories = list(Story.objects.filter(is_published=True))
    filtered_ids = []
    for story in all_stories:
        if story.category == genre or (story.genres and genre in story.genres):
            filtered_ids.append(story.id)
    
    result = Story.objects.filter(id__in=filtered_ids) if filtered_ids else Story.objects.none()
    found = test_story.id in [s.id for s in result]
    print(f"\n  Filter by '{genre}': {'✅ FOUND' if found else '❌ NOT FOUND'}")

# Clean up
test_story.delete()
print("\n✅ Test story deleted")
