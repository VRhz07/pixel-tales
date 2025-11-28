"""
Check canvas_data for cover images
"""
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storybookapi.settings')
django.setup()

from storybook.models import Story

# Get first published story
story = Story.objects.filter(is_published=True).first()

if story:
    print(f"Story: {story.title}")
    print(f"Cover Image field: {story.cover_image}")
    print(f"\nCanvas Data length: {len(story.canvas_data) if story.canvas_data else 0}")
    
    if story.canvas_data:
        try:
            canvas = json.loads(story.canvas_data)
            print(f"Canvas Data type: {type(canvas)}")
            
            if isinstance(canvas, dict):
                print(f"Canvas keys: {canvas.keys()}")
                
                # Check for pages
                if 'pages' in canvas:
                    print(f"\nNumber of pages: {len(canvas['pages'])}")
                    if canvas['pages']:
                        first_page = canvas['pages'][0]
                        print(f"First page keys: {first_page.keys()}")
                        
                        # Check for illustration
                        if 'illustration' in first_page:
                            ill = first_page['illustration']
                            print(f"\nIllustration type: {type(ill)}")
                            if isinstance(ill, str):
                                print(f"Illustration preview: {ill[:200]}...")
                            elif isinstance(ill, dict):
                                print(f"Illustration keys: {ill.keys()}")
                                if 'url' in ill:
                                    print(f"Illustration URL: {ill['url']}")
                                if 'dataUrl' in ill:
                                    print(f"Has dataUrl: Yes (length: {len(ill['dataUrl'])})")
                        
                        # Check for imageUrl
                        if 'imageUrl' in first_page:
                            print(f"\nImage URL: {first_page['imageUrl'][:200]}...")
                            
        except json.JSONDecodeError as e:
            print(f"Error parsing canvas_data: {e}")
