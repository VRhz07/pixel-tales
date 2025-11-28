"""
Check where cover images are actually stored
"""
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storybookapi.settings')
django.setup()

from storybook.models import Story

# Get stories that show in the screenshot
story_titles = [
    "Ang Taong Bukas",
    "Sparky's Sky Secret", 
    "Pip's Puddle Peril",
    "Sparkle's Starry Flight"
]

for title in story_titles:
    story = Story.objects.filter(title__icontains=title).first()
    if story:
        print(f"\n{'='*60}")
        print(f"Story: {story.title}")
        print(f"{'='*60}")
        print(f"cover_image field: '{story.cover_image}'")
        
        # Check canvas_data
        if story.canvas_data:
            try:
                canvas = json.loads(story.canvas_data)
                print(f"\nCanvas data type: {type(canvas)}")
                
                if isinstance(canvas, list):
                    print(f"Number of pages: {len(canvas)}")
                    if len(canvas) > 0:
                        first_page = canvas[0]
                        print(f"\nFirst page type: {type(first_page)}")
                        
                        if isinstance(first_page, dict):
                            print(f"First page keys: {list(first_page.keys())}")
                            
                            # Check all possible image locations
                            for key in ['imageUrl', 'illustration', 'image', 'coverImage', 'illustrationUrl']:
                                if key in first_page:
                                    value = first_page[key]
                                    if isinstance(value, str):
                                        print(f"\n✅ Found {key}:")
                                        if value.startswith('data:image'):
                                            print(f"   Type: Data URL")
                                            print(f"   Length: {len(value)} chars")
                                            print(f"   Preview: {value[:100]}...")
                                        elif value.startswith('http'):
                                            print(f"   Type: HTTP URL")
                                            print(f"   URL: {value}")
                                        else:
                                            print(f"   Type: Unknown")
                                            print(f"   Value: {value[:200]}...")
                                    elif isinstance(value, dict):
                                        print(f"\n✅ Found {key} (object):")
                                        print(f"   Keys: {list(value.keys())}")
                                        
            except Exception as e:
                print(f"Error parsing canvas_data: {e}")
