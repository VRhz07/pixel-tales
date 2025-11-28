"""
Test genre filtering
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storybookapi.settings')
django.setup()

from storybook.models import Story
from django.db.models import Q

# Get all published stories
stories = Story.objects.filter(is_published=True)
print(f"Total published stories: {stories.count()}\n")

# Show all genres
print("=== All Story Genres ===")
for story in stories:
    print(f"{story.title}")
    print(f"  Category: {story.category}")
    print(f"  Genres: {story.genres}")
    print()

# Test filtering by 'fantasy'
print("\n=== Testing filter: category='fantasy' ===")
fantasy_stories = stories.filter(
    Q(category='fantasy') | Q(genres__contains='fantasy')
)
print(f"Found {fantasy_stories.count()} fantasy stories:")
for story in fantasy_stories:
    print(f"  - {story.title} (category: {story.category}, genres: {story.genres})")

# Test filtering by 'adventure'
print("\n=== Testing filter: category='adventure' ===")
adventure_stories = stories.filter(
    Q(category='adventure') | Q(genres__contains='adventure')
)
print(f"Found {adventure_stories.count()} adventure stories:")
for story in adventure_stories:
    print(f"  - {story.title} (category: {story.category}, genres: {story.genres})")

# Test filtering by 'mystery'
print("\n=== Testing filter: category='mystery' ===")
mystery_stories = stories.filter(
    Q(category='mystery') | Q(genres__contains='mystery')
)
print(f"Found {mystery_stories.count()} mystery stories:")
for story in mystery_stories:
    print(f"  - {story.title} (category: {story.category}, genres: {story.genres})")
