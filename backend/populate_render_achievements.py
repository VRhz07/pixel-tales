"""
Script to populate achievements on Render deployment
Run this after deployment to ensure achievements exist
"""
import django
import os
import sys

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storybookapi.settings')
django.setup()

from storybook.models import Achievement
import json

def populate_achievements():
    """Populate achievements from JSON file"""
    print("🎯 Starting achievement population...")
    
    # Check if achievements already exist
    existing_count = Achievement.objects.count()
    print(f"📊 Found {existing_count} existing achievements")
    
    if existing_count >= 100:
        print("✅ Achievements already populated! Skipping.")
        return
    
    # Clear existing achievements
    if existing_count > 0:
        print("🗑️ Clearing existing achievements...")
        Achievement.objects.all().delete()
    
    # Load achievements from JSON file
    json_path = os.path.join(
        os.path.dirname(__file__), 
        'storybook/management/commands/achievements_data.json'
    )
    
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            achievements = json.load(f)
        
        print(f"📁 Loaded {len(achievements)} achievements from JSON")
        
        # Create achievements
        created_count = 0
        for ach in achievements:
            Achievement.objects.create(**ach)
            created_count += 1
        
        print(f"✅ Successfully created {created_count} achievements!")
        
        # Verify
        final_count = Achievement.objects.count()
        print(f"📊 Final count: {final_count} achievements in database")
        
    except FileNotFoundError:
        print(f"❌ Error: Could not find {json_path}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    populate_achievements()
