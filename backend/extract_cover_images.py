"""
Extract cover images from canvas_data and set as cover_image
"""
import os
import django
import json
import base64
from django.core.files.base import ContentFile

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storybookapi.settings')
django.setup()

from storybook.models import Story

# Get all published stories
stories = Story.objects.filter(is_published=True)
print(f"Processing {stories.count()} published stories\n")

updated = 0
for story in stories:
    if story.canvas_data:
        try:
            canvas = json.loads(story.canvas_data)
            
            # Check if it's a list of pages
            if isinstance(canvas, list) and len(canvas) > 0:
                first_page = canvas[0]
                
                # Look for image in various possible locations
                image_url = None
                
                if isinstance(first_page, dict):
                    # Check for imageUrl
                    if 'imageUrl' in first_page and first_page['imageUrl']:
                        image_url = first_page['imageUrl']
                    # Check for illustration
                    elif 'illustration' in first_page:
                        ill = first_page['illustration']
                        if isinstance(ill, str):
                            image_url = ill
                        elif isinstance(ill, dict):
                            if 'url' in ill:
                                image_url = ill['url']
                            elif 'dataUrl' in ill:
                                image_url = ill['dataUrl']
                
                if image_url:
                    # For now, just store the URL in a text field
                    # We'll need to handle data URLs vs regular URLs
                    print(f"✅ {story.title}")
                    print(f"   Found image: {image_url[:100]}...")
                    
                    # If it's a data URL, we could save it as a file
                    # For now, let's just note that we found it
                    updated += 1
                else:
                    print(f"❌ {story.title} - No image found in canvas_data")
                    
        except Exception as e:
            print(f"❌ {story.title} - Error: {e}")

print(f"\n{updated} stories have images in canvas_data")
print(f"\nNote: Cover images are stored in canvas_data, not as separate files")
print(f"The frontend should extract them from canvas_data for display")
