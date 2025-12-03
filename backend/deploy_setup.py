"""
Automatic deployment setup script
This runs automatically on Render during deployment
No shell access needed!
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storybookapi.settings')
django.setup()

from storybook.models import ProfanityWord
import json

def import_profanity_words():
    """Import profanity words if export file exists"""
    print("\n📥 Checking for profanity words import...")
    
    filename = 'profanity_words_export.json'
    if not os.path.exists(filename):
        print("⏭️  No profanity export file found, skipping import")
        return
    
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        words_data = data.get('words', [])
        print(f"📋 Found {len(words_data)} words in export file")
        
        added = 0
        updated = 0
        skipped = 0
        
        for word_data in words_data:
            word_text = word_data['word'].lower().strip()
            
            existing = ProfanityWord.objects.filter(word=word_text).first()
            
            if existing:
                # Check if update needed
                needs_update = (
                    existing.language != word_data['language'] or
                    existing.severity != word_data['severity'] or
                    existing.is_active != word_data['is_active']
                )
                
                if needs_update:
                    existing.language = word_data['language']
                    existing.severity = word_data['severity']
                    existing.is_active = word_data['is_active']
                    existing.save()
                    updated += 1
                else:
                    skipped += 1
            else:
                ProfanityWord.objects.create(
                    word=word_text,
                    language=word_data['language'],
                    severity=word_data['severity'],
                    is_active=word_data['is_active']
                )
                added += 1
        
        print(f"✅ Import complete!")
        print(f"   Added: {added} words")
        print(f"   Updated: {updated} words")
        print(f"   Skipped: {skipped} words")
        print(f"   Total: {ProfanityWord.objects.count()} words in database")
        
    except Exception as e:
        print(f"❌ Error importing profanity words: {str(e)}")

def populate_achievements():
    """Populate achievements if not already present"""
    print("\n📊 Checking achievements...")
    
    try:
        from storybook.models import Achievement
        from django.core.management import call_command
        
        existing_count = Achievement.objects.count()
        print(f"   Found {existing_count} existing achievements")
        
        if existing_count >= 100:
            print("✅ Achievements already populated!")
            return
        
        print("   Populating achievements...")
        call_command('populate_achievements')
        
        final_count = Achievement.objects.count()
        print(f"✅ Achievement population complete! Total: {final_count}")
        
    except Exception as e:
        print(f"⚠️ Warning: Could not populate achievements: {str(e)}")
        print("   You can run manually: python manage.py populate_achievements")

def main():
    """Main deployment setup"""
    print("=" * 50)
    print("🚀 Render Deployment Setup")
    print("=" * 50)
    print("Note: Migrations are handled by build.sh")
    print("")
    
    # Import profanity words if available
    import_profanity_words()
    
    # Populate achievements
    populate_achievements()
    
    print("\n" + "=" * 50)
    print("✅ Deployment setup complete!")
    print("=" * 50)

if __name__ == '__main__':
    main()
