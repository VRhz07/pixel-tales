"""
Check canvasData for images
"""
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storybookapi.settings')
django.setup()

from storybook.models import Story

# Get first story
story = Story.objects.filter(title__icontains="Sparky").first()

if story and story.canvas_data:
    canvas = json.loads(story.canvas_data)
    
    if isinstance(canvas, list) and len(canvas) > 0:
        first_page = canvas[0]
        
        if 'canvasData' in first_page:
            canvas_data = first_page['canvasData']
            print(f"canvasData type: {type(canvas_data)}")
            
            if isinstance(canvas_data, str):
                # Try to parse it
                try:
                    parsed = json.loads(canvas_data)
                    print(f"Parsed canvasData type: {type(parsed)}")
                    
                    if isinstance(parsed, dict):
                        print(f"Keys: {list(parsed.keys())}")
                        
                        # Check for backgroundImage
                        if 'backgroundImage' in parsed:
                            bg = parsed['backgroundImage']
                            print(f"\n✅ Found backgroundImage:")
                            print(f"   Type: {type(bg)}")
                            if isinstance(bg, dict):
                                print(f"   Keys: {list(bg.keys())}")
                                if 'src' in bg:
                                    src = bg['src']
                                    if src.startswith('data:image'):
                                        print(f"   ✅ Has data URL image!")
                                        print(f"   Length: {len(src)} chars")
                                        print(f"   Preview: {src[:100]}...")
                                    else:
                                        print(f"   URL: {src}")
                        
                        # Check for objects
                        if 'objects' in parsed:
                            print(f"\n✅ Found objects: {len(parsed['objects'])} items")
                            for i, obj in enumerate(parsed['objects'][:3]):
                                if isinstance(obj, dict) and 'type' in obj:
                                    print(f"   Object {i}: {obj['type']}")
                                    if obj['type'] == 'image' and 'src' in obj:
                                        print(f"      Has image src!")
                                        
                except Exception as e:
                    print(f"Error parsing canvasData: {e}")
                    print(f"canvasData preview: {canvas_data[:500]}...")
