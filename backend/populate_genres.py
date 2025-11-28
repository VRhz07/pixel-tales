"""
Script to populate genres field for existing stories
Run with: python manage.py shell < populate_genres.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storybookapi.settings')
django.setup()

from storybook.models import Story

# Get all stories
stories = Story.objects.all()
print(f"Total stories: {stories.count()}")

# Update stories that don't have genres set
updated = 0
for story in stories:
    if not story.genres or len(story.genres) == 0:
        # Set genres to include the category
        story.genres = [story.category]
        story.save()
        updated += 1
        print(f"Updated story '{story.title}' - genres: {story.genres}")

print(f"\nUpdated {updated} stories with genres from category field")

# Show sample
published = Story.objects.filter(is_published=True).first()
if published:
    print(f"\nSample published story:")
    print(f"  Title: {published.title}")
    print(f"  Category: {published.category}")
    print(f"  Genres: {published.genres}")
    print(f"  Language: {published.language}")
    print(f"  Cover: {published.cover_image}")
