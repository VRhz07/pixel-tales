"""
Extract cover images from canvasData and set as cover_image field
"""
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storybookapi.settings')
django.setup()

from storybook.models import Story

# Get all stories
stories = Story.objects.all()
print(f"Processing {stories.count()} stories\n")

updated = 0
for story in stories:
    if story.canvas_data:
        try:
            canvas = json.loads(story.canvas_data)
            
            if isinstance(canvas, list) and len(canvas) > 0:
                first_page = canvas[0]
                
                if isinstance(first_page, dict) and 'canvasData' in first_page:
                    canvas_data = first_page['canvasData']
                    
                    # Check if it's a URL string (Pollinations.ai image)
                    if isinstance(canvas_data, str) and canvas_data.startswith('http'):
                        # Set this as the cover_image
                        story.cover_image = canvas_data
                        story.save()
                        
                        print(f"✅ {story.title}")
                        print(f"   Cover: {canvas_data[:100]}...")
                        updated += 1
                        
        except Exception as e:
            print(f"❌ {story.title} - Error: {e}")

print(f"\n✅ Updated {updated} stories with cover images from canvasData")
