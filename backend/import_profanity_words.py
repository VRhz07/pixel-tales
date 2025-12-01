"""
Import profanity words from JSON file to database
Run: python import_profanity_words.py

This script can be used on Render or any environment to import profanity words
"""
import os
import django
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storybookapi.settings')
django.setup()

from storybook.models import ProfanityWord

def import_profanity_words(filename='profanity_words_export.json'):
    """Import profanity words from JSON file"""
    
    print(f"📥 Importing profanity words from {filename}...")
    
    # Check if file exists
    if not os.path.exists(filename):
        print(f"❌ Error: File '{filename}' not found!")
        print("   Please make sure profanity_words_export.json is in the same directory.")
        return
    
    # Load data from file
    with open(filename, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    words_data = data.get('words', [])
    print(f"\n📋 Found {len(words_data)} words in export file")
    print(f"   Exported at: {data.get('exported_at', 'Unknown')}")
    
    # Import words
    added_count = 0
    updated_count = 0
    skipped_count = 0
    
    for word_data in words_data:
        word_text = word_data['word'].lower().strip()
        
        try:
            # Check if word already exists
            existing_word = ProfanityWord.objects.filter(word=word_text).first()
            
            if existing_word:
                # Update existing word if data is different
                updated = False
                if existing_word.language != word_data['language']:
                    existing_word.language = word_data['language']
                    updated = True
                if existing_word.severity != word_data['severity']:
                    existing_word.severity = word_data['severity']
                    updated = True
                if existing_word.is_active != word_data['is_active']:
                    existing_word.is_active = word_data['is_active']
                    updated = True
                
                if updated:
                    existing_word.save()
                    updated_count += 1
                    print(f"  🔄 Updated: {word_text}")
                else:
                    skipped_count += 1
                    print(f"  ⏭️  Skipped: {word_text} (no changes)")
            else:
                # Create new word
                ProfanityWord.objects.create(
                    word=word_text,
                    language=word_data['language'],
                    severity=word_data['severity'],
                    is_active=word_data['is_active']
                )
                added_count += 1
                print(f"  ✅ Added: {word_text}")
                
        except Exception as e:
            print(f"  ❌ Error with '{word_text}': {str(e)}")
    
    # Print summary
    print(f"\n✅ Import complete!")
    print(f"   Added: {added_count} words")
    print(f"   Updated: {updated_count} words")
    print(f"   Skipped: {skipped_count} words")
    print(f"   Total in database: {ProfanityWord.objects.count()} words")

if __name__ == '__main__':
    import_profanity_words()
