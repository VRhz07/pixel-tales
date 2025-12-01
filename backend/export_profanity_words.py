"""
Export profanity words from local database to JSON file
Run: python export_profanity_words.py
"""
import os
import django
import json
from datetime import datetime

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storybookapi.settings')
django.setup()

from storybook.models import ProfanityWord

def export_profanity_words():
    """Export all profanity words to JSON file"""
    
    print("📤 Exporting profanity words from local database...")
    
    # Get all profanity words
    words = ProfanityWord.objects.all().order_by('language', 'word')
    
    # Convert to list of dictionaries
    words_data = []
    for word in words:
        words_data.append({
            'word': word.word,
            'language': word.language,
            'severity': word.severity,
            'is_active': word.is_active,
        })
    
    # Create export data with metadata
    export_data = {
        'exported_at': datetime.now().isoformat(),
        'total_words': len(words_data),
        'words': words_data
    }
    
    # Save to JSON file
    filename = 'profanity_words_export.json'
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(export_data, f, indent=2, ensure_ascii=False)
    
    # Print statistics
    print(f"\n✅ Export complete!")
    print(f"   File: {filename}")
    print(f"   Total words: {len(words_data)}")
    
    # Language breakdown
    by_language = {}
    for word_data in words_data:
        lang = word_data['language']
        by_language[lang] = by_language.get(lang, 0) + 1
    
    print(f"\n📊 Breakdown by language:")
    for lang, count in sorted(by_language.items()):
        lang_name = {'en': 'English', 'tl': 'Tagalog', 'both': 'Both'}.get(lang, lang)
        print(f"   {lang_name}: {count} words")
    
    # Severity breakdown
    by_severity = {}
    for word_data in words_data:
        sev = word_data['severity']
        by_severity[sev] = by_severity.get(sev, 0) + 1
    
    print(f"\n📊 Breakdown by severity:")
    for sev, count in sorted(by_severity.items()):
        print(f"   {sev.capitalize()}: {count} words")
    
    # Active/Inactive
    active_count = sum(1 for w in words_data if w['is_active'])
    inactive_count = len(words_data) - active_count
    print(f"\n📊 Status:")
    print(f"   Active: {active_count} words")
    print(f"   Inactive: {inactive_count} words")

if __name__ == '__main__':
    export_profanity_words()
