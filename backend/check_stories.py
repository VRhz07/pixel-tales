"""
Check story data in database
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storybookapi.settings')
django.setup()

from storybook.models import Story

# Get all published stories
stories = Story.objects.filter(is_published=True)
print(f"Published stories: {stories.count()}\n")

for story in stories:
    print(f"Title: {story.title}")
    print(f"  Language: {story.language}")
    print(f"  Category: {story.category}")
    print(f"  Genres: {story.genres}")
    print(f"  Cover Image: {story.cover_image}")
    print(f"  Content preview: {story.content[:100] if story.content else 'No content'}...")
    print()

# Check for Tagalog stories
print("\n=== Checking for Tagalog content ===")
tagalog_keywords = ['ang', 'mga', 'sa', 'ng', 'ay', 'si']
for story in stories:
    content_lower = story.content.lower() if story.content else ''
    title_lower = story.title.lower()
    
    # Check if title or content has Tagalog keywords
    has_tagalog = any(keyword in title_lower or keyword in content_lower for keyword in tagalog_keywords)
    
    if has_tagalog:
        print(f"\n🇵🇭 Likely Tagalog story: {story.title}")
        print(f"   Current language: {story.language}")
        print(f"   Should be: tl")
        
        # Update to Tagalog
        story.language = 'tl'
        story.save()
        print(f"   ✅ Updated to Tagalog")
